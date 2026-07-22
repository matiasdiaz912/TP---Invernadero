import pool from './db/my_postgre.js'
import express from 'express'
import cors from 'cors'

const app = express()


app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Ruta base de chequeo
app.get("/", (req, res) => {
    res.send("Servidor funcionando")
})

/* 
   RUTAS PLANTAS GENERALES
 */

app.get("/plantas", async (req, res) => {
    try {
        const resultado = await pool.query("SELECT * FROM especies");
        res.json(resultado.rows);
    } catch (error) {
        console.error("Error al traer especies:", error);
        res.status(500).json({ error: "Error al consultar la base de datos" });
    }
});

app.get("/ver_planta/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query("SELECT * FROM especies WHERE id = $1", [id]);
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Planta no encontrada" });
        }
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error("Error al ver planta:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

/* RUTAS DE RECURSOS */

// Obtener el estado de la base espacial
app.get("/recursos", async (req, res) => {
    try {
        const resultado = await pool.query("SELECT * FROM base_espacial WHERE id = 1");
        res.status(200).json(resultado.rows[0]);
    } catch (error) {
        console.error("Error al traer recursos:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});


app.get("/evento", async (req, res) => {
    try {
        // Traer un evento al azar de la BDD
        const eventoResult = await pool.query("SELECT * FROM eventos ORDER BY RANDOM() LIMIT 1");
        const evento = eventoResult.rows[0];

        
        await pool.query(
            `UPDATE base_espacial 
             SET agua = agua + $1, 
                 oxigeno = oxigeno + $2, 
                 energia = energia + $3, 
                 nutrientes = nutrientes + $4 
             WHERE id = 1`,
            [evento.efecto_agua, evento.efecto_oxigeno, evento.efecto_energia, evento.efecto_nutrientes]
        );

        res.status(200).json(evento);
    } catch (error) {
        console.error("Error al procesar el evento:", error);
        res.status(500).json({ error: "Error al procesar el evento en la BDD" });
    }
});

/* RUTAS DE MÓDULOS */

// Obtener todos los módulos creados en el Invernadero
app.get("/modulos", async (req, res) => {
    try {
        const resultado = await pool.query("SELECT * FROM modulos ORDER BY id ASC");
        res.json(resultado.rows);
    } catch (error) {
        console.error("Error al traer los módulos:", error);
        res.status(500).json({ error: "Error al obtener módulos" });
    }
});

// Crear un nuevo módulo e insertarlo en la BDD
app.post("/modulos", async (req, res) => {
    const { nivel, estado, bloques_totales, bloques_ocupados, agua, nutrientes, energia, oxigeno } = req.body;
    try {
        const nuevoModulo = await pool.query(
            `INSERT INTO modulos (nivel, estado, bloques_totales, bloques_ocupados, agua, nutrientes, energia, oxigeno) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                nivel || 1, 
                estado || 'estable', 
                bloques_totales || 2, 
                bloques_ocupados || 0, 
                agua || 0, 
                nutrientes || 0, 
                energia || 0, 
                oxigeno || 0
            ]
        );
        res.status(201).json(nuevoModulo.rows[0]);
    } catch (error) {
        console.error("Error al crear el módulo:", error);
        res.status(500).json({ error: "No se pudo guardar el módulo en la base de datos" });
    }
});

/*  PLANTADO DENTRO DE LOS MÓDULOS*/

// Sembrar una planta dentro de un módulo específico
app.post("/modulos/:id/plantas", async (req, res) => {
    const moduloId = parseInt(req.params.id);
    const { especie_id } = req.body;

    try {
        // Verificar si el módulo existe 
        const moduloCheck = await pool.query("SELECT * FROM modulos WHERE id = $1", [moduloId]);
        if (moduloCheck.rows.length === 0) return res.status(404).json({ error: "Módulo no encontrado" });

        // Verificar si la especie existe 
        const especieCheck = await pool.query("SELECT * FROM especies WHERE id = $1", [especie_id]);
        if (especieCheck.rows.length === 0) return res.status(404).json({ error: "Especie no encontrada" });

        // Obtener el día actual de la simulación 
        const baseResult = await pool.query("SELECT dia_actual FROM base_espacial WHERE id = 1");
        const diaActual = baseResult.rows[0].dia_actual;
        const duracionEspecie = especieCheck.rows[0].duracion;

        
        const nuevaPlanta = await pool.query(
            `INSERT INTO plantas (modulo_id, especie_id, dia_sembrado, dia_cosecha, estado, porcentaje_agua, porcentaje_nutrientes) 
             VALUES ($1, $2, $3, $4, 'creciendo', 100, 100) RETURNING *`,
            [moduloId, especie_id, diaActual, diaActual + duracionEspecie]
        );

        res.status(201).json(nuevaPlanta.rows[0]);
    } catch (error) {
        console.error("Error al sembrar la planta:", error);
        res.status(500).json({ error: "Error en el servidor al intentar sembrar" });
    }
});

// Servidor 
app.listen(3000, () => console.log("Servidor iniciado en el puerto 3000"));