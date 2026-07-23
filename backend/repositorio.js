// Todo el SQL que necesita el ciclo de dia (dia.js) vive aca.
// Patron: cargar -> correr la logica en memoria -> guardar.
// Asi dia.js sigue siendo puro y se puede testear sin base de datos.

const num = v => (v === null || v === undefined ? 0 : Number(v))

// Devuelve los modulos con sus plantas adentro, mas el catalogo de especies
// y los recursos de la base. dia.js espera exactamente esta forma.
export async function cargarParaElDia(pool) {
    const [base, mods, plants, esp] = await Promise.all([
        pool.query("SELECT * FROM base_espacial WHERE id = 1"),
        pool.query("SELECT * FROM modulos ORDER BY id"),
        pool.query("SELECT * FROM plantas ORDER BY id"),
        pool.query("SELECT * FROM especies ORDER BY id"),
    ])

    const b = base.rows[0]

    const modulos = mods.rows.map(m => ({
        ...m,
        // pg devuelve los DECIMAL como texto; sin esto las cuentas dan mal
        cant_agua: num(m.cant_agua),
        cant_nutrientes: num(m.cant_nutrientes),
        cant_energia: num(m.cant_energia),
        cant_oxigeno: num(m.cant_oxigeno),
        capacidad_max: m.bloques_totales,
        dias_en_critico: m.dias_en_critico ?? 0,
        plantas: plants.rows
            .filter(p => p.modulo_id === m.id)
            .map(p => ({
                ...p,
                porcentaje_agua: num(p.porcentaje_agua),
                porcentaje_nutrientes: num(p.porcentaje_nutrientes),
                porcentaje_energia: num(p.porcentaje_energia),
            }))
    }))

    const especies = esp.rows.map(e => ({
        ...e,
        agua_requerida: num(e.agua_requerida),
        oxigeno_requerido: num(e.oxigeno_requerido),
        nutrientes_requeridos: num(e.nutrientes_requeridos),
        energia_requerida: num(e.energia_requerida),
        comida_por_dia: num(e.comida_por_dia),
        oxigeno_por_dia: num(e.oxigeno_por_dia),
        agua_cosecha: num(e.agua_cosecha),
        comida_cosecha: num(e.comida_cosecha),
    }))

    const RECURSOS = {
        cant_agua: num(b.cant_agua),
        cant_oxigeno: num(b.cant_oxigeno),
        cant_energia: num(b.cant_energia),
        cant_nutrientes: num(b.cant_nutrientes),
        cant_comida: num(b.cant_comida),
    }

    return { modulos, especies, RECURSOS }
}

// Guarda modulos y plantas en UNA transaccion: si algo falla,
// no queda un dia procesado a medias.
export async function guardarModulos(pool, modulos) {
    const cliente = await pool.connect()
    try {
        await cliente.query("BEGIN")

        for (const m of modulos) {
            await cliente.query(
                `UPDATE modulos SET estado=$1, dias_en_critico=$2,
                    cant_agua=$3, cant_nutrientes=$4, cant_energia=$5, cant_oxigeno=$6
                 WHERE id = $7`,
                [m.estado, m.dias_en_critico, m.cant_agua, m.cant_nutrientes,
                 m.cant_energia, m.cant_oxigeno, m.id]
            )

            // Un modulo desechado se lleva puestas sus plantas.
            const quedan = m.plantas.map(p => p.id)
            if (quedan.length === 0) {
                await cliente.query("DELETE FROM plantas WHERE modulo_id = $1", [m.id])
            } else {
                await cliente.query(
                    "DELETE FROM plantas WHERE modulo_id = $1 AND NOT (id = ANY($2::int[]))",
                    [m.id, quedan]
                )
            }

            for (const p of m.plantas) {
                await cliente.query(
                    `UPDATE plantas SET estado=$1, dias_transcurridos=$2,
                        porcentaje_agua=$3, porcentaje_nutrientes=$4, porcentaje_energia=$5
                     WHERE id = $6`,
                    [p.estado, p.dias_transcurridos, p.porcentaje_agua,
                     p.porcentaje_nutrientes, p.porcentaje_energia, p.id]
                )
            }
        }

        await cliente.query("COMMIT")
    } catch (e) {
        await cliente.query("ROLLBACK")
        throw e
    } finally {
        cliente.release()
    }
}
