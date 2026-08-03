import express from 'express'
import { Pool } from 'pg'
import cors from 'cors'
import { RECURSOS_INICIALES, MODULO, TRIPULANTES_INICIALES, DIA_VICTORIA } from './constantes.js';
import { procesarModulos } from './dia.js';


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

app.get("/plantas/todas", (req, res) => {
    res.json(ESPECIES)
})

app.get("/plantas", (req, res) => {
    res.json(ESPECIES.filter(e => e.adquirida))
})

app.get("/evento", async (req, res) => {
    let evento = await generarEventoAleatorio()
    await pool.query("UPDATE base_espacial SET cant_agua = cant_agua - $1, cant_nutrientes = cant_nutrientes - $2, cant_energia = cant_energia - $3, cant_oxigeno = cant_oxigeno - $4",
        [evento.efecto_agua, evento.efecto_nutrientes, evento.efecto_energia, evento.efecto_oxigeno]
    )
    res.status(200).json(evento)
})

app.get("/recursos", async (req, res) => {
    const recursos = await pool.query("SELECT * FROM base_espacial")
    res.status(200).json(recursos.rows[0])
})

// Modulos
app.post("/modulos", async (req, res) => {
    const modulo_resources = req.body

    await pool.query("INSERT INTO modulos (nombre, nivel, cosechas, bloques_totales, bloques_ocupados, cant_agua, cant_nutrientes, cant_energia, cant_oxigeno) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [modulo_resources.nombre, 1, 0, 2, 0, modulo_resources.cant_agua, modulo_resources.cant_nutrientes, modulo_resources.cant_energia, modulo_resources.cant_oxigeno]
    )
    
    await pool.query("UPDATE base_espacial SET cant_agua = cant_agua - $1, cant_nutrientes = cant_nutrientes - $2, cant_energia = cant_energia - $3, cant_oxigeno = cant_oxigeno - $4",
        [modulo_resources.cant_agua, modulo_resources.cant_nutrientes, modulo_resources.cant_energia, modulo_resources.cant_oxigeno]
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
        await pool.query("UPDATE base_espacial SET nivel = nivel + 1 WHERE id = 1")
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


app.put("/modulos/:moduloId/recursos", async (req, res) => {
    const { moduloId } = req.params
    const { agua, nutrientes, energia } = req.body

    let modulo = await pool.query("SELECT * FROM modulos WHERE id = $1", [moduloId])
    if (!modulo.rows) return res.status(404).json({ error: "Módulo no encontrado" })
    const RECURSOS = await pool.query("SELECT * FROM base_espacial WHERE id = 1")

    if (RECURSOS.rows[0].cant_agua < agua) return res.status(400).json({ error: "No hay suficiente agua disponible" })
    if (RECURSOS.rows[0].cant_nutrientes < nutrientes) return res.status(400).json({ error: "No hay suficientes nutrientes disponibles" })
    if (RECURSOS.rows[0].cant_energia < energia) return res.status(400).json({ error: "No hay suficiente energía disponible" })

    modulo.cant_agua += agua
    modulo.cant_nutrientes += nutrientes
    modulo.cant_energia += energia

    RECURSOS.rows[0].cant_agua -= agua
    RECURSOS.rows[0].cant_nutrientes -= nutrientes
    RECURSOS.rows[0].cant_energia -= energia

    await pool.query("UPDATE modulos SET cant_agua = $1, cant_nutrientes = $2, cant_energia = $3 WHERE id = $4",
        [modulo.cant_agua, modulo.cant_nutrientes, modulo.cant_energia, moduloId]
    )
    await pool.query("UPDATE base_espacial SET cant_agua = $1, cant_nutrientes = $2, cant_energia = $3 WHERE id = 1",
        [RECURSOS.rows[0].cant_agua, RECURSOS.rows[0].cant_nutrientes, RECURSOS.rows[0].cant_energia]
    )

    res.status(200).json(modulo)
})
app.patch("/modulos/:moduloId/nombre", async (req, res) => {
    const { moduloId } = req.params
    const { nombre } = req.body
    if (!nombre) return res.status(400).json({ error: "El nombre no puede estar vacío" })
    await pool.query("UPDATE modulos SET nombre = $1 WHERE id = $2", [nombre, moduloId])
    const modulo = await pool.query("SELECT * FROM modulos WHERE id = $1", [moduloId])
    res.status(200).json(modulo.rows[0])
})
app.delete("/modulos/:moduloId", async (req, res) => {
    const { moduloId } = req.params
    const modulo = await pool.query("SELECT * FROM modulos WHERE id = $1", [moduloId])
    await pool.query("DELETE FROM modulos WHERE id = $1", [moduloId])
    await pool.query("DELETE FROM plantas WHERE modulo_id = $1", [moduloId])
    await pool.query("UPDATE base_espacial SET cant_agua = cant_agua + $1, cant_nutrientes = cant_nutrientes + $2, cant_energia = cant_energia + $3, cant_oxigeno = cant_oxigeno + $4",
        [modulo.rows[0].cant_agua, modulo.rows[0].cant_nutrientes, modulo.rows[0].cant_energia, modulo.rows[0].cant_oxigeno]
    )
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

app.get("/avanzar-dia", async (req, res) => {
    const estado_juego = await pool.query("SELECT * FROM base_espacial")
    const modulos = await pool.query("SELECT * FROM modulos")
    
    // Modulos y plantas -> backend/dia.js
    // let eventos_del_dia = procesarModulos(modulos.rows, RECURSOS)

    // Tripulacion, niveles y eventos
    if (estado_juego.rows[0].cant_comida < 60) {
        estado_juego.rows[0].dias_comida_insuficiente++
        if (estado_juego.rows[0].dias_comida_insuficiente > 7) {
            estado_juego.rows[0].tripulantes--
        }
    }

    if (estado_juego.rows[0].cant_agua < 50 && estado_juego.rows[0].cant_agua > 30) {
        estado_juego.rows[0].dias_agua_insuficiente++
        if (estado_juego.rows[0].dias_agua_insuficiente > 5) {
            estado_juego.rows[0].tripulantes--
        }
    } else if (estado_juego.rows[0].cant_agua < 30 && estado_juego.rows[0].cant_agua > 15) {
        estado_juego.rows[0].dias_agua_insuficiente++
        if (estado_juego.rows[0].dias_agua_insuficiente > 5) {
            estado_juego.rows[0].tripulantes -= 2
        }
    } else if (estado_juego.rows[0].cant_agua < 15 && estado_juego.rows[0].cant_agua >= 0) {
        estado_juego.rows[0].dias_agua_insuficiente++
        if (estado_juego.rows[0].dias_agua_insuficiente > 5) {
            estado_juego.rows[0].tripulantes -= 3
        }
    }

    if (estado_juego.rows[0].cant_oxigeno <= 0) {
        estado_juego.rows[0].dias_oxigeno_insuficiente++
    }

    estado_juego.rows[0].cant_comida -= estado_juego.rows[0].tripulantes * 0.1
    estado_juego.rows[0].cant_agua -= estado_juego.rows[0].tripulantes * 0.2
    estado_juego.rows[0].cant_oxigeno -= estado_juego.rows[0].tripulantes * 0.2
    if (estado_juego.rows[0].cant_comida < 0) estado_juego.rows[0].cant_comida = 0
    if (estado_juego.rows[0].cant_agua < 0) estado_juego.rows[0].cant_agua = 0

    await pool.query("UPDATE base_espacial SET dia_actual = dia_actual + 1, cant_agua = $1, cant_nutrientes = $2, cant_energia = $3, cant_oxigeno = $4, cant_comida = $5, dias_comida_insuficiente = $6, dias_agua_insuficiente = $7, dias_oxigeno_insuficiente = $8, tripulantes = $9",
        [estado_juego.rows[0].cant_agua, estado_juego.rows[0].cant_nutrientes, estado_juego.rows[0].cant_energia, estado_juego.rows[0].cant_oxigeno, estado_juego.rows[0].cant_comida, estado_juego.rows[0].dias_comida_insuficiente, estado_juego.rows[0].dias_agua_insuficiente, estado_juego.rows[0].dias_oxigeno_insuficiente, estado_juego.rows[0].tripulantes]
    )
    await pool.query(`
    UPDATE base_espacial 
    SET fertilizaciones_disponibles = fertilizaciones_disponibles + 
        CASE WHEN (dia_actual % 10) = 0 THEN 1 ELSE 0 END
    `)
    await pool.query(`
    UPDATE base_espacial 
    SET dias_restantes_bloqueo = GREATEST(dias_restantes_bloqueo - 1, 0),
        evento_bloqueado_id = CASE 
            WHEN dias_restantes_bloqueo <= 1 THEN NULL 
            ELSE evento_bloqueado_id 
        END
`)

    if (estado_juego.rows[0].tripulantes <= 0 || estado_juego.rows[0].dias_oxigeno_insuficiente == 3) { //SE USAN LOS TRAJES ESPACIALES
        estado_juego.rows[0].estado = "derrota"
    } else if (estado_juego.rows[0].dia_actual >= DIA_VICTORIA) {
        
        estado_juego.rows[0].estado = "victoria"
    }

    res.status(200).json({
        dia_actual: estado_juego.rows[0].dia_actual,
        estado: estado_juego.rows[0].estado,
        recursos: estado_juego.rows[0],
        modulos: modulos.rows,
        // eventos: eventos_del_dia,
        eventos: [],
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
    


app.get("/reiniciar", async (req, res) => {
    const RECURSOS = await pool.query("SELECT * FROM base_espacial")

    const ESTADO_JUEGO = {
        dia_actual: 0,
        estado: "en_curso",
        total_cosechas: 0,
        tripulantes: TRIPULANTES_INICIALES,
        dias_comida_insuficiente: 0,
        nivel: 1
    }

    await pool.query("DELETE FROM modulos")
    await pool.query("DELETE FROM plantas")
    await pool.query("UPDATE base_espacial SET dia_actual = 0, cant_agua = $1, cant_nutrientes = $2, cant_energia = $3, cant_oxigeno = $4, cant_comida = $5, total_cosechas = 0, estado = 'en_curso', dias_comida_insuficiente = 0, dias_agua_insuficiente = 0, dias_oxigeno_insuficiente = 0, tripulantes = $6",
        [RECURSOS.rows[0].cant_agua, RECURSOS.rows[0].cant_nutrientes, RECURSOS.rows[0].cant_energia, RECURSOS.rows[0].cant_oxigeno, RECURSOS.rows[0].cant_comida, TRIPULANTES_INICIALES]
    )

    res.status(200).json({
        dia_actual: ESTADO_JUEGO.dia_actual,
        estado: ESTADO_JUEGO.estado,
        total_cosechas: ESTADO_JUEGO.total_cosechas,
        recursos: RECURSOS.rows[0],
        modulos: [],
        tripulantes: ESTADO_JUEGO.tripulantes
    })
})


async function actualizarRecursos(especie) {
    const RECURSOS = await pool.query("SELECT * FROM base_espacial")
    // Solo el golpe de cosecha; el goteo diario ya lo sumo el tick.
    RECURSOS.rows[0].cant_agua += especie.agua_cosecha
    RECURSOS.rows[0].cant_comida += especie.comida_cosecha
    await pool.query("UPDATE base_espacial SET cant_agua = $1, cant_comida = $2 WHERE id = 1",
        [RECURSOS.rows[0].cant_agua, RECURSOS.rows[0].cant_comida]
    )
}

app.get("/eventos", async (req, res) => {
    const result = await pool.query("SELECT * FROM eventos")
    res.json(result.rows)
})


app.post("/eventos", async (req, res) => {
    const { id, nombre, descripcion, efecto_agua, efecto_oxigeno, efecto_energia, efecto_nutrientes } = req.body
    
    const estado = await pool.query("SELECT * FROM base_espacial")
    if (estado.rows[0].eventos_creados >= 3) {
        return res.status(400).json({ error: "Ya alcanzaste el límite de 3 eventos creados" })
    }

    const costo_agua = Math.abs(efecto_agua) / 2
    const costo_oxigeno = Math.abs(efecto_oxigeno) / 2
    const costo_energia = Math.abs(efecto_energia) / 2
    const costo_nutrientes = Math.abs(efecto_nutrientes) / 2

    if (RECURSOS.cant_agua < costo_agua) return res.status(400).json({ error: "No tenés suficiente agua" })
    if (RECURSOS.cant_oxigeno < costo_oxigeno) return res.status(400).json({ error: "No tenés suficiente oxígeno" })
    if (RECURSOS.cant_energia < costo_energia) return res.status(400).json({ error: "No tenés suficiente energía" })
    if (RECURSOS.cant_nutrientes < costo_nutrientes) return res.status(400).json({ error: "No tenés suficientes nutrientes" })

    RECURSOS.cant_agua -= costo_agua
    RECURSOS.cant_oxigeno -= costo_oxigeno
    RECURSOS.cant_energia -= costo_energia
    RECURSOS.cant_nutrientes -= costo_nutrientes

    const nuevo_evento = { id, nombre, descripcion, tipo: "positivo", efectos: { agua: efecto_agua, oxigeno: efecto_oxigeno, energia: efecto_energia, nutrientes: efecto_nutrientes } }
    await pool.query(
    "INSERT INTO eventos (id, nombre, descripcion, tipo, efecto_agua, efecto_oxigeno, efecto_energia, efecto_nutrientes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [id, nombre, descripcion, 'positivo', efecto_agua, efecto_oxigeno, efecto_energia, efecto_nutrientes]
)
    await pool.query("UPDATE base_espacial SET eventos_creados = eventos_creados + 1")
    const nuevo_evento_db = await pool.query("SELECT * FROM eventos WHERE id = $1", [id])
    res.status(201).json(nuevo_evento_db.rows[0])
})

app.patch("/eventos/:id", async (req, res) => {
    const eventoDb = await pool.query("SELECT * FROM eventos WHERE id = $1", [req.params.id])
    if (eventoDb.rows.length === 0) return res.status(404).json({ error: "Evento no encontrado" })
    const evento = eventoDb.rows[0]
    if (evento.modificado) return res.status(400).json({ error: "Este evento ya fue modificado una vez" })
    const estadoBD = await pool.query("SELECT evento_bloqueado_id FROM base_espacial")
    if (estadoBD.rows[0].evento_bloqueado_id === req.params.id) {
        return res.status(400).json({ error: "No podés modificar un evento bloqueado" })
    }    
    
    const costo_agua = Math.abs(evento.efecto_agua) * 0.2
    const costo_oxigeno = Math.abs(evento.efecto_oxigeno) * 0.2
    const costo_energia = Math.abs(evento.efecto_energia) * 0.2
    const costo_nutrientes = Math.abs(evento.efecto_nutrientes) * 0.2

    if (RECURSOS.cant_agua < costo_agua) return res.status(400).json({ error: `Necesitás ${costo_agua} de agua` })
    if (RECURSOS.cant_oxigeno < costo_oxigeno) return res.status(400).json({ error: `Necesitás ${costo_oxigeno} de oxígeno` })
    if (RECURSOS.cant_energia < costo_energia) return res.status(400).json({ error: `Necesitás ${costo_energia} de energía` })
    if (RECURSOS.cant_nutrientes < costo_nutrientes) return res.status(400).json({ error: `Necesitás ${costo_nutrientes} de nutrientes` })

    RECURSOS.cant_agua -= costo_agua
    RECURSOS.cant_oxigeno -= costo_oxigeno
    RECURSOS.cant_energia -= costo_energia
    RECURSOS.cant_nutrientes -= costo_nutrientes

    const { efecto_agua, efecto_oxigeno, efecto_energia, efecto_nutrientes } = req.body
    const max_reduccion = 0.5
    if (efecto_agua !== null && Math.abs(efecto_agua) < Math.abs(evento.efecto_agua) * max_reduccion) {
        return res.status(400).json({ error: `No podés reducir el efecto de agua más del 50%` })
    }
    if (efecto_oxigeno !== null && Math.abs(efecto_oxigeno) < Math.abs(evento.efecto_oxigeno) * max_reduccion) {
        return res.status(400).json({ error: `No podés reducir el efecto de oxígeno más del 50%` })
    }
    if (efecto_energia !== null && Math.abs(efecto_energia) < Math.abs(evento.efecto_energia) * max_reduccion) {
        return res.status(400).json({ error: `No podés reducir el efecto de energía más del 50%` })
    }
    if (efecto_nutrientes !== null && Math.abs(efecto_nutrientes) < Math.abs(evento.efecto_nutrientes) * max_reduccion) {
        return res.status(400).json({ error: `No podés reducir el efecto de nutrientes más del 50%` })
    }
    await pool.query(
        "UPDATE eventos SET efecto_agua = $1, efecto_oxigeno = $2, efecto_energia = $3, efecto_nutrientes = $4 WHERE id = $5",
        [
            efecto_agua ?? evento.efecto_agua,
            efecto_oxigeno ?? evento.efecto_oxigeno,
            efecto_energia ?? evento.efecto_energia,
            efecto_nutrientes ?? evento.efecto_nutrientes,
            req.params.id
        ]
    )
    await pool.query("UPDATE eventos SET modificado = TRUE WHERE id = $1", [req.params.id])

    const actualizado = await pool.query("SELECT * FROM eventos WHERE id = $1", [req.params.id])
    res.status(200).json(actualizado.rows[0])
})


app.delete("/eventos/:id/bloquear", async (req, res) => {
    const estado = await pool.query("SELECT * FROM base_espacial")
    if (estado.rows[0].evento_bloqueado_id) {
        return res.status(400).json({ error: `Ya hay un evento bloqueado. Quedan ${estado.rows[0].dias_restantes_bloqueo} días` })
    }

    const eventoDb = await pool.query("SELECT * FROM eventos WHERE id = $1", [req.params.id])
    if (eventoDb.rows.length === 0) return res.status(404).json({ error: "Evento no encontrado" })
    const evento = eventoDb.rows[0]
    if (evento.tipo !== "negativo") return res.status(400).json({ error: "Solo podés bloquear eventos negativos" })

    const costo = Math.abs(evento.efecto_energia + evento.efecto_oxigeno + evento.efecto_agua + evento.efecto_nutrientes) * 0.3
    if (RECURSOS.cant_energia < costo) return res.status(400).json({ error: `Necesitás ${costo} de energía para bloquear este evento` })

    RECURSOS.cant_energia -= costo
    await pool.query("UPDATE base_espacial SET evento_bloqueado_id = $1, dias_restantes_bloqueo = 15", [evento.id])

    res.status(200).json({ msg: `Evento "${evento.nombre}" bloqueado por 15 días`, costo })
})

app.post("/especies/:id/adquirir", (req, res) => {
    const especie = ESPECIES.find(e => e.id == req.params.id)
    if (!especie) return res.status(404).json({ error: "Especie no encontrada" })
    especie.adquirida = true
    res.status(200).json(especie)
})

// Eliminar especie del catálogo
app.delete("/especies/:id", (req, res) => {
    const especie = ESPECIES.find(e => e.id == req.params.id)
    if (!especie) return res.status(404).json({ error: "Especie no encontrada" })
    especie.adquirida = false
    res.status(200).json({ msg: `${especie.nombre} eliminada del catálogo` })
})

app.post("/especies/:id/fertilizar", async (req, res) => {
    const estado = await pool.query("SELECT * FROM base_espacial")
    if (estado.rows[0].fertilizaciones_disponibles <= 0) {
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
    await pool.query("UPDATE base_espacial SET fertilizaciones_disponibles = fertilizaciones_disponibles - 1")

    res.status(200).json({ 
        msg: `${especie.nombre} fertilizada. ${propiedad} aumentó a ${especie[propiedad]}`,
        fertilizaciones_disponibles: estado.rows[0].fertilizaciones_disponibles - 1,
        especie
    })
})


app.listen(3000, () => {
    console.log("Servidor iniciado")
})