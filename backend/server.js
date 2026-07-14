import pool from './db/my_postgre.js'
import express from 'express'
import cors from 'cors'

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


const RECURSOS = {
    cant_agua: 1000,
    cant_oxigeno: 100,
    cant_energia: 90,
    cant_nutrientes: 300,
    cant_comida: 50
}


const PLANTAS = [
    {
        id: 1,
        nombre: "Tomate",
        tamanio: 1,
        agua_requerida: 2,
        oxigeno_requerido: 1,
        nutrientes_requeridos: 2,
        nutrientes_generados: 1,
        duracion: 5,
        agua_producida: 8,
        nivel_requerido: 1,
        pathSvg: '<circle cx="50" cy="40" r="15"/><path d="M50 25 V15 M40 15 Q50 20 60 15"/>'
    },

    {
        id: 2,
        nombre: "Lechuga",
        tamanio: 1,
        agua_requerida: 2,
        oxigeno_requerido: 0.5,
        nutrientes_requeridos: 1,
        nutrientes_generados: 0.5,
        duracion: 3,
        agua_producida: 3,
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
        duracion: 2,
        agua_producida: 4,
        nivel_requerido: 4,
        pathSvg: '<rect x="25" y="20" width="50" height="60" rx="5"/><path d="M25 40 Q50 50 75 40 M25 60 Q50 70 75 60" stroke-dasharray="2 2"/>'
    },

]


const modulos = []

const app = express()

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get("/", (req, res) => {
    res.send("Servidor funcionando")
})

app.get("/plantas", (req, res) => {
    res.json(PLANTAS)
})

app.get("/ver_planta/:id", (req, res) => {
    let id = req.params.id

    let planta = PLANTAS.find((planta) => planta.id == parseInt(id))
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

app.post("/modulos", (req,res) =>{
    let nuevo_modulo = {...req.body, id: modulos.length + 1, plantas: []}
    modulos.push(nuevo_modulo)
    res.status(201).json(nuevo_modulo)
})

app.get("/modulos", (req,res) =>{
    res.json(modulos)
})

app.get("/modulos/:moduloId/:plantaId", (req, res) => {
    const {moduloId, plantaId} = req.params

    const modulo = modulos.find(m => m.id == parseInt(moduloId))
    
    if (modulo.capacidad_max == modulo.plantas.length) return res.status(404).json({ error: "Modulo a su capacidad maxima" })

    const nueva_planta = {
        // especie_id: especie.id,
        estado: "creciendo",
        porcentaje_agua: 100,
        porcentaje_nutrientes: 100,
        dias_transcurridos: 0
    }
    modulo.plantas.push(nueva_planta)
    res.status(201).json(nueva_planta)
})

const ESTADO_JUEGO = {
    dia_actual: 1,
    estado: "en_curso",
    total_cosechas: 0
}

app.get("/avanzar-dia", (req, res) => {
    if (ESTADO_JUEGO.estado !== "en_curso") {
        return res.status(400).json({ error: "La partida ya terminó", estado: ESTADO_JUEGO.estado })
    }

    let eventos_del_dia = []

    modulos.forEach((modulo) => {
        modulo.plantas.forEach((planta) => {
            if (["seca", "perdida"].includes(planta.estado)) return

            const especie = PLANTAS.find(p => p.id == planta.especie_id)
            if (!especie) return

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
                eventos_del_dia.push(`Una planta de ${especie.nombre} se secó en "${modulo.nombre}"`)
                return
            }
            if (planta.porcentaje_nutrientes <= 30) {
                planta.estado = "perdida"
                eventos_del_dia.push(`Se perdió una planta de ${especie.nombre} por falta de nutrientes`)
                return
            }

            RECURSOS.cant_comida += especie.nutrientes_generados || 0

            planta.dias_transcurridos++
            if (planta.dias_transcurridos >= especie.duracion) {
                planta.estado = "lista_para_cosechar"
                RECURSOS.cant_agua += especie.agua_producida
                ESTADO_JUEGO.total_cosechas++
                planta.dias_transcurridos = 0
                eventos_del_dia.push(`Cosecha lista de ${especie.nombre} en "${modulo.nombre}"`)
            }
        })
    })

    RECURSOS.cant_comida -= 5
    if (RECURSOS.cant_comida < 0) RECURSOS.cant_comida = 0

    ESTADO_JUEGO.dia_actual++

    if (RECURSOS.cant_comida <= 0) {
        ESTADO_JUEGO.estado = "derrota"
    } else if (ESTADO_JUEGO.dia_actual >= 180) {
        ESTADO_JUEGO.estado = "victoria"
    }

    res.status(200).json({
        dia_actual: ESTADO_JUEGO.dia_actual,
        estado: ESTADO_JUEGO.estado,
        total_cosechas: ESTADO_JUEGO.total_cosechas,
        recursos: RECURSOS,
        modulos,
        eventos: eventos_del_dia
    })
})



function generarEventoAleatorio() {
    const indiceAleatorio = Math.floor(Math.random() * EVENTOS_ALEATORIOS.length);
    return EVENTOS_ALEATORIOS[indiceAleatorio];
}

function actualizar_dias_planta(){
    modulos.forEach(modulo => {
        modulo.plantas.forEach((planta) => {
            if(planta.dias_transcurridos != planta.duracion){
                planta.dias_transcurridos += 1
            }
        })
    });
}
app.listen(3000, () => console.log("Servidor iniciado"))