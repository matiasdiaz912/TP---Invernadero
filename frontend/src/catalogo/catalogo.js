const API = "http://localhost:3000"

const catalog_grid = document.getElementById("catalog-grid")
const main_view = document.getElementById("main_view")
const catalog_page = document.getElementById("catalog-page")
const btn_nueva_especie = document.getElementById("btn-nueva-especie")

let nivelActual = 1

const CAMPOS = [
    { name: "nombre", label: "Nombre", type: "text", ancho: true },
    { name: "tamanio", label: "Tamaño (bloques)", type: "number" },
    { name: "nivel_requerido", label: "Nivel requerido", type: "number" },
    { name: "duracion", label: "Duración (días)", type: "number" },
    { name: "agua_requerida", label: "Agua requerida", type: "number" },
    { name: "oxigeno_requerido", label: "Oxígeno requerido", type: "number" },
    { name: "nutrientes_requeridos", label: "Nutrientes requeridos", type: "number" },
    { name: "energia_requerida", label: "Energía requerida", type: "number" },
    { name: "nutrientes_generados", label: "Nutrientes generados", type: "number" },
    { name: "oxigeno_generado", label: "Oxígeno generado", type: "number" },
    { name: "agua_generada", label: "Agua generada", type: "number" },
    { name: "comida_generada", label: "Comida generada", type: "number" },
    { name: "descripcion", label: "Descripción", type: "textarea", ancho: true },
    { name: "pathSvg", label: "SVG (opcional)", type: "textarea", ancho: true },
]

const cargarTodo = async () => {
    try {
        const [resEspecies, resEstado] = await Promise.all([
            fetch(`${API}/especies`),
            fetch(`${API}/estado-juego`),
        ])
        const especies = await resEspecies.json()
        const estado = await resEstado.json()
        nivelActual = estado.nivel
        renderGrid(especies)
    } catch (error) {
        console.error("Error al cargar el catálogo:", error)
    }
}

const renderGrid = (especies) => {
    catalog_grid.innerHTML = ""
    especies.forEach((especie) => {
        const bloqueado = especie.nivel_requerido > nivelActual
        const statusClass = bloqueado ? "locked" : ""
        const colorSvg = bloqueado ? 'stroke="#f97316" filter="none" opacity="0.4"' : ""

        const card_especie = document.createElement("div")
        card_especie.classList.add("plant-card")
        card_especie.style.borderColor = bloqueado ? "#f97316" : ""
        card_especie.innerHTML = `
            <div class="level-badge ${statusClass}">NVL ${especie.nivel_requerido}</div>
            <div class="plant-image-container">
                <svg viewBox="0 0 100 100" class="plant-svg" ${colorSvg}>
                    ${especie.pathsvg}
                </svg>
            </div>
            <div class="plant-info">
                <h3 class="plant-name" ${bloqueado ? 'style="color: #f97316;"' : ""}>${especie.nombre}</h3>
                <div class="plant-stats">
                    H2O: ${especie.agua_requerida} | O2: ${especie.oxigeno_requerido}
                </div>
            </div>
        `
        catalog_grid.appendChild(card_especie)
        card_especie.addEventListener("click", () => {
            mostrarDetalle(especie, bloqueado, statusClass, colorSvg)
        })
    })
}

const mostrarDetalle = (especie, bloqueado, statusClass, colorSvg) => {
    main_view.remove()
    const card_descripcion = document.createElement("div")
    card_descripcion.classList.add("planta-descripcion")
    card_descripcion.innerHTML = `
        <div class="catalog-header header-planta">
            <h2>> DETALLES SEMILLA</h2>
            <div>
                <button id="btn-back" class="btn-action ${statusClass}">[ VOLVER ATRAS ]</button>
            </div>
        </div>
        <div class="plant-card-descripcion">
            <div class="plant-image-container">
                <svg viewBox="0 0 100 100" class="plant-svg" ${colorSvg}>
                    ${especie.pathsvg}
                </svg>
                <div>
                    <h3>${especie.nombre}</h3>
                </div>
            </div>
            <div class="descripcion_planta">
                <h3 class="parrafo-detalles">REQUISITOS</h3>
                <h4>AGUA: ${especie.agua_requerida}L/dia</h4>
                <h4>OXIGENO: ${especie.oxigeno_requerido}%/dia</h4>
                <h4>NUTRIENTES: ${especie.nutrientes_requeridos}U/dia</h4>
                <h4>ENERGIA: ${especie.energia_requerida}W/dia</h4>
            </div>
            <div class="descripcion_planta">
                <h3 class="parrafo-detalles">BENEFICIOS</h3>
                <h4>AGUA: ${especie.agua_generada}</h4>
                <h4>OXIGENO: ${especie.oxigeno_generado}</h4>
                <h4>NUTRIENTES: ${especie.nutrientes_generados}</h4>
                <h4>ENERGIA: ${especie.comida_generada}</h4>
            </div>
            <div class="descripcion_planta">
                <p>Tiempo de sembrado: ${especie.duracion} días</p>
            </div>
        </div>
        <p>${especie.descripcion}</p>
        <div class="especie-detalle-acciones">
            <button id="btn-editar-especie" class="btn-action">[ EDITAR ]</button>
            <button id="btn-eliminar-especie" class="btn-action btn-alert">[ ELIMINAR ]</button>
        </div>
    `
    if (bloqueado) {
        card_descripcion.classList.add("plant-card-descripcion-desactivada")
    }
    catalog_page.appendChild(card_descripcion)

    document.getElementById("btn-back").addEventListener("click", volverAlGrid)
    document.getElementById("btn-editar-especie").addEventListener("click", () => abrirFormulario(especie))
    document.getElementById("btn-eliminar-especie").addEventListener("click", () => eliminarEspecie(especie))
}

const volverAlGrid = () => {
    const detalle = document.querySelector(".planta-descripcion")
    if (detalle) detalle.remove()
    if (!catalog_page.contains(main_view)) catalog_page.appendChild(main_view)
}

const abrirFormulario = (especie = null) => {
    const editando = !!especie
    const overlay = document.createElement("div")
    overlay.classList.add("modal-overlay")

    const inputs = CAMPOS.map((c) => {
        const valor = especie ? (especie[c.name.toLowerCase()] ?? "") : ""
        const control = c.type === "textarea"
            ? `<textarea name="${c.name}">${valor}</textarea>`
            : `<input type="${c.type}" name="${c.name}" value="${valor}" ${c.type === "number" ? 'step="any"' : ""}>`
        return `<div class="campo ${c.ancho ? "campo-ancho" : ""}"><label>${c.label}</label>${control}</div>`
    }).join("")

    overlay.innerHTML = `
        <div class="modal-especie">
            <h2>> ${editando ? "EDITAR" : "NUEVA"} ESPECIE</h2>
            <form class="form-especie" id="form-especie">
                ${inputs}
                <div class="form-error" id="form-error"></div>
                <div class="form-especie-acciones">
                    <button type="button" class="btn-action btn-alert" id="btn-cancelar">[ CANCELAR ]</button>
                    <button type="submit" class="btn-action">[ GUARDAR ]</button>
                </div>
            </form>
        </div>
    `
    document.body.appendChild(overlay)

    document.getElementById("btn-cancelar").addEventListener("click", () => overlay.remove())

    document.getElementById("form-especie").addEventListener("submit", async (ev) => {
        ev.preventDefault()
        const form = ev.target
        const datos = {}
        CAMPOS.forEach((c) => {
            const valor = form.elements[c.name].value
            datos[c.name] = c.type === "number" ? Number(valor) : valor
        })

        const url = editando ? `${API}/especies/${especie.id}` : `${API}/especies`
        const method = editando ? "PUT" : "POST"

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos),
        })

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            document.getElementById("form-error").textContent = err.error || "Error al guardar la especie"
            return
        }

        overlay.remove()
        volverAlGrid()
        cargarTodo()
    })
}

const eliminarEspecie = async (especie) => {
    if (!confirm(`¿Eliminar la especie "${especie.nombre}"?`)) return

    const res = await fetch(`${API}/especies/${especie.id}`, { method: "DELETE" })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "No se pudo eliminar la especie")
        return
    }
    volverAlGrid()
    cargarTodo()
}

btn_nueva_especie.addEventListener("click", () => abrirFormulario())

cargarTodo()
