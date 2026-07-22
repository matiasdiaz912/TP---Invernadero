import pool from './db/my_postgre.js'
import express from 'express'
import cors from 'cors'
import { CANT_COMIDA, CANT_AGUA, CANT_OXIGENO, CANT_NUTRIENTES, CANT_ENERGIA } from './constantes.js';

const EVENTOS_ALEATORIOS = [
    {
        id: "tormenta_arena",
        nombre: "Tormenta de Arena Marciana",
        descripcion: "El polvo denso bloquea los paneles solares y satura los filtros.",
        tipo: "negativo",
        efectos: { energia: -15, oxigeno: -5, agua: 0, nutrientes: 0 }
    },
    {
        id: "fuga_tanques",
        nombre: "Microrrotura en Tanques",
        descripcion: "La fatiga del material provocó una leve fuga de líquidos antes de ser sellada.",
        tipo: "negativo",
        efectos: { energia: 0, oxigeno: 0, agua: -8, nutrientes: 0 }
    },
    {
        id: "plaga_hongos",
        nombre: "Contaminación Fúngica",
        descripcion: "Un hongo resistente está consumiendo los sustratos de los módulos.",
        tipo: "negativo",
        efectos: { energia: 0, oxigeno: 0, agua: 0, nutrientes: -5 }
    },
    {
        id: "vientos_optimos",
        nombre: "Corrientes de Viento Óptimas",
        descripcion: "Las turbinas eólicas auxiliares operaron a máxima capacidad esta noche.",
        tipo: "positivo",
        efectos: { energia: +10, oxigeno: 0, agua: 0, nutrientes: 0 }
    },
    {
        id: "hielo_subterraneo",
        nombre: "Veta de Hielo Encontrada",
        descripcion: "El rover automatizado extrajo un bloque de permafrost marciano.",
        tipo: "positivo",
        efectos: { energia: -2, oxigeno: 0, agua: +12, nutrientes: 0 }
    },
    {
        id: "falla_electrica",
        nombre: "Cortocircuito en Soporte Vital",
        descripcion: "Los sistemas de purificación se detuvieron temporalmente.",
        tipo: "negativo",
        efectos: { energia: -5, oxigeno: -10, agua: 0, nutrientes: 0 }
    }
];


let RECURSOS = {
    cant_agua: CANT_AGUA,
    cant_oxigeno: CANT_OXIGENO,
    cant_energia: CANT_ENERGIA,
    cant_nutrientes: CANT_NUTRIENTES,
    cant_comida: CANT_COMIDA
}


const ESPECIES = [
    {
        id: 1,
        nombre: "Tomate",
        tamanio: 1,
        agua_requerida: 5,
        oxigeno_requerido: 1,
        nutrientes_requeridos: 2,
        oxigeno_generado: 0,
        nutrientes_generados: 1,
        comida_generada: 4,
        duracion: 5,
        agua_producida: 15,
        nivel_requerido: 1,
        pathSvg: '<circle cx="50" cy="40" r="15"/><path d="M50 25 V15 M40 15 Q50 20 60 15"/>'
    },

    {
        id: 2,
        nombre: "Lechuga",
        tamanio: 1,
        agua_requerida: 7,
        oxigeno_requerido: 0.5,
        nutrientes_requeridos: 1,
        nutrientes_generados: 0.5,
        oxigeno_generado: 0,
        comida_generada: 7,
        duracion: 3,
        agua_producida: 15,
        nivel_requerido: 1,
        pathSvg: '<path d="M50 80 Q30 60 40 30 Q50 10 60 30 Q70 60 50 80 Z"/><path d="M50 80 V30"/>'
    },

    {
        id: 3,
        nombre: "Papa",
        tamanio: 2,
        agua_requerida: 3,
        oxigeno_requerido: 1.5,
        nutrientes_requeridos: 3,
        nutrientes_generados: 0,
        oxigeno_generado: 0,
        comida_generada: 12,
        duracion: 8,
        agua_producida: 15,
        nivel_requerido: 2,
        pathSvg: '<ellipse cx="50" cy="60" rx="25" ry="18"/><circle cx="40" cy="55" r="2"/><circle cx="60" cy="65" r="1.5"/><path d="M50 42 V20 M35 25 Q50 30 65 25"/>'
    },

    {
        id: 4,
        nombre: "Espirulina",
        tamanio: 1,
        agua_requerida: 4,
        oxigeno_requerido: 0.1,
        nutrientes_requeridos: 1,
        oxigeno_generado: 10,
        nutrientes_generados: 4,
        comida_generada: 18,
        duracion: 2,
        agua_producida: 4,
        nivel_requerido: 4,
        pathSvg: '<rect x="25" y="20" width="50" height="60" rx="5"/><path d="M25 40 Q50 50 75 40 M25 60 Q50 70 75 60" stroke-dasharray="2 2"/>'
    },

]

let PLANTAS = []

let modulos = []

const app = express()

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (req, res) => {
    res.send("Servidor funcionando")
})

app.get("/plantas", (req, res) => {
    res.json(ESPECIES)
})

app.get("/ver_planta/:id", (req, res) => {
    let id = req.params.id

    let planta = ESPECIES.find((planta) => planta.id == parseInt(id))
    res.json(planta)
})

app.get("/evento", (req, res) => {
    let evento = generarEventoAleatorio()
    RECURSOS.cant_agua += evento.efectos.agua
    RECURSOS.cant_oxigeno += evento.efectos.oxigeno
    RECURSOS.cant_energia += evento.efectos.energia
    RECURSOS.cant_nutrientes += evento.efectos.nutrientes
    res.status(200).json(evento)
})

app.get("/recursos", (req, res) => {
    res.status(200).json(RECURSOS)
})

app.post("/modulos", (req, res) => {
    console.log(req.body);
    const modulo_resources = req.body
    let nuevo_modulo = { ...req.body, id: modulos.length + 1, capacidad_max: 2, nivel: 1, cosechas: 0, plantas: [] }
    modulos.push(nuevo_modulo)
    RECURSOS.cant_agua -= modulo_resources.cant_agua
    RECURSOS.cant_energia -= modulo_resources.cant_energia
    RECURSOS.cant_nutrientes -= modulo_resources.cant_nutrientes
    RECURSOS.cant_oxigeno -= modulo_resources.cant_oxigeno
    res.status(201).json(nuevo_modulo)
})

app.get("/modulos", (req, res) => {
    res.json(modulos)
})

app.put("/modulos/:moduloId", (req, res) => {
    const { moduloId } = req.params
    const body = req.body
    let modulo = modulos.find(modulo => modulo.id = moduloId)
    let especie = ESPECIES.find(planta => planta.nombre == body.nombre)
    modulo.plantas = modulo.plantas.filter(planta => planta.id != body.id)
    actualizarRecursos(especie)
    modulo.cosechas++
    ESTADO_JUEGO.total_cosechas++
    if (ESTADO_JUEGO.total_cosechas % 10 == 0 && ESTADO_JUEGO.total_cosechas != 1) {
        ESTADO_JUEGO.nivel++
    }
    res.status(200).json({ nivel: ESTADO_JUEGO.nivel })
})

app.put("/modulos", (req, res) => {
    let modulo = req.body
    if (modulo.cosechas - (10 * modulo.nivel ** modulo.nivel) == 0) {
        log
        modulo.nivel++
        modulo.capacidad_max++
        res.status(200).json({ msg: `El modulo ha sido mejorado al nivel ${modulo.nivel} y ahora tiene capacidad para ${modulo.capacidad_max} plantas`, type: "succes" })
    }

    res.status(200).json({ msg: `Para poder mejorar el modulo necesita ${10 * modulo.nivel ** modulo.nivel} de las ${modulo.cosechas} cosechas actuales`, type: "error" })
})
app.put("/modulos/:moduloId/recursos", (req, res) => {
    const { moduloId } = req.params
    const { agua, nutrientes, energia } = req.body

    let modulo = modulos.find(m => m.id == parseInt(moduloId))
    if (!modulo) return res.status(404).json({ error: "Módulo no encontrado" })

    if (RECURSOS.cant_agua < agua) return res.status(400).json({ error: "No hay suficiente agua disponible" })
    if (RECURSOS.cant_nutrientes < nutrientes) return res.status(400).json({ error: "No hay suficientes nutrientes disponibles" })
    if (RECURSOS.cant_energia < energia) return res.status(400).json({ error: "No hay suficiente energía disponible" })

    modulo.cant_agua += agua
    modulo.cant_nutrientes += nutrientes
    modulo.cant_energia += energia

    RECURSOS.cant_agua -= agua
    RECURSOS.cant_nutrientes -= nutrientes
    RECURSOS.cant_energia -= energia

    res.status(200).json(modulo)
})
app.delete("/modulos/:moduloId", (req, res) => {
    const { moduloId } = req.params
    modulos = modulos.filter(modulo => modulo.id != moduloId)
})

app.get("/modulos/:moduloId/:plantaId", (req, res) => {
    const { moduloId, plantaId } = req.params

    const modulo = modulos.find(m => m.id == parseInt(moduloId))
    const especie = ESPECIES.find(p => p.id == plantaId)

    if (modulo.capacidad_max == modulo.plantas.length) return res.status(404).json({ error: "Modulo a su capacidad maxima" })

    const nueva_planta = {
        id: PLANTAS.length + 1,
        nombre: especie.nombre,
        duracion: especie.duracion,
        estado: "creciendo",
        porcentaje_agua: 100,
        porcentaje_nutrientes: 100,
        porcentaje_energia: 100,
        dias_transcurridos: 0
    }

    PLANTAS.push(nueva_planta)
    modulo.plantas.push(nueva_planta)
    res.status(201).json(nueva_planta)
})

let ESTADO_JUEGO = {
    dia_actual: 0,
    estado: "en_curso",
    total_cosechas: 0,
    tripulantes: 30,
    dias_comida_insuficiente: 0,
    dias_agua_insuficiente: 0,
    dias_oxigeno_insuficiente: 0,
    dias_usados_trajes: 0,
    nivel: 1
}

app.get("/avanzar-dia", (req, res) => {
    let eventos_del_dia = []

    modulos.forEach((modulo) => {
        modulo.plantas.forEach((planta) => {
            let especie = ESPECIES.find(especie => especie.nombre == planta.nombre)
            if (["seca", "perdida"].includes(planta.estado)) return

            if (modulo.cant_agua >= especie.agua_requerida) {
                modulo.cant_agua -= especie.agua_requerida
            } else {
                planta.porcentaje_agua -= 20
            }

            if (modulo.cant_nutrientes >= especie.nutrientes_requeridos) {
                modulo.cant_nutrientes -= especie.nutrientes_requeridos
            } else {
                planta.porcentaje_nutrientes -= 20
            }

            modulo.cant_oxigeno -= especie.oxigeno_requerido

            if (planta.porcentaje_agua <= 0) {
                planta.estado = "seca"
                eventos_del_dia.push({ mensaje: `Una planta de ${planta.nombre} se secó en "${modulo.nombre}"`, tipo: "alerta" })
                return
            }
            if (planta.porcentaje_nutrientes <= 30) {
                planta.estado = "perdida"
                eventos_del_dia.push({ mensaje: `Se perdió una planta de ${planta.nombre} por falta de nutrientes`, tipo: "alerta" })
                return
            }

            RECURSOS.cant_comida += especie.nutrientes_generados || 0

            planta.dias_transcurridos++
            if (planta.dias_transcurridos >= planta.duracion) {
                planta.estado = "lista_para_cosechar"
                RECURSOS.cant_agua += especie.agua_producida
                planta.dias_transcurridos = planta.duracion
                eventos_del_dia.push({ mensaje: `Cosecha lista de ${planta.nombre} en "${modulo.nombre}"`, tipo: "info" })
            }
        })
    })

    if (RECURSOS.cant_comida < 60) {
        ESTADO_JUEGO.dias_comida_insuficiente += 1
        if (ESTADO_JUEGO.dias_comida_insuficiente > 7) {
            ESTADO_JUEGO.tripulantes -= 1
        }
    }
    
    if (RECURSOS.cant_agua < 50 && RECURSOS.cant_agua > 30) {
        ESTADO_JUEGO.dias_agua_insuficiente += 1
        if (ESTADO_JUEGO.dias_agua_insuficiente > 5) {
            ESTADO_JUEGO.tripulantes -= 1
        }
    }else if (RECURSOS.cant_agua < 30 && RECURSOS.cant_agua > 15) {
        ESTADO_JUEGO.dias_agua_insuficiente += 1
        if (ESTADO_JUEGO.dias_agua_insuficiente > 5) {
            ESTADO_JUEGO.tripulantes -= 2
        }
    }else if (RECURSOS.cant_agua < 15 && RECURSOS.cant_agua >= 0) {
        ESTADO_JUEGO.dias_agua_insuficiente += 1
        if (ESTADO_JUEGO.dias_agua_insuficiente > 5) {
            ESTADO_JUEGO.tripulantes -= 3
        }
    }

    if(RECURSOS.cant_oxigeno <= 0){
        ESTADO_JUEGO.dias_oxigeno_insuficiente += 1
    }

    RECURSOS.cant_comida -= ESTADO_JUEGO.tripulantes * 0.1
    RECURSOS.cant_agua -= ESTADO_JUEGO.tripulantes * 0.2
    RECURSOS.cant_oxigeno -= ESTADO_JUEGO.tripulantes * 0.2
    if (RECURSOS.cant_comida < 0) RECURSOS.cant_comida = 0
    if (RECURSOS.cant_agua < 0) RECURSOS.cant_agua = 0

    ESTADO_JUEGO.dia_actual++

    if (ESTADO_JUEGO.tripulantes == 0 || ESTADO_JUEGO.dias_oxigeno_insuficiente == 3) { //SE USAN LOS TRAJES ESPACIALES
        ESTADO_JUEGO.estado = "derrota"
    } else if (ESTADO_JUEGO.dia_actual == 180) {
        ESTADO_JUEGO.estado = "victoria"
    }

    res.status(200).json({
        dia_actual: ESTADO_JUEGO.dia_actual,
        estado: ESTADO_JUEGO.estado,
        recursos: RECURSOS,
        modulos,
        eventos: eventos_del_dia,
        tripulantes: ESTADO_JUEGO.tripulantes
    })
})

app.get("/estado-juego", (req, res) => {
    res.status(200).json(ESTADO_JUEGO)
})




function generarEventoAleatorio() {
    const indiceAleatorio = Math.floor(Math.random() * EVENTOS_ALEATORIOS.length);
    return EVENTOS_ALEATORIOS[indiceAleatorio];
}

function actualizar_dias_planta() {
    modulos.forEach(modulo => {
        modulo.plantas.forEach((planta) => {
            if (planta.dias_transcurridos != planta.duracion) {
                planta.dias_transcurridos += 1
            }
        })
    });
}


app.get("/reiniciar", (req, res) => {
    RECURSOS = {
        cant_agua: CANT_AGUA,
        cant_oxigeno: CANT_OXIGENO,
        cant_energia: CANT_ENERGIA,
        cant_nutrientes: CANT_NUTRIENTES,
        cant_comida: CANT_COMIDA
    }

    ESTADO_JUEGO = {
        dia_actual: 0,
        estado: "en_curso",
        total_cosechas: 0,
        tripulantes: 30,
        dias_comida_insuficiente: 0,
        nivel: 1
    }

    modulos = []
    PLANTAS = []

    res.status(200).json({
        dia_actual: ESTADO_JUEGO.dia_actual,
        estado: ESTADO_JUEGO.estado,
        total_cosechas: ESTADO_JUEGO.total_cosechas,
        recursos: RECURSOS,
        modulos,
        tripulantes: ESTADO_JUEGO.tripulantes
    })
})

function actualizarRecursos(especie) {
    RECURSOS.cant_agua += especie.agua_producida
    RECURSOS.cant_oxigeno += especie.oxigeno_generado
    // RECURSOS.cant_energia += 90
    RECURSOS.cant_nutrientes += especie.nutrientes_generados
    RECURSOS.cant_comida += especie.comida_generada
}

app.listen(3000, () => console.log("Servidor iniciado"))