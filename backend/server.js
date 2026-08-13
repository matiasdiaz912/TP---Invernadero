import express from 'express'
import { Pool } from 'pg'
import cors from 'cors'
import { RECURSOS_INICIALES, MODULO, TRIPULANTES_INICIALES, DIA_VICTORIA, AGUA_MAX, COMIDA_MAX, NUTRIENTES_MAX, ENERGIA_MAX, OXIGENO_MAX } from './constantes.js';
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


/////////////////////////////////////////////////// Plantas //////////////////////////////////////////////////////////////////////////

app.post("/plantas/:especieId", async (req, res) => {
    const { especieId } = req.params
    const moduloBody = req.body

    const especie = await pool.query("SELECT * FROM especies WHERE id = $1", [especieId])
    const plantasModulo = await pool.query("SELECT * FROM plantas WHERE modulo_id = $1", [moduloBody.id])

    if (moduloBody.bloques_totales == plantasModulo.rows.length || especie.rows[0].tamanio > moduloBody.bloques_totales - plantasModulo.rows.length) return res.status(404).json({ error: "Modulo a su capacidad maxima" })
    await pool.query("INSERT INTO plantas (nombre, modulo_id, especie_id, dias_transcurridos, duracion, estado, porcentaje_agua, porcentaje_nutrientes, porcentaje_energia) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [especie.rows[0].nombre, moduloBody.id, especie.rows[0].id, 0, especie.rows[0].duracion, "creciendo", 100, 100, 100]
    )

    res.status(201).json([])
})

app.get("/plantas/:moduloId", async (req, res) => {
    const { moduloId } = req.params
    const response = await pool.query(`
        SELECT plantas.*, especies.pathsvg, especies.nombre as especie_nombre 
        FROM plantas 
        JOIN especies ON plantas.especie_id = especies.id 
        WHERE plantas.modulo_id = $1
    `, [moduloId])
    res.json(response.rows)
})

app.delete("/plantas", async (req, res) => {
    const plantaBody  = req.body
    const planta = await pool.query("SELECT * FROM plantas WHERE id = $1", [plantaBody.id])
    const modulo = await pool.query("SELECT * FROM modulos WHERE id = $1", [planta.rows[0].modulo_id])
    const especie = await pool.query("SELECT * FROM especies WHERE id = $1", [planta.rows[0].especie_id])

    await pool.query("DELETE FROM plantas WHERE id = $1", [planta.rows[0].id])
    if(planta.rows[0].estado != "perdida"){
        actualizarRecursos(especie)
        await pool.query("UPDATE modulos SET bloques_ocupados = bloques_ocupados - 1, cosechas = cosechas + 1 WHERE id = $1", [modulo.rows[0].id])
        await pool.query("UPDATE base_espacial SET total_cosechas = total_cosechas + 1 WHERE id = 1")
    }

    const estado_juego = await pool.query("SELECT * FROM base_espacial")

    if (estado_juego.rows[0].total_cosechas % 10 == 0 && estado_juego.rows[0].total_cosechas != 0) {
        await pool.query("UPDATE base_espacial SET nivel = nivel + 1 WHERE id = 1")
    }
    res.status(200).json({ nivel: estado_juego.rows[0].nivel, recursos: estado_juego.rows[0] })
})

app.put("/plantas", async (req, res) =>{
    const plantaBody = req.body
    await pool.query("UPDATE plantas SET estado = $1 WHERE id = $2", ['cosechada', plantaBody.id])

    res.status(200).json(plantaBody)
})

////////////////////////////////////////////////////  Modulos  ///////////////////////////////////////////////////////////////////////
app.post("/modulos", async (req, res) => {
    const modulo_resources = req.body

    let modulos = await pool.query("SELECT * FROM modulos")
    let estado_juego = await pool.query("SELECT * FROM base_espacial")
    if(modulos.rows.length == estado_juego.rows[0].nivel){
        res.status(404).json({msg:"No puedes crear mas modulos hasta que subas de nivel"})
        return
    }

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

app.put("/modulos", async (req, res) => {
    let modulo = req.body
    const moduloDB = await pool.query("SELECT * FROM modulos WHERE id = $1", [modulo.id])
    if (moduloDB.rows[0].cosechas - (5 * moduloDB.rows[0].nivel ** moduloDB.rows[0].nivel) >= 0) {
        await pool.query("UPDATE modulos SET nivel = nivel + 1, bloques_totales = bloques_totales + 1 WHERE id = $1", [modulo.id])
        return res.status(200).json({ msg: `El modulo ha sido mejorado al nivel ${moduloDB.rows[0].nivel + 1} y ahora tiene capacidad para ${moduloDB.rows[0].bloques_totales + 1} plantas`, type: "succes" })
    }

    res.status(200).json({ msg: `Para poder mejorar el modulo necesita ${10 * moduloDB.rows[0].nivel ** moduloDB.rows[0].nivel} de las ${moduloDB.rows[0].cosechas} cosechas actuales`, type: "error" })
})

app.put("/modulos/:moduloId/recursos", async (req, res) => {
    const { moduloId } = req.params
    const { agua, nutrientes, energia, oxigeno } = req.body

    let modulo = await pool.query("SELECT * FROM modulos WHERE id = $1", [moduloId])
    if (!modulo.rows) return res.status(404).json({ error: "Módulo no encontrado" })
    const RECURSOS = await pool.query("SELECT * FROM base_espacial WHERE id = 1")

    // if (RECURSOS.rows[0].cant_agua < agua) return res.status(400).json({ error: "No hay suficiente agua disponible" })
    // if (RECURSOS.rows[0].cant_nutrientes < nutrientes) return res.status(400).json({ error: "No hay suficientes nutrientes disponibles" })
    // if (RECURSOS.rows[0].cant_energia < energia) return res.status(400).json({ error: "No hay suficiente energía disponible" })
    // if (RECURSOS.rows[0].cant_oxigeno < oxigeno) return res.status(400).json({ error: "No hay suficiente oxígeno disponible" })
    modulo.rows[0].cant_agua += agua
    modulo.rows[0].cant_nutrientes += nutrientes
    modulo.rows[0].cant_energia += energia
    modulo.rows[0].cant_oxigeno += oxigeno
    

    RECURSOS.rows[0].cant_agua -= agua
    RECURSOS.rows[0].cant_nutrientes -= nutrientes
    RECURSOS.rows[0].cant_energia -= energia
    RECURSOS.rows[0].cant_oxigeno -= oxigeno

    await pool.query("UPDATE modulos SET cant_agua = $1, cant_nutrientes = $2, cant_energia = $3, cant_oxigeno = $4 WHERE id = $5",
        [modulo.rows[0].cant_agua, modulo.rows[0].cant_nutrientes, modulo.rows[0].cant_energia, modulo.rows[0].cant_oxigeno, moduloId]
    )
    await pool.query("UPDATE base_espacial SET cant_agua = $1, cant_nutrientes = $2, cant_energia = $3, cant_oxigeno = $4 WHERE id = 1",
        [RECURSOS.rows[0].cant_agua, RECURSOS.rows[0].cant_nutrientes, RECURSOS.rows[0].cant_energia, RECURSOS.rows[0].cant_oxigeno]
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
    await pool.query("DELETE FROM plantas WHERE modulo_id = $1", [moduloId])
    await pool.query("DELETE FROM modulos WHERE id = $1", [moduloId])
    await pool.query("UPDATE base_espacial SET cant_agua = cant_agua + $1, cant_nutrientes = cant_nutrientes + $2, cant_energia = cant_energia + $3, cant_oxigeno = cant_oxigeno + $4",
        [modulo.rows[0].cant_agua, modulo.rows[0].cant_nutrientes, modulo.rows[0].cant_energia, modulo.rows[0].cant_oxigeno]
    )
    res.status(200).json({ ok: true })
})


//////////////////////////////////////////////////////// Juego General ////////////////////////////////////////////////////////////////
app.get("/avanzar-dia", async (req, res) => {
    let estado_juego = await pool.query("SELECT * FROM base_espacial")
    let modulos = await pool.query("SELECT * FROM modulos")
    let plantas = await pool.query("SELECT * FROM plantas")
    estado_juego = estado_juego.rows[0]
    

    // Tripulacion, niveles y eventos
    if (estado_juego.cant_comida < 60 && estado_juego.cant_comida > 0) {
        estado_juego.dias_comida_insuficiente++
        if(estado_juego.cant_comida < 60 && estado_juego.cant_comida > 45){
            if (estado_juego.dias_comida_insuficiente > 7) {
                estado_juego.tripulantes--
            }
        } else if(estado_juego.cant_comida < 45 && estado_juego.cant_comida > 30){
        
            if (estado_juego.dias_comida_insuficiente > 5) {
                estado_juego.tripulantes--
            }
        } else if(estado_juego.cant_comida < 30 && estado_juego.cant_comida > 0){
            if (estado_juego.dias_comida_insuficiente > 3) {
                estado_juego.tripulantes--
            }
        }
    }else{
        estado_juego.dias_comida_insuficiente = 0
    }
    
    if (estado_juego.cant_agua < 50 && estado_juego.cant_agua > 0){
        estado_juego.dias_agua_insuficiente++
        if(estado_juego.cant_agua < 50 && estado_juego.cant_agua > 30){
            if (estado_juego.dias_agua_insuficiente > 5) {
                estado_juego.tripulantes--
            }
        } else if (estado_juego.cant_agua < 30 && estado_juego.cant_agua > 15) {
            if (estado_juego.dias_agua_insuficiente > 5) {
                estado_juego.tripulantes -= 2
            }
        } else if (estado_juego.cant_agua < 15 && estado_juego.cant_agua >= 0) {
            estado_juego.dias_agua_insuficiente++
            if (estado_juego.dias_agua_insuficiente > 5) {
                estado_juego.tripulantes -= 3
            }
        }
    }else{
        estado_juego.dias_agua_insuficiente = 0

    }
    
    if(estado_juego.cant_oxigeno <= 0){
        estado_juego.dias_oxigeno_insuficiente++
        estado_juego.dias_oxigeno_insuficiente = Math.round(estado_juego.dias_oxigeno_insuficiente)
    }

    
    estado_juego.agua_usada_por_dia = Math.round(estado_juego.tripulantes * 0.2)
    estado_juego.energia_usada_por_dia = Math.round(estado_juego.tripulantes * 0.1)
    estado_juego.oxigeno_usado_por_dia = Math.round(estado_juego.tripulantes * 0.2)
    estado_juego.comida_usada_por_dia = Math.round(estado_juego.tripulantes * 0.1)

    estado_juego.cant_comida -= estado_juego.comida_usada_por_dia
    estado_juego.cant_agua -= estado_juego.agua_usada_por_dia
    estado_juego.cant_oxigeno -= estado_juego.oxigeno_usado_por_dia
    if (estado_juego.cant_agua < 0) estado_juego.cant_agua = 0
    if (estado_juego.cant_oxigeno < 0) estado_juego.cant_oxigeno = 0
    if(estado_juego.cant_comida < 0) estado_juego.cant_comida = 0

    await pool.query("UPDATE base_espacial SET dia_actual = dia_actual + 1, cant_agua = $1, cant_nutrientes = $2, cant_energia = $3, cant_oxigeno = $4, cant_comida = $5, dias_comida_insuficiente = $6, dias_agua_insuficiente = $7, dias_oxigeno_insuficiente = $8, tripulantes = $9, agua_usada_por_dia = $10, energia_usada_por_dia = $11, oxigeno_usado_por_dia = $12, comida_usada_por_dia = $13 WHERE id = 1",
        [estado_juego.cant_agua, estado_juego.cant_nutrientes, estado_juego.cant_energia, estado_juego.cant_oxigeno, estado_juego.cant_comida, estado_juego.dias_comida_insuficiente, estado_juego.dias_agua_insuficiente, estado_juego.dias_oxigeno_insuficiente, estado_juego.tripulantes, estado_juego.agua_usada_por_dia, estado_juego.energia_usada_por_dia, estado_juego.oxigeno_usado_por_dia, estado_juego.comida_usada_por_dia]
    )


    
    plantas.rows.forEach(async (planta, id) => {
        let especie = await pool.query("SELECT * FROM especies WHERE id = $1", [planta.especie_id])
        let modulo = await pool.query("SELECT * FROM modulos WHERE id = $1", [planta.modulo_id])
        especie = especie.rows[0]
        modulo = modulo.rows[0]
        if(modulo.cant_agua > 0 && modulo.cant_nutrientes > 0 && modulo.cant_energia > 0 && modulo.cant_oxigeno > 0){
            await pool.query("UPDATE modulos SET cant_agua = cant_agua - $1, cant_nutrientes = cant_nutrientes - $2, cant_energia = cant_energia - $3, cant_oxigeno = cant_oxigeno - $4 WHERE id = $5",
            [especie.agua_requerida, especie.nutrientes_requeridos, especie.energia_requerida, especie.oxigeno_requerido, planta.modulo_id]
            )
            if(planta.dias_transcurridos + 1 == planta.duracion){
                await pool.query("UPDATE plantas SET dias_transcurridos = dias_transcurridos + 1, estado = 'lista' WHERE id = $1", [planta.id])
            }else{
                await pool.query("UPDATE plantas SET dias_transcurridos = dias_transcurridos + 1 WHERE id = $1", [planta.id])

            }
        }else{
            await pool.query("UPDATE plantas SET estado = 'perdida' WHERE id = $1", [planta.id])
        }
    })
    const modulosActualizados = await pool.query("SELECT * FROM modulos")
    for (const modulo of modulosActualizados.rows) {
        const esCritico = modulo.cant_energia <= 0 || modulo.cant_agua <= 0 || modulo.cant_nutrientes <= 0 || modulo.cant_oxigeno <= 0
        const nuevoEstado = esCritico ? "critico" : "estable"
        await pool.query("UPDATE modulos SET estado = $1 WHERE id = $2", [nuevoEstado, modulo.id])
    }
    if (estado_juego.tripulantes <= 0 || estado_juego.dias_oxigeno_insuficiente == 3) { 
        await pool.query("UPDATE base_espacial SET estado = $1", ["derrota"])
    } else if (estado_juego.dia_actual >= DIA_VICTORIA) {      
        await pool.query("UPDATE base_espacial SET estado = $1", ["victoria"])
    }
    res.status(200).json([])
})

app.get("/recursos-actualizados", async (req, res) =>{
    let estado_juego = await pool.query("SELECT * FROM base_espacial")
    let modulos = await pool.query("SELECT * FROM modulos")
    let plantas = await pool.query("SELECT * FROM plantas")
    console.log(plantas.rows);
    
    
    res.status(200).json({
        estado_base: estado_juego.rows[0],
        modulos: modulos.rows,
        plantas: plantas.rows,
        eventos: [] 
    })
})

app.get("/estado-juego", async (req, res) => {
    const estado_juego = await pool.query("SELECT * FROM base_espacial");
    res.status(200).json(estado_juego.rows[0])
})

app.get("/reiniciar", async (req, res) => {
    const ESTADO_JUEGO = {
        ...RECURSOS_INICIALES,
        dia_actual: 0,
        estado: "en_curso",
        tripulantes: TRIPULANTES_INICIALES,
        nivel: 1
    }

    await pool.query("DELETE FROM plantas")
    await pool.query("DELETE FROM modulos")
    await pool.query("UPDATE base_espacial SET nivel = 1, dia_actual = 0, cant_agua = $1, cant_nutrientes = $2, cant_energia = $3, cant_oxigeno = $4, cant_comida = $5, total_cosechas = 0, estado = 'en_curso', dias_comida_insuficiente = 0, dias_agua_insuficiente = 0, dias_oxigeno_insuficiente = 0, tripulantes = $6",
        [RECURSOS_INICIALES.cant_agua, RECURSOS_INICIALES.cant_nutrientes, RECURSOS_INICIALES.cant_energia, RECURSOS_INICIALES.cant_oxigeno, RECURSOS_INICIALES.cant_comida, TRIPULANTES_INICIALES]
    )

    res.status(200).json(ESTADO_JUEGO)
})


const generarEventoAleatorio = async () => {
    const response = await pool.query("SELECT * FROM eventos")
    const indiceAleatorio = Math.floor(Math.random() * response.rows.length);
    return response.rows[indiceAleatorio];
}
    
async function actualizarRecursos(especie) {    
    const RECURSOS = await pool.query("SELECT * FROM base_espacial")
    if(especie.rows[0].agua_generada + RECURSOS.rows[0].cant_agua > AGUA_MAX){
        RECURSOS.rows[0].cant_agua = AGUA_MAX
    }else{
        RECURSOS.rows[0].cant_agua += especie.rows[0].agua_generada
    }

    if(especie.rows[0].comida_generada + RECURSOS.rows[0].cant_comida > COMIDA_MAX){
        RECURSOS.rows[0].cant_agua = COMIDA_MAX
    }else{
        RECURSOS.rows[0].cant_comida += especie.rows[0].comida_generada     
    }
    
    if(especie.rows[0].nutrientes_generados + RECURSOS.rows[0].cant_nutrientes > NUTRIENTES_MAX){
        RECURSOS.rows[0].cant_nutrientes = NUTRIENTES_MAX
    }else{
        RECURSOS.rows[0].cant_nutrientes += especie.rows[0].nutrientes_generados   
    }

    if(especie.rows[0].oxigeno_generado + RECURSOS.rows[0].cant_oxigeno > OXIGENO_MAX){
        RECURSOS.rows[0].cant_oxigeno = OXIGENO_MAX
    }else{
        RECURSOS.rows[0].cant_oxigeno += especie.rows[0].oxigeno_generado
    }

    await pool.query("UPDATE base_espacial SET cant_agua = $1, cant_comida = $2, cant_nutrientes = $3, cant_oxigeno = $4 WHERE id = 1",
            [RECURSOS.rows[0].cant_agua, RECURSOS.rows[0].cant_comida, RECURSOS.rows[0].cant_nutrientes, RECURSOS.rows[0].cant_oxigeno]
        )
}


/////////////////////////////////////////////////////////// Eventos //////////////////////////////////////////////////////////////////
app.get("/eventos", async (req, res) => {
    const result = await pool.query("SELECT * FROM eventos")
    res.json(result.rows)
})


app.post("/eventos", async (req, res) => {
    const { nombre, descripcion, efecto_agua, efecto_oxigeno, efecto_energia, efecto_nutrientes } = req.body
    const id = nombre.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()    
    const estado = await pool.query("SELECT * FROM base_espacial")
    if (estado.rows[0].eventos_creados >= 3) {
        return res.status(400).json({ error: "Ya alcanzaste el límite de 3 eventos creados" })
    }

    const costo_agua = Math.abs(efecto_agua) / 2
    const costo_oxigeno = Math.abs(efecto_oxigeno) / 2
    const costo_energia = Math.abs(efecto_energia) / 2
    const costo_nutrientes = Math.abs(efecto_nutrientes) / 2

    const recursosBD = await pool.query("SELECT * FROM base_espacial")
    const recursos = recursosBD.rows[0]

    if (recursos.cant_agua < costo_agua) return res.status(400).json({ error: "No tenés suficiente agua" })
    if (recursos.cant_oxigeno < costo_oxigeno) return res.status(400).json({ error: "No tenés suficiente oxígeno" })
    if (recursos.cant_energia < costo_energia) return res.status(400).json({ error: "No tenés suficiente energía" })
    if (recursos.cant_nutrientes < costo_nutrientes) return res.status(400).json({ error: "No tenés suficientes nutrientes" })

    await pool.query("UPDATE base_espacial SET cant_agua = cant_agua - $1, cant_oxigeno = cant_oxigeno - $2, cant_energia = cant_energia - $3, cant_nutrientes = cant_nutrientes - $4 WHERE id = 1",
        [costo_agua, costo_oxigeno, costo_energia, costo_nutrientes]
    )

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

    const recursosBD = await pool.query("SELECT * FROM base_espacial")
    const recursos = recursosBD.rows[0]

    if (recursos.cant_agua < costo_agua) return res.status(400).json({ error: `Necesitás ${costo_agua} de agua` })
    if (recursos.cant_oxigeno < costo_oxigeno) return res.status(400).json({ error: `Necesitás ${costo_oxigeno} de oxígeno` })
    if (recursos.cant_energia < costo_energia) return res.status(400).json({ error: `Necesitás ${costo_energia} de energía` })
    if (recursos.cant_nutrientes < costo_nutrientes) return res.status(400).json({ error: `Necesitás ${costo_nutrientes} de nutrientes` })

    await pool.query("UPDATE base_espacial SET cant_agua = cant_agua - $1, cant_oxigeno = cant_oxigeno - $2, cant_energia = cant_energia - $3, cant_nutrientes = cant_nutrientes - $4 WHERE id = 1",
        [costo_agua, costo_oxigeno, costo_energia, costo_nutrientes]
    )

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

    const recursosBD = await pool.query("SELECT * FROM base_espacial")
    if (recursosBD.rows[0].cant_energia < costo) return res.status(400).json({ error: `Necesitás ${costo} de energía para bloquear este evento` })
    await pool.query("UPDATE base_espacial SET cant_energia = cant_energia - $1 WHERE id = 1", [costo])

    await pool.query("UPDATE base_espacial SET evento_bloqueado_id = $1, dias_restantes_bloqueo = 15", [evento.id])

    res.status(200).json({ msg: `Evento "${evento.nombre}" bloqueado por 15 días`, costo })
})

app.delete("/eventos/:id/neutralizar", async (req, res) => {
    const eventoDb = await pool.query("SELECT * FROM eventos WHERE id = $1", [req.params.id])
    if (eventoDb.rows.length === 0) return res.status(404).json({ error: "Evento no encontrado" })
    const evento = eventoDb.rows[0]
    
    if (evento.tipo !== "negativo") return res.status(400).json({ error: "Solo podés neutralizar eventos negativos" })

    const costo = Math.abs(evento.efecto_energia + evento.efecto_oxigeno + evento.efecto_agua + evento.efecto_nutrientes) * 0.5
    const recursosBD = await pool.query("SELECT * FROM base_espacial")
    const recursos = recursosBD.rows[0]

    if (recursos.cant_energia < costo) return res.status(400).json({ error: `Necesitás ${costo} de energía para neutralizar este evento` })

    await pool.query("UPDATE base_espacial SET cant_energia = cant_energia - $1 WHERE id = 1", [costo])
    await pool.query("DELETE FROM eventos WHERE id = $1", [req.params.id])

    res.status(200).json({ msg: `Evento "${evento.nombre}" neutralizado permanentemente`, costo })
})

app.listen(3000, () => {
    console.log("Servidor iniciado")
})

pool.connect()
  .then(() => {
        console.log('✅ Conectado a la base de datos PostgreSQL exitosamente')
    })
  .catch(err => console.error('❌ Error al conectar a la base de datos:', err.stack));
