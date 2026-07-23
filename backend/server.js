import pool from './db/my_postgre.js'
import express from 'express'
import cors from 'cors'
import { RECURSOS_INICIALES, ESPECIES, MODULO, TRIPULANTES_INICIALES, DIA_VICTORIA } from './constantes.js';
import { procesarModulos } from './dia.js';
import { tirarEvento, procesarTripulacion, regenerarNutrientes, actualizarNivel } from './base.js';

const EVENTOS_ALEATORIOS = [
    { id: "tormenta_arena", nombre: "Tormenta de Arena Marciana", descripcion: "El polvo denso bloquea los paneles solares y satura los filtros.", tipo: "negativo", efectos: { energia: -15, oxigeno: -5, agua: 0, nutrientes: 0 } },
    { id: "fuga_tanques", nombre: "Microrrotura en Tanques", descripcion: "La fatiga del material provocó una leve fuga de líquidos antes de ser sellada.", tipo: "negativo", efectos: { energia: 0, oxigeno: 0, agua: -8, nutrientes: 0 } },
    { id: "plaga_hongos", nombre: "Contaminación Fúngica", descripcion: "Un hongo resistente está consumiendo los sustratos de los módulos.", tipo: "negativo", efectos: { energia: 0, oxigeno: 0, agua: 0, nutrientes: -5 } },
    { id: "vientos_optimos", nombre: "Corrientes de Viento Óptimas", descripcion: "Las turbinas eólicas auxiliares operaron a máxima capacidad esta noche.", tipo: "positivo", efectos: { energia: +10, oxigeno: 0, agua: 0, nutrientes: 0 } },
    { id: "hielo_subterraneo", nombre: "Veta de Hielo Encontrada", descripcion: "El rover automatizado extrajo un bloque de permafrost marciano.", tipo: "positivo", efectos: { energia: -2, oxigeno: 0, agua: +12, nutrientes: 0 } },
    { id: "falla_electrica", nombre: "Cortocircuito en Soporte Vital", descripcion: "Los sistemas de purificación se detuvieron temporalmente.", tipo: "negativo", efectos: { energia: -5, oxigeno: -10, agua: 0, nutrientes: 0 } }
];

let RECURSOS = { ...RECURSOS_INICIALES }
let PLANTAS = []
let modulos = []

let ESTADO_JUEGO = estadoInicial()

function estadoInicial() {
    return {
        dia_actual: 0,
        estado: "en_curso",
        total_cosechas: 0,
        nivel: 1,
        tripulantes: TRIPULANTES_INICIALES,
        dias_sin_comer: 0,
        estado_tripulacion: "sano"
    }
}

// Bloques ocupados por las plantas que hay adentro (incluye las muertas
// hasta que se eliminan, por eso conviene sacarlas).
function bloquesOcupados(modulo) {
    return modulo.plantas.reduce((suma, planta) => {
        const especie = ESPECIES.find(e => e.nombre == planta.nombre)
        return suma + (especie ? especie.tamanio : 1)
    }, 0)
}

const app = express()
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (req, res) => res.send("Servidor funcionando"))

app.get("/plantas", (req, res) => res.json(ESPECIES))

app.get("/ver_planta/:id", (req, res) => {
    const planta = ESPECIES.find(p => p.id == parseInt(req.params.id))
    res.json(planta)
})

app.get("/evento", (req, res) => {
    const evento = tirarEvento(RECURSOS, EVENTOS_ALEATORIOS, () => 0)
    res.status(200).json(evento)
})

app.get("/recursos", (req, res) => res.status(200).json(RECURSOS))

app.get("/estado-juego", (req, res) => res.status(200).json(ESTADO_JUEGO))

app.post("/modulos", (req, res) => {
    const r = req.body
    const nuevo_modulo = {
        ...r,
        id: modulos.length + 1,
        capacidad_max: MODULO.bloques_iniciales,
        nivel: 1,
        cosechas: 0,
        plantas: [],
        estado: "estable",
        dias_en_critico: 0
    }
    modulos.push(nuevo_modulo)
    RECURSOS.cant_agua -= r.cant_agua
    RECURSOS.cant_energia -= r.cant_energia
    RECURSOS.cant_nutrientes -= r.cant_nutrientes
    RECURSOS.cant_oxigeno -= r.cant_oxigeno
    res.status(201).json(nuevo_modulo)
})

app.get("/modulos", (req, res) => res.json(modulos))

// Cosechar una planta lista de un modulo.
app.put("/modulos/:moduloId", (req, res) => {
    const modulo = modulos.find(m => m.id == req.params.moduloId)
    if (!modulo) return res.status(404).json({ error: "Módulo no encontrado" })

    const planta = modulo.plantas.find(p => p.id == req.body.id)
    if (!planta) return res.status(404).json({ error: "Planta no encontrada" })
    if (planta.estado != "lista_para_cosechar") {
        return res.status(400).json({ error: "La planta todavía no está lista para cosechar" })
    }

    const especie = ESPECIES.find(e => e.nombre == planta.nombre)
    modulo.plantas = modulo.plantas.filter(p => p.id != planta.id)
    RECURSOS.cant_agua += especie.agua_cosecha
    RECURSOS.cant_comida += especie.comida_cosecha

    modulo.cosechas++
    ESTADO_JUEGO.total_cosechas++
    const subidas = actualizarNivel(RECURSOS, ESTADO_JUEGO)

    res.status(200).json({ nivel: ESTADO_JUEGO.nivel, mensajes: subidas })
})

// Transferir recursos de la base a un modulo (a mano).
app.put("/modulos/:moduloId/recursos", (req, res) => {
    const { agua = 0, nutrientes = 0, energia = 0 } = req.body
    const modulo = modulos.find(m => m.id == parseInt(req.params.moduloId))
    if (!modulo) return res.status(404).json({ error: "Módulo no encontrado" })

    if (RECURSOS.cant_agua < agua) return res.status(400).json({ error: "No hay suficiente agua disponible" })
    if (RECURSOS.cant_nutrientes < nutrientes) return res.status(400).json({ error: "No hay suficientes nutrientes disponibles" })
    if (RECURSOS.cant_energia < energia) return res.status(400).json({ error: "No hay suficiente energía disponible" })

    modulo.cant_agua = (modulo.cant_agua || 0) + agua
    modulo.cant_nutrientes = (modulo.cant_nutrientes || 0) + nutrientes
    modulo.cant_energia = (modulo.cant_energia || 0) + energia
    RECURSOS.cant_agua -= agua
    RECURSOS.cant_nutrientes -= nutrientes
    RECURSOS.cant_energia -= energia

    res.status(200).json(modulo)
})

app.delete("/modulos/:moduloId", (req, res) => {
    modulos = modulos.filter(m => m.id != req.params.moduloId)
    res.status(200).json({ ok: true })
})

// Sembrar una especie en un modulo.
app.get("/modulos/:moduloId/:plantaId", (req, res) => {
    const modulo = modulos.find(m => m.id == parseInt(req.params.moduloId))
    if (!modulo) return res.status(404).json({ error: "Módulo no encontrado" })
    if (modulo.estado == "desechado") return res.status(400).json({ error: "El módulo está desechado" })

    const especie = ESPECIES.find(e => e.id == req.params.plantaId)
    if (!especie) return res.status(404).json({ error: "Especie no encontrada" })

    if (ESTADO_JUEGO.nivel < especie.nivel_requerido) {
        return res.status(403).json({ error: `Necesitás nivel ${especie.nivel_requerido} para sembrar ${especie.nombre}` })
    }

    if (bloquesOcupados(modulo) + especie.tamanio > modulo.capacidad_max) {
        return res.status(400).json({ error: `No hay bloques libres (ocupa ${especie.tamanio}, quedan ${modulo.capacidad_max - bloquesOcupados(modulo)})` })
    }

    const nueva_planta = {
        id: PLANTAS.length + 1,
        nombre: especie.nombre,
        tamanio: especie.tamanio,
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

// Eliminar una planta de un modulo (libera sus bloques).
app.delete("/modulos/:moduloId/plantas/:plantaId", (req, res) => {
    const modulo = modulos.find(m => m.id == parseInt(req.params.moduloId))
    if (!modulo) return res.status(404).json({ error: "Módulo no encontrado" })
    modulo.plantas = modulo.plantas.filter(p => p.id != parseInt(req.params.plantaId))
    PLANTAS = PLANTAS.filter(p => p.id != parseInt(req.params.plantaId))
    res.status(200).json({ ok: true })
})

app.get("/avanzar-dia", (req, res) => {
    const eventos_del_dia = []

    // 1. Evento del dia (15%)
    const evento = tirarEvento(RECURSOS, EVENTOS_ALEATORIOS)
    if (evento) eventos_del_dia.push({ mensaje: `${evento.nombre}: ${evento.descripcion}`, tipo: evento.tipo == "positivo" ? "info" : "alerta" })

    // 2. Modulos y plantas -> dia.js
    eventos_del_dia.push(...procesarModulos(modulos, RECURSOS))

    // 3. Tripulacion -> base.js
    eventos_del_dia.push(...procesarTripulacion(RECURSOS, ESTADO_JUEGO))

    // 4. Regeneracion pasiva de nutrientes -> base.js
    regenerarNutrientes(RECURSOS)

    ESTADO_JUEGO.dia_actual++

    if (ESTADO_JUEGO.tripulantes <= 0) ESTADO_JUEGO.estado = "derrota"
    else if (ESTADO_JUEGO.dia_actual >= DIA_VICTORIA) ESTADO_JUEGO.estado = "victoria"

    res.status(200).json({
        dia_actual: ESTADO_JUEGO.dia_actual,
        estado: ESTADO_JUEGO.estado,
        nivel: ESTADO_JUEGO.nivel,
        recursos: RECURSOS,
        modulos,
        eventos: eventos_del_dia,
        tripulantes: ESTADO_JUEGO.tripulantes,
        estado_tripulacion: ESTADO_JUEGO.estado_tripulacion,
        dias_sin_comer: ESTADO_JUEGO.dias_sin_comer
    })
})

app.get("/reiniciar", (req, res) => {
    RECURSOS = { ...RECURSOS_INICIALES }
    ESTADO_JUEGO = estadoInicial()
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

app.listen(3000, () => console.log("Servidor iniciado"))
