import pool from './db/my_postgre.js'
import express from 'express'
import cors from 'cors'
import { RECURSOS_INICIALES, ESPECIES, MODULO, TRIPULANTES_INICIALES, DIA_VICTORIA } from './constantes.js';
import { procesarModulos } from './dia.js';

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


let RECURSOS = { ...RECURSOS_INICIALES }



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
    res.json(ESPECIES.filter(e => e.adquirida))
})

app.get("/plantas/todas", (req, res) => {
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
    let nuevo_modulo = {
        ...req.body,
        id: modulos.length + 1,
        capacidad_max: MODULO.bloques_iniciales,
        nivel: 1,
        cosechas: 0,
        plantas: [],
        estado: "estable",
        dias_en_critico: 0
    }
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
    let modulo = modulos.find(modulo => modulo.id == moduloId)
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
        modulo.nivel++
        modulo.capacidad_max++
        return res.status(200).json({ msg: `El modulo ha sido mejorado al nivel ${modulo.nivel} y ahora tiene capacidad para ${modulo.capacidad_max} plantas`, type: "succes" })
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
    res.status(200).json({ ok: true })
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
    tripulantes: TRIPULANTES_INICIALES,
    dias_comida_insuficiente: 0,
    dias_agua_insuficiente: 0,
    dias_oxigeno_insuficiente: 0,
    dias_usados_trajes: 0,
    nivel: 1,
    fertilizaciones_disponibles: 0
}

app.get("/avanzar-dia", (req, res) => {
    // Modulos y plantas -> backend/dia.js
    let eventos_del_dia = procesarModulos(modulos, RECURSOS)


    // Tripulacion, niveles y eventos
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
    if (ESTADO_JUEGO.dia_actual % 10 === 0) {
    ESTADO_JUEGO.fertilizaciones_disponibles++
    }

    if (ESTADO_JUEGO.tripulantes <= 0 || ESTADO_JUEGO.dias_oxigeno_insuficiente == 3) { //SE USAN LOS TRAJES ESPACIALES
        ESTADO_JUEGO.estado = "derrota"
    } else if (ESTADO_JUEGO.dia_actual >= DIA_VICTORIA) {
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



app.get("/reiniciar", (req, res) => {
    RECURSOS = { ...RECURSOS_INICIALES }

    ESTADO_JUEGO = {
        dia_actual: 0,
        estado: "en_curso",
        total_cosechas: 0,
        tripulantes: TRIPULANTES_INICIALES,
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
    // Solo el golpe de cosecha; el goteo diario ya lo sumo el tick.
    RECURSOS.cant_agua += especie.agua_cosecha
    RECURSOS.cant_comida += especie.comida_cosecha
}
app.post("/especies/:id/adquirir", (req, res) => {
    const especie = ESPECIES.find(e => e.id == req.params.id)
    if (!especie) return res.status(404).json({ error: "Especie no encontrada" })
    especie.adquirida = true
    res.status(200).json(especie)
})

app.delete("/especies/:id", (req, res) => {
    const especie = ESPECIES.find(e => e.id == req.params.id)
    if (!especie) return res.status(404).json({ error: "Especie no encontrada" })
    especie.adquirida = false
    res.status(200).json({ msg: `${especie.nombre} eliminada del catálogo` })
})

app.put("/especies/:id/boost", (req, res) => {
    const especie = ESPECIES.find(e => e.id == req.params.id)
    if (!especie) return res.status(404).json({ error: "Especie no encontrada" })
    const { propiedad, valor } = req.body
    if (!['nutrientes_generados', 'agua_producida', 'comida_generada'].includes(propiedad)) {
        return res.status(400).json({ error: "Propiedad no válida para boost" })
    }
    especie[propiedad] += valor
    res.status(200).json(especie)
})
app.post("/especies/:id/fertilizar", (req, res) => {
    if (ESTADO_JUEGO.fertilizaciones_disponibles <= 0) {
        return res.status(400).json({ error: "No tenés fertilizaciones disponibles" })
    }

    const especie = ESPECIES.find(e => e.id == req.params.id)
    if (!especie) return res.status(404).json({ error: "Especie no encontrada" })
    if (!especie.adquirida) return res.status(400).json({ error: "No podés fertilizar una especie no adquirida" })

    const { propiedad } = req.body
    const propiedades_validas = ['comida_por_dia', 'agua_cosecha', 'comida_cosecha', 'oxigeno_por_dia']
    
    if (!propiedades_validas.includes(propiedad)) {
        return res.status(400).json({ error: "Propiedad no válida para fertilizar" })
    }

    especie[propiedad] += 1
    ESTADO_JUEGO.fertilizaciones_disponibles--

    res.status(200).json({ 
        msg: `${especie.nombre} fertilizada. ${propiedad} aumentó a ${especie[propiedad]}`,
        fertilizaciones_disponibles: ESTADO_JUEGO.fertilizaciones_disponibles,
        especie
    })
})
app.listen(3000, () => console.log("Servidor iniciado"))