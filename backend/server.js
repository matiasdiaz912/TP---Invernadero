import express from 'express'
import { Pool } from 'pg'
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

const app = express()

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const pool = new Pool({
    host: "db",
    port: 5432,
    database: "biospatial",
    user: "postgres",
    password: "1234",
})

pool.connect()
  .then(async () => {
        console.log('✅ Conectado a la base de datos PostgreSQL exitosamente')
    })
  .catch(err => console.error('❌ Error al conectar a la base de datos:', err.stack));


app.get("/", (req, res) => {
    res.send("Servidor funcionando")
})

// Especies
app.get("/especies", async (req, res) => {
    const response = await pool.query("SELECT * FROM especies")    
    res.json(response.rows)
})

app.get("/evento", async (req, res) => {
    let evento = await generarEventoAleatorio()
    RECURSOS.cant_agua += evento.efectos.agua
    RECURSOS.cant_oxigeno += evento.efectos.oxigeno
    RECURSOS.cant_energia += evento.efectos.energia
    RECURSOS.cant_nutrientes += evento.efectos.nutrientes
    await pool.query("UPDATE base_espacial SET cant_agua = cant_agua - $1, cant_nutrientes = cant_nutrientes - $2, cant_energia = cant_energia - $3, cant_oxigeno = cant_oxigeno - $4",
        [RECURSOS.cant_agua, RECURSOS.cant_nutrientes, RECURSOS.cant_energia, RECURSOS.cant_oxigeno]
    )
    res.status(200).json(evento)
})

app.get("/recursos", (req, res) => {
    res.status(200).json(RECURSOS)
})

// Modulos
app.post("/modulos", async (req, res) => {
    const modulo_resources = req.body

    await pool.query("INSERT INTO modulos (nombre, nivel, cosechas, bloques_totales, bloques_ocupados, cant_agua, cant_nutrientes, cant_energia, cant_oxigeno) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [modulo_resources.nombre, 1, 0, 2, 0, modulo_resources.cant_agua, modulo_resources.cant_nutrientes, modulo_resources.cant_energia, modulo_resources.cant_oxigeno]
    )

    RECURSOS.cant_agua -= modulo_resources.cant_agua
    RECURSOS.cant_energia -= modulo_resources.cant_energia
    RECURSOS.cant_nutrientes -= modulo_resources.cant_nutrientes
    RECURSOS.cant_oxigeno -= modulo_resources.cant_oxigeno
    
    await pool.query("UPDATE base_espacial SET cant_agua = $1, cant_nutrientes = $2, cant_energia = $3, cant_oxigeno = $4",
        [RECURSOS.cant_agua, RECURSOS.cant_nutrientes, RECURSOS.cant_energia, RECURSOS.cant_oxigeno]
    )
    res.status(201).send("Modulo creado")
})

app.get("/modulos", async (req, res) => {
    const response = await pool.query("SELECT * FROM modulos")    
    res.json(response.rows)
})

app.get("/modulos/:moduloId", async (req, res) => {
    const { moduloId } = req.params
    const response = await pool.query("SELECT * FROM modulos WHERE id = $1", [moduloId])
    res.json(response.rows[0])
})

app.get("/modulos/:moduloId/plantas", async (req, res) => {
    const { moduloId } = req.params
    const response = await pool.query("SELECT * FROM plantas WHERE modulo_id = $1", [moduloId])
    res.json(response.rows)
})

app.put("/modulos/:moduloId", async (req, res) => {
    const { moduloId } = req.params
    const planta = req.body
    const plantaModulo = await pool.query("SELECT * FROM plantas WHERE id = $1", [planta.id])
    const modulo = await pool.query("SELECT * FROM modulos WHERE id = $1", [plantaModulo.rows[0].modulo_id])
    const especie = await pool.query("SELECT * FROM especies WHERE id = $1", [plantaModulo.rows[0].especie_id])
    
    await pool.query("DELETE FROM plantas WHERE id = $1", [planta.id])
    actualizarRecursos(especie)
    await pool.query("UPDATE modulos SET bloques_ocupados = bloques_ocupados - 1, cosechas = cosechas + 1 WHERE id = $1", [moduloId])
    await pool.query("UPDATE base_espacial SET total_cosechas = total_cosechas + 1 WHERE id = 1")
    const estado_juego = await pool.query("SELECT * FROM base_espacial")

    if (estado_juego.rows[0].total_cosechas % 10 == 0 && estado_juego.rows[0].total_cosechas != 1) {
        estado_juego.rows[0].nivel++
    }
    res.status(200).json({ nivel: estado_juego.rows[0].nivel })
})

app.put("/modulos", async (req, res) => {
    let modulo = req.body
    const moduloDB = await pool.query("SELECT * FROM modulos WHERE id = $1", [modulo.id])
    if (moduloDB.rows[0].cosechas - (10 * moduloDB.rows[0].nivel ** moduloDB.rows[0].nivel) == 0) {
        await pool.query("UPDATE modulos SET nivel = nivel + 1, bloques_totales = bloques_totales + 1 WHERE id = $1", [modulo.id])
        return res.status(200).json({ msg: `El modulo ha sido mejorado al nivel ${moduloDB.rows[0].nivel} y ahora tiene capacidad para ${moduloDB.rows[0].bloques_totales} plantas`, type: "succes" })
    }

    res.status(200).json({ msg: `Para poder mejorar el modulo necesita ${10 * moduloDB.rows[0].nivel ** moduloDB.rows[0].nivel} de las ${moduloDB.rows[0].cosechas} cosechas actuales`, type: "error" })
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

app.delete("/modulos/:moduloId", async (req, res) => {
    const { moduloId } = req.params
    await pool.query("DELETE FROM modulos WHERE id = $1", [moduloId])
    res.status(200).json({ ok: true })
})

app.get("/modulos/:moduloId/:plantaId", async (req, res) => {
    const { moduloId, plantaId } = req.params

    const modulo = await pool.query("SELECT * FROM modulos WHERE id = $1", [moduloId])
    const especie = await pool.query("SELECT * FROM especies WHERE id = $1", [plantaId])
    const plantasModulo = await pool.query("SELECT * FROM plantas WHERE modulo_id = $1", [moduloId])
    console.log(plantasModulo.rows.length);
    if (modulo.rows[0].bloques_totales == plantasModulo.rows.length) return res.status(404).json({ error: "Modulo a su capacidad maxima" })
    await pool.query("INSERT INTO plantas (nombre, modulo_id, especie_id, dias_transcurridos, duracion, estado, porcentaje_agua, porcentaje_nutrientes, porcentaje_energia) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [especie.rows[0].nombre, modulo.rows[0].id, especie.rows[0].id, 0, especie.rows[0].duracion, "creciendo", 100, 100, 100]
    )

    // const nueva_planta = {
    //     id: PLANTAS.length + 1,
    //     especie_id: especie.rows[0].id,
    //     modulo_id: modulo.rows[0].id,
    //     nombre: especie.nombre,
    //     duracion: especie.duracion,
    //     estado: "creciendo",
    //     porcentaje_agua: 100,
    //     porcentaje_nutrientes: 100,
    //     porcentaje_energia: 100,
    //     dias_transcurridos: 0
    // }

    res.status(201).json([])
})

// let ESTADO_JUEGO = {
//     dia_actual: 0,
//     estado: "en_curso",
//     total_cosechas: 0,
//     tripulantes: TRIPULANTES_INICIALES,
//     dias_comida_insuficiente: 0,
//     dias_agua_insuficiente: 0,
//     dias_oxigeno_insuficiente: 0,
//     dias_usados_trajes: 0,
//     nivel: 1
// }

app.get("/avanzar-dia", async (req, res) => {
    const estado_juego = await pool.query("SELECT * FROM base_espacial")
    const modulos = await pool.query("SELECT * FROM modulos")
    
    // Modulos y plantas -> backend/dia.js
    let eventos_del_dia = procesarModulos(modulos.rows, RECURSOS)

    // Tripulacion, niveles y eventos
    if (RECURSOS.cant_comida < 60) {
        await pool.query("UPDATE base_espacial SET dias_comida_insuficiente = dias_comida_insuficiente + 1 WHERE id = 1")
        if (estado_juego.rows[0].dias_comida_insuficiente > 7) {
            await pool.query("UPDATE base_espacial SET tripulantes = tripulantes - 1 WHERE id = 1")
        }
    }

    if (RECURSOS.cant_agua < 50 && RECURSOS.cant_agua > 30) {
        await pool.query("UPDATE base_espacial SET dias_agua_insuficiente = dias_agua_insuficiente + 1 WHERE id = 1")
        if (estado_juego.rows[0].dias_agua_insuficiente > 5) {
            await pool.query("UPDATE base_espacial SET tripulantes = tripulantes - 1 WHERE id = 1")
        }
    } else if (RECURSOS.cant_agua < 30 && RECURSOS.cant_agua > 15) {
        await pool.query("UPDATE base_espacial SET dias_agua_insuficiente = dias_agua_insuficiente + 1 WHERE id = 1")
        if (estado_juego.rows[0].dias_agua_insuficiente > 5) {
            await pool.query("UPDATE base_espacial SET tripulantes = tripulantes - 2 WHERE id = 1")
        }
    } else if (RECURSOS.cant_agua < 15 && RECURSOS.cant_agua >= 0) {
        await pool.query("UPDATE base_espacial SET dias_agua_insuficiente = dias_agua_insuficiente + 1 WHERE id = 1")
        if (estado_juego.rows[0].dias_agua_insuficiente > 5) {
            await pool.query("UPDATE base_espacial SET tripulantes = tripulantes - 3 WHERE id = 1")
        }
    }

    if (RECURSOS.cant_oxigeno <= 0) {
        await pool.query("UPDATE base_espacial SET dias_oxigeno_insuficiente = dias_oxigeno_insuficiente + 1 WHERE id = 1")
    }

    RECURSOS.cant_comida -= estado_juego.rows[0].tripulantes * 0.1
    RECURSOS.cant_agua -= estado_juego.rows[0].tripulantes * 0.2
    RECURSOS.cant_oxigeno -= estado_juego.rows[0].tripulantes * 0.2
    if (RECURSOS.cant_comida < 0) RECURSOS.cant_comida = 0
    if (RECURSOS.cant_agua < 0) RECURSOS.cant_agua = 0

    await pool.query("UPDATE base_espacial SET dia_actual = dia_actual + 1, cant_agua = $1, cant_nutrientes = $2, cant_energia = $3, cant_oxigeno = $4, cant_comida = $5",
        [RECURSOS.cant_agua, RECURSOS.cant_nutrientes, RECURSOS.cant_energia, RECURSOS.cant_oxigeno, RECURSOS.cant_comida]
    )

    if (estado_juego.rows[0].tripulantes <= 0 || estado_juego.rows[0].dias_oxigeno_insuficiente == 3) { //SE USAN LOS TRAJES ESPACIALES
        estado_juego.rows[0].estado = "derrota"
    } else if (estado_juego.rows[0].dia_actual >= DIA_VICTORIA) {
        estado_juego.rows[0].estado = "victoria"
    }

    res.status(200).json({
        dia_actual: estado_juego.rows[0].dia_actual,
        estado: estado_juego.rows[0].estado,
        recursos: RECURSOS,
        modulos,
        eventos: eventos_del_dia,
        tripulantes: estado_juego.rows[0].tripulantes
    })
})

app.get("/estado-juego", async (req, res) => {
    const estado_juego = await pool.query("SELECT * FROM base_espacial");
    res.status(200).json(estado_juego.rows[0])
})



const generarEventoAleatorio = async () => {
    const response = await pool.query("SELECT * FROM eventos")
    const indiceAleatorio = Math.floor(Math.random() * response.rows.length);
    return response.rows[indiceAleatorio];
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



app.listen(3000, () => {
    console.log("Servidor iniciado")
})