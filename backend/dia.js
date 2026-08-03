import { ESPECIES, SALUD, MODULO, PLANTA } from './constantes.js'

const VIVA = ["creciendo", "lista_para_cosechar"]

function estaViva(planta) {
    return VIVA.includes(planta.estado)
}

function especieDe(planta, especies) {
    return especies.find(e => e.nombre == planta.nombre)
}

function ajustarBarra(valor, recibio) {
    const nuevo = recibio
        ? valor + SALUD.recuperacion_por_dia
        : valor - SALUD.danio_por_dia
    return Math.max(0, Math.min(SALUD.max, nuevo))
}

function tomarDelModulo(modulo, campo, cantidad) {
    if (modulo[campo] >= cantidad) {
        modulo[campo] -= cantidad
        return true
    }
    return false
}

function calcularEstadoModulo(modulo, especies) {
    const vivas = modulo.plantas.filter(estaViva)

    let pide_energia = 0
    for (const planta of vivas) {
        const especie = especieDe(planta, especies)
        if (especie) pide_energia += especie.energia_requerida
    }

    const critico = pide_energia > 0 && modulo.cant_energia < pide_energia

    const bloques = modulo.capacidad_max || MODULO.bloques_iniciales
    const sobreriego = modulo.cant_agua > bloques * MODULO.agua_max_por_bloque

    return { critico, sobreriego }
}

function procesarPlanta(planta, modulo, RECURSOS, flags, eventos, especies) {
    const especie = especieDe(planta, especies)
    if (!especie) return

    if (planta.estado == "lista_para_cosechar" && !PLANTA.lista_para_cosechar_consume) return

    let recibio_agua = tomarDelModulo(modulo, 'cant_agua', especie.agua_requerida)
    const recibio_nutrientes = tomarDelModulo(modulo, 'cant_nutrientes', especie.nutrientes_requeridos)
    const recibio_energia = tomarDelModulo(modulo, 'cant_energia', especie.energia_requerida)

    // Inundado: aunque el agua alcance, la planta se ahoga igual
    if (flags.sobreriego) recibio_agua = false

    const recibio_oxigeno = tomarDelModulo(modulo, 'cant_oxigeno', especie.oxigeno_requerido)

    planta.porcentaje_agua = ajustarBarra(planta.porcentaje_agua, recibio_agua)
    planta.porcentaje_nutrientes = ajustarBarra(planta.porcentaje_nutrientes, recibio_nutrientes)
    planta.porcentaje_energia = ajustarBarra(planta.porcentaje_energia, recibio_energia)

    if (planta.porcentaje_agua < SALUD.agua_muere) {
        planta.estado = "seca"
        eventos.push({ mensaje: `Una planta de ${planta.nombre} se secó en "${modulo.nombre}"`, tipo: "alerta" })
        return
    }
    if (planta.porcentaje_nutrientes < SALUD.nutrientes_muere) {
        planta.estado = "perdida"
        eventos.push({ mensaje: `Se perdió una planta de ${planta.nombre} por falta de nutrientes`, tipo: "alerta" })
        return
    }
    if (planta.porcentaje_energia < SALUD.energia_muere) {
        planta.estado = "perdida"
        eventos.push({ mensaje: `Se perdió una planta de ${planta.nombre} por falta de energía`, tipo: "alerta" })
        return
    }

    RECURSOS.cant_comida += especie.comida_por_dia
    RECURSOS.cant_oxigeno += especie.oxigeno_por_dia

    const demora =
        planta.porcentaje_agua <= SALUD.agua_normal ||
        planta.porcentaje_nutrientes <= SALUD.nutrientes_normal ||
        planta.porcentaje_energia <= SALUD.energia_normal ||
        !recibio_oxigeno ||
        flags.critico

    if (demora) {
        planta.con_demora = true
        return
    }
    planta.con_demora = false

    if (planta.estado == "lista_para_cosechar") return

    planta.dias_transcurridos++
    if (planta.dias_transcurridos >= especie.duracion) {
        planta.dias_transcurridos = especie.duracion
        planta.estado = "lista_para_cosechar"
        eventos.push({ mensaje: `Cosecha lista de ${planta.nombre} en "${modulo.nombre}"`, tipo: "info" })
    }
}

// `especies` es opcional: si no se pasa, usa el catalogo de constantes.js.
// Con la base de datos se le pasa el catalogo leido de la tabla especies.
export function procesarModulos(modulos, RECURSOS, especies = ESPECIES) {
    const eventos = []

    for (const modulo of modulos) {
        if (modulo.estado == "desechado") {
            if (!MODULO.desechado_se_reusa) continue
            modulo.estado = "estable"
            modulo.dias_en_critico = 0
            eventos.push({ mensaje: `"${modulo.nombre}" fue reacondicionado y vuelve a estar disponible, vacío`, tipo: "info" })
            continue
        }

        if (modulo.dias_en_critico == undefined) modulo.dias_en_critico = 0
        if (modulo.cant_oxigeno == undefined) modulo.cant_oxigeno = 0

        const flags = calcularEstadoModulo(modulo, especies)

        for (const planta of modulo.plantas) {
            if (estaViva(planta)) procesarPlanta(planta, modulo, RECURSOS, flags, eventos, especies)
        }

        if (flags.critico) {
            modulo.estado = "critico"
            modulo.dias_en_critico++
            eventos.push({ mensaje: `"${modulo.nombre}" en estado crítico por falta de energía (${modulo.dias_en_critico}/${MODULO.dias_criticos_para_desechar})`, tipo: "alerta" })
        } else {
            modulo.dias_en_critico = 0
            modulo.estado = flags.sobreriego ? "sobreriego" : "estable"
        }

        if (flags.sobreriego) {
            eventos.push({ mensaje: `"${modulo.nombre}" está en sobreriego: las plantas se están ahogando`, tipo: "alerta" })
        }

        if (modulo.dias_en_critico >= MODULO.dias_criticos_para_desechar) {
            modulo.estado = "desechado"
            modulo.plantas = []
            modulo.cant_agua = 0
            modulo.cant_nutrientes = 0
            modulo.cant_energia = 0
            modulo.cant_oxigeno = 0
            modulo.dias_en_critico = 0
            eventos.push({ mensaje: `"${modulo.nombre}" quedó DESECHADO: se perdió todo lo que tenía adentro`, tipo: "alerta" })
        }
    }

    return eventos
}
