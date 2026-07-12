const catalog_button = document.getElementById("button_catalog");
const main_view = document.getElementById("main_view");
const cant_comida = document.getElementById("cant_comida")
const cant_agua = document.getElementById("cant_agua")
const cant_energia = document.getElementById("cant_energia")
const cant_oxigeno = document.getElementById("cant_oxigeno")
const cant_nutrientes = document.getElementById("cant_nutrientes")
let crear_modulo_button = document.getElementById("crear-modulo-button")
let module_manage_button = document.getElementById("modules_manage_button")
const boton_avanzar_dia = document.getElementById("button_advance_day")
const contador_dias = document.getElementById("contador_dias")
let btn_close;

function activar_botones(){
    crear_modulo_button.disabled = false
    module_manage_button.disabled = false
    catalog_button.disabled = false
}

function desactivar_botones(){
    crear_modulo_button.disabled = true
    module_manage_button.disabled = true
    catalog_button.disabled = true
}


function cargarCatalogo(plantas) {
    const catalog = document.createElement("div");
    catalog.classList.add("catalog-window");
    catalog.id = "catalogo-header";
    catalog.innerHTML = `
                    <div class="catalog-header">
                        <h2>> CATÁLOGO DE SEMILLAS</h2>
                        <button id="btn-close" class="btn-close">[ CERRAR ]</button>
                    </div>
            
                    <div class="plant-grid" id="catalog-grid">
                        <!-- Las tarjetas se generan por JS -->
                    </div>`;

    main_view.insertAdjacentHTML("beforeend", catalog.outerHTML);
    const catalogGrid = document.getElementById("catalog-grid");
    plantas.forEach((planta) => {
        const bloqueado = planta.nivel_requerido > nivelActual;
        const statusClass = bloqueado ? "locked" : "";
        const colorSvg = bloqueado
            ? 'stroke="#f97316" filter="none" opacity="0.4"'
            : "";

        const cardHTML = `
                    <div class="plant-card" ${bloqueado ? 'style="border-color: #f97316; cursor: not-allowed;"' : ""}>
                        <div class="level-badge ${statusClass}">NVL ${planta.nivel_requerido}</div>
                        
                        <div class="plant-image-container">
                            <svg viewBox="0 0 100 100" class="plant-svg" ${colorSvg}>
                                ${planta.pathSvg}
                            </svg>
                        </div>
                        
                        <div class="plant-info">
                            <h3 class="plant-name" ${bloqueado ? 'style="color: #f97316;"' : ""}>${planta.nombre}</h3>
                            <div class="plant-stats">
                                H2O: ${planta.agua_requerida} | O2: ${planta.oxigeno_requerido}
                            </div>
                        </div>
                    </div>
                `;
        catalogGrid.insertAdjacentHTML("beforeend", cardHTML);
    });
}

const nivelActual = 3; // Simula el nivel actual del jugador
catalog_button.addEventListener("click", () => {
    fetch("http://localhost:3000/plantas")
        .then((res) => res.json())
        .then((data) => {
            cargarCatalogo(data)
            desactivar_botones(); // Deshabilita el botón después de cargar el catálogo
            btn_close = document.getElementById("btn-close");
            btn_close.addEventListener("click", () => {
                const catalogWindow = document.getElementById("catalogo-header");
                catalogWindow.remove();
                activar_botones(); // Reactiva los botones después de cerrar el catálogo
            });
        })
        .catch((error) => console.error("Error al cargar el catálogo:", error));
});

btn_close?.addEventListener("click", () => {
    const catalogWindow = document.getElementById("catalogo-header");
    catalogWindow.style.display = "none";
});

//Manejo del contador de días
let contador = 0
let contador_encendido = false

boton_avanzar_dia.addEventListener("click", async () => {
    contador_encendido = !contador_encendido
    if (!contador_encendido) {
        boton_avanzar_dia.innerText = "AVANZAR CICLO DÍA"
        return
    }
    boton_avanzar_dia.innerText = "DETENER CICLO DÍA"
    let timer = setInterval(async () => {
        if (!contador_encendido) {
            contador_encendido = false
            clearInterval(timer)
            return
        }
        if (contador == 0) {
            generar_logs("SISTEMA INICIADO... [OK]", "info")
        }

        if (contador % 10 == 0) {
            await generar_evento()
        }
        await obtener_recursos()

        contador++;
        contador_dias.innerText = `DÍA: [ ${contador} ]`
    }, 1000)
})

const generar_evento = async () => {
    const response = await fetch("http://localhost:3000/evento")
    const evento = await response.json()
    let evento_banner = document.createElement("div")
    evento_banner.innerHTML = `
                    <h3>${evento.nombre}</h3>
                    <p>${evento.descripcion}</p>
                `
    evento_banner.classList.add("evento-banner")
    if(evento.tipo == "positivo") evento_banner.classList.add("evento-positivo")
    main_view.appendChild(evento_banner)
    if (evento.tipo == "negativo") {
        generar_logs(`DIA ${contador}: ALERTA! ${evento.nombre} - ${evento.descripcion}`, "alerta")
    } else {
        generar_logs(`DIA ${contador}: VAYA SUERTE!: ${evento.nombre} - ${evento.descripcion}`, "info")
    }
    setTimeout(() => {
        evento_banner.remove()
    }, 5000)
}

const generar_logs = (mensaje, tipo) => {
    if (document.querySelector("footer").children.length == 5) {
        document.querySelector("footer").children[0].remove()
    }
    let log_sistema_iniciado = document.createElement("div")
    log_sistema_iniciado.classList.add("log-entry")
    if (tipo == "alerta") {
        log_sistema_iniciado.style.color = "var(--neon-alert)"
    } else {
        log_sistema_iniciado.style.color = "#94a3b8"
    }
    log_sistema_iniciado.innerText = mensaje
    document.querySelector("footer").appendChild(log_sistema_iniciado)

}

const obtener_recursos = async () => {
    const response = await fetch("http://localhost:3000/recursos")
    const recursos = await response.json()
    cant_agua.innerText = recursos.cant_agua
    cant_oxigeno.innerText = recursos.cant_oxigeno
    cant_energia.innerText = recursos.cant_energia
    cant_nutrientes.innerText = recursos.cant_nutrientes
    cant_comida.innerText = recursos.cant_comida
    return recursos
}

//Modulos
crear_modulo_button.addEventListener("click", async () => {
    let recursos = await obtener_recursos()
    let form_modulo = document.createElement("div")
    form_modulo.innerHTML = `
        <div class="catalog-header">
            <h2>> CREAR MÓDULO </h2>
            <button id="btn-close-modulo" class="btn-close btn-modulo">[ CERRAR ]</button>
        </div>
        <form>
            <label>Nombre: </label>
            <input required id="nombre_modulo" type="text"></input>
            <label>Cantidad de agua suministrada:
                <input value="${recursos.cant_agua}" id="input_agua" type="range" min="0" max="${recursos.cant_agua}"></input>
                <p>${recursos.cant_agua}</p>
            </label>
            <label>Cantidad de oxígeno suministrado:
                <input value="${recursos.cant_oxigeno}" id="input_oxigeno" type="range" min="0" max="${recursos.cant_oxigeno}"></input>
                <p>${recursos.cant_oxigeno}</p>
            </label>
            <label>Cantidad de energía suministrada:
                <input value="${recursos.cant_energia}" id="input_energia" type="range" min="0" max="${recursos.cant_energia}"></input>
                <p>${recursos.cant_energia}</p>
            </label>
            <label>Cantidad de nutrientes suministrados:
                <input value="${recursos.cant_nutrientes}" id="input_nutrientes" type="range" min="0" max="${recursos.cant_nutrientes}"></input>
                <p>${recursos.cant_nutrientes}</p>
            </label>
            <button class="btn-close crear-modulo-boton" type="submit">CREAR MÓDULO</button>
        </form>
    `
    form_modulo.classList.add("formulario-modulo")
    desactivar_botones()
    main_view.appendChild(form_modulo)
    let inputs = form_modulo.querySelectorAll("input")
    let btn_cerrar = document.getElementById("btn-close-modulo")
    btn_cerrar.addEventListener("click", () => {
        form_modulo.remove()
        activar_botones()
    })

    form_modulo.addEventListener("submit", async (event) => {
    event.preventDefault()

    const response = await fetch("http://localhost:3000/modulos", {
        method: "POST",
        body: JSON.stringify({
            nombre: inputs[0].value,
            cant_agua: inputs[1].value,
            cant_oxigeno: inputs[2].value,
            cant_energia: inputs[3].value,
            cant_nutrientes: inputs[4].value
        }),
        headers: { "Content-Type": "application/json" }
    })

    if (response.ok) {
        generar_logs(`Módulo "${inputs[0].value}" creado correctamente`, "info")
        form_modulo.remove()
        activar_botones()
    } else {
        generar_logs("No se pudo crear el módulo", "alerta")
    }
})

    form_modulo.querySelectorAll("input[type='range']").forEach((input) => {
        input.addEventListener("input", (event) => {
            const value = event.target.value;
            const pElement = event.target.nextElementSibling;
            pElement.textContent = value;
        })
    })
})


function create_header(title){
    return `
        <div class="catalog-header">
            <h2>>${title}</h2>

            <button id="btn-close-modulo" class="btn-close">[ CERRAR ]</button>
        </div>
    `
}

module_manage_button.addEventListener("click", async () => {
    let dataServer = await fetch("http://localhost:3000/modulos")
    let data = await dataServer.json()

    let modulos_contenedor = document.createElement("div")
    modulos_contenedor.classList.add("catalog-window")
    modulos_contenedor.innerHTML = create_header("GESTION DE MODULOS")
    desactivar_botones()
    main_view.appendChild(modulos_contenedor)

    let button_cerrar = document.getElementById("btn-close-modulo")
    if (data.length == 0) {
        let not_modules = document.createElement("p")
        not_modules.innerText = "No hay modulos creados"
        not_modules.style.textAlign = "center"
        modulos_contenedor.appendChild(not_modules)
    } else {
        let barra_info_modulos = document.createElement("ul")
        barra_info_modulos.classList.add("barra-info-modulos")
        barra_info_modulos.innerHTML = `
            <li>ID</li>
            <li>NOMBRE</li>
            <li>AGUA</li>
            <li>OXIGENO</li>
            <li>ENERGIA</li>
            <li>NUTRIENTES</li>
            `
        modulos_contenedor.appendChild(barra_info_modulos)
        data.forEach((modulo) => {
            let module = document.createElement("div")
            module.classList.add("btn-action", "module-card")
            module.innerHTML = `
                <p>${modulo.id}</p>
                <p>${modulo.nombre}</p>
                <p>${modulo.cant_agua}</p>
                <p>${modulo.cant_oxigeno}</p>
                <p>${modulo.cant_energia}</p>
                <p>${modulo.cant_nutrientes}</p>
            `
            modulos_contenedor.appendChild(module)

            module.addEventListener("click", () =>{
                let modulo_detalles = document.createElement("div")
                modulo_detalles.classList.add("catalog-window")
                modulo_detalles.innerHTML = `
                    <div class="catalog-header">
                        <h2>> DETALLES DEL MÓDULO</h2>
                        <div>
                            <button id="btn-back-modulo-detalles" class="btn-close">[ VOLVER ATRAS ]</button>
                            <button id="btn-close-modulo-detalles" class="btn-close">[ CERRAR ]</button>
                        </div>
                    </div>
                    <div class="module-details">
                        <p><strong>ID:</strong> ${modulo.id}</p>
                        <p><strong>Nombre:</strong> ${modulo.nombre}</p>
                        <p><strong>Agua:</strong> ${modulo.cant_agua}</p>
                        <p><strong>Oxígeno:</strong> ${modulo.cant_oxigeno}</p>
                        <p><strong>Energía:</strong> ${modulo.cant_energia}</p>
                        <p><strong>Nutrientes:</strong> ${modulo.cant_nutrientes}</p>
                    </div>
                `

                modulos_contenedor.remove()
                main_view.appendChild(modulo_detalles)
                let btn_back = document.getElementById("btn-back-modulo-detalles")
                let btn_close_module = document.getElementById("btn-close-modulo-detalles")

                btn_back.addEventListener("click", () =>{
                    modulo_detalles.remove()
                    main_view.appendChild(modulos_contenedor)
                })

                btn_close_module.addEventListener("click", () =>{
                    modulo_detalles.remove()
                    activar_botones()
                })
            })
        })
    }

    button_cerrar.addEventListener("click", () => {
        modulos_contenedor.remove()
        activar_botones()
    })
})