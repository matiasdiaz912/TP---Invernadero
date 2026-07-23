import {
    CONSUMO_TRIPULANTE, DIAS_SIN_COMER,
    COSECHAS_POR_NIVEL, ENTREGA_POR_NIVEL,
    PROB_EVENTO_POR_DIA, REGEN_NUTRIENTES_POR_DIA
} from './constantes.js'

function clampCero(RECURSOS) {
    for (const k of Object.keys(RECURSOS)) {
        if (RECURSOS[k] < 0) RECURSOS[k] = 0
    }
}

export function regenerarNutrientes(RECURSOS) {
    RECURSOS.cant_nutrientes += REGEN_NUTRIENTES_POR_DIA
}

// 15% por dia. Devuelve el evento aplicado o null. rnd inyectable para testear.
export function tirarEvento(RECURSOS, EVENTOS, rnd = Math.random) {
    if (rnd() >= PROB_EVENTO_POR_DIA) return null
    const evento = EVENTOS[Math.floor(rnd() * EVENTOS.length)]
    RECURSOS.cant_agua += evento.efectos.agua
    RECURSOS.cant_oxigeno += evento.efectos.oxigeno
    RECURSOS.cant_energia += evento.efectos.energia
    RECURSOS.cant_nutrientes += evento.efectos.nutrientes
    clampCero(RECURSOS)
    return evento
}

// Consumo diario + progresion de hambre. Muta RECURSOS y ESTADO.
export function procesarTripulacion(RECURSOS, ESTADO) {
    const mensajes = []
    const t = ESTADO.tripulantes
    if (t <= 0) return mensajes

    const necesita_comida = t * CONSUMO_TRIPULANTE.comida
    const comio = RECURSOS.cant_comida >= necesita_comida

    RECURSOS.cant_comida -= necesita_comida
    RECURSOS.cant_agua -= t * CONSUMO_TRIPULANTE.agua
    RECURSOS.cant_oxigeno -= t * CONSUMO_TRIPULANTE.oxigeno
    clampCero(RECURSOS)

    ESTADO.dias_sin_comer = comio ? 0 : ESTADO.dias_sin_comer + 1

    if (ESTADO.dias_sin_comer >= DIAS_SIN_COMER.critico) ESTADO.estado_tripulacion = "critico"
    else if (ESTADO.dias_sin_comer >= DIAS_SIN_COMER.desnutrido) ESTADO.estado_tripulacion = "desnutrido"
    else ESTADO.estado_tripulacion = "sano"

    if (ESTADO.dias_sin_comer > DIAS_SIN_COMER.muerte) {
        ESTADO.tripulantes = Math.max(0, ESTADO.tripulantes - 1)
        mensajes.push({ mensaje: `Un tripulante murió de hambre. Quedan ${ESTADO.tripulantes}.`, tipo: "alerta" })
    } else if (!comio) {
        const d = ESTADO.dias_sin_comer
        mensajes.push({ mensaje: `La tripulación no comió (${d} ${d === 1 ? "día" : "días"} sin comer)`, tipo: "alerta" })
    }

    return mensajes
}

// Sube de nivel segun las cosechas acumuladas. Puede subir varios de una.
export function actualizarNivel(RECURSOS, ESTADO) {
    const mensajes = []
    while (ESTADO.nivel + 1 < COSECHAS_POR_NIVEL.length &&
           ESTADO.total_cosechas >= COSECHAS_POR_NIVEL[ESTADO.nivel + 1]) {
        ESTADO.nivel++
        RECURSOS.cant_agua += ENTREGA_POR_NIVEL.agua
        RECURSOS.cant_energia += ENTREGA_POR_NIVEL.energia
        RECURSOS.cant_nutrientes += ENTREGA_POR_NIVEL.nutrientes
        mensajes.push({ mensaje: `¡Subiste al nivel ${ESTADO.nivel}! La base recibió recursos nuevos.`, tipo: "info" })
    }
    return mensajes
}
