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

function activar_botones() {
    crear_modulo_button.disabled = false
    module_manage_button.disabled = false
    catalog_button.disabled = false
}

function desactivar_botones() {
    crear_modulo_button.disabled = true
    module_manage_button.disabled = true
    catalog_button.disabled = true
}


function cargarCatalogo(plantas, modulo) {
    let planta_retornada = null
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

    main_view.appendChild(catalog);
    const nivelActual = 3; // Nivel actual del jugador, esto debería venir de la lógica del juego
    const catalogGrid = document.getElementById("catalog-grid");
    plantas.forEach((planta) => {
        const bloqueado = planta.nivel_requerido > nivelActual;
        const statusClass = bloqueado ? "locked" : "";
        const colorSvg = bloqueado
            ? 'stroke="#f97316" filter="none" opacity="0.4"'
            : "";

        let card_planta = document.createElement("div")
        card_planta.classList.add("plant-card");
        card_planta.style.borderColor = bloqueado ? "#f97316" : "";
        card_planta.innerHTML = `
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
                `;
        catalogGrid.appendChild(card_planta);
        card_planta.addEventListener("click", () => {
            catalog.remove();
            let card_descripcion = document.createElement("div")
            card_descripcion.classList.add("planta-descripcion")
            card_descripcion.innerHTML = `
                <div class="catalog-header header-planta">
                        <h2>> DETALLES SEMILLA</h2>
                        <button id="btn-close" class="btn-close">[ CERRAR ]</button>
                </div>
                <div class="plant-card-descripcion">
                    <div class="plant-image-container">
                        <svg viewBox="0 0 100 100" class="plant-svg" ${colorSvg}>
                            ${planta.pathSvg}
                        </svg>
                    </div>
                    <div class="descripcion_planta">
                        <h3>${planta.nombre}</h3>
                        <h4>AGUA: ${planta.agua_requerida}</h4>
                        <h4>OXIGENO: ${planta.oxigeno_requerido}</h4>
                    </div>
                </div>

                <button id="sembrar-button" class="btn-action">SEMBRAR</button>
            `;

            if (bloqueado) {
                card_descripcion.classList.add("plant-card-descripcion-desactivada")
            }
            
            main_view.appendChild(card_descripcion);

            btn_close = document.getElementById("btn-close");
            btn_close.addEventListener("click", () => {
                card_descripcion.remove();
                activar_botones();
            });
            let btn_sembrar = document.getElementById("sembrar-button")
            if(modulo == null){
                btn_sembrar.disabled = true
            }
            btn_sembrar.addEventListener("click", async () =>{
                const response = await fetch(`http://localhost:3000/modulos/${modulo.id}/plantas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ especie_id: planta.id })
            })

            if (response.ok) {
                generar_logs(`Planta sembrada en "${modulo.nombre}"`, "info")
            } else {
                generar_logs("No se pudo sembrar la planta", "alerta")
            }
            })
        })
    })

    desactivar_botones();
    btn_close = document.getElementById("btn-close");
    btn_close.addEventListener("click", () => {
        const catalogWindow = document.getElementById("catalogo-header");
        catalogWindow.remove();
        activar_botones();
    });

    return planta_retornada
}

const nivelActual = 3;
catalog_button.addEventListener("click", () => {
    fetch("http://localhost:3000/plantas")
        .then((res) => res.json())
        .then((data) => {
            let info = cargarCatalogo(data,null)
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
    if (evento.tipo == "positivo") evento_banner.classList.add("evento-positivo")
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


function create_header(title) {
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

            module.addEventListener("click", () => {
                mostrarDetalleModulo(modulo.id, modulos_contenedor)
            })
        })
    }

    button_cerrar.addEventListener("click", () => {
        modulos_contenedor.remove()
        activar_botones()
    })
})

async function mostrarDetalleModulo(modulo_id, modulos_contenedor) {
    const [modulosRes, plantasRes] = await Promise.all([
        fetch("http://localhost:3000/modulos"),
        fetch("http://localhost:3000/plantas")
    ])
    const modulos_data = await modulosRes.json()
    const catalogo = await plantasRes.json()
    const modulo = modulos_data.find(m => m.id == modulo_id)

    document.getElementById("modulo-detalles-window")?.remove()
    modulos_contenedor.remove()

    let modulo_detalles = document.createElement("div")
    modulo_detalles.id = "modulo-detalles-window"
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
        <div class="module-plantas">
            <h3>> PLANTAS SEMBRADAS</h3>
            <ul id="lista-plantas-modulo"></ul>
        </div>
        <div class="btn-acciones-modulo">
            <button id="btn-sembrar" class="btn-action">SEMBRAR</button>
            <button id="btn-cosechar" class="btn-action">COSECHAR</button>
            <button id="btn-gestionar" class="btn-action">GESTIONAR RECURSOS</button>
        </div>
    `

    main_view.appendChild(modulo_detalles)

    const lista_plantas = document.getElementById("lista-plantas-modulo")
    if (modulo.plantas.length === 0) {
        lista_plantas.innerHTML = "<li>Todavía no hay plantas sembradas</li>"
    } else {
        modulo.plantas.forEach((planta) => {
            const especie = catalogo.find(p => p.id == planta.especie_id)
            const li = document.createElement("li")
            li.textContent = `${especie ? especie.nombre : "?"} — ${planta.estado} (día ${planta.dias_transcurridos}/${especie ? especie.duracion : "?"})`
            lista_plantas.appendChild(li)
        })
    }

    let btn_sembrar = document.getElementById("btn-sembrar")
    btn_sembrar.addEventListener("click", async () => {
        modulo_detalles.remove()
        desactivar_botones()
        cargarCatalogo(catalogo, modulo)
    })

    document.getElementById("btn-back-modulo-detalles").addEventListener("click", () => {
        modulo_detalles.remove()
        main_view.appendChild(modulos_contenedor)
    })

    document.getElementById("btn-close-modulo-detalles").addEventListener("click", () => {
        modulo_detalles.remove()
        activar_botones()
    })
}


// const dbPlantas = [
//             // Originales
//             { id: "tomate", nombre: "Tomate Base", nivel: 1, reqAgua: "2L", reqOx: "1%", pathSvg: '<circle cx="50" cy="40" r="15"/><path d="M50 25 V15 M40 15 Q50 20 60 15"/>' },
//             { id: "lechuga", nombre: "Lechuga Hidro", nivel: 1, reqAgua: "2L", reqOx: "0.5%", pathSvg: '<path d="M50 80 Q30 60 40 30 Q50 10 60 30 Q70 60 50 80 Z"/><path d="M50 80 V30"/>' },
//             { id: "rabano", nombre: "Rábano Rápido", nivel: 1, reqAgua: "0.5L", reqOx: "0.5%", pathSvg: '<path d="M50 70 Q30 40 50 20 Q70 40 50 70 Z"/><path d="M50 70 V90 M40 10 Q50 20 60 10"/>' },
//             { id: "papa", nombre: "Papa Sub-Terra", nivel: 3, reqAgua: "3L", reqOx: "1.5%", pathSvg: '<ellipse cx="50" cy="60" rx="25" ry="18"/><circle cx="40" cy="55" r="2"/><circle cx="60" cy="65" r="1.5"/><path d="M50 42 V20 M35 25 Q50 30 65 25"/>' },
//             { id: "espirulina", nombre: "Microalgas (Tanque)", nivel: 4, reqAgua: "4L", reqOx: "0.1%", pathSvg: '<rect x="25" y="20" width="50" height="60" rx="5"/><path d="M25 40 Q50 50 75 40 M25 60 Q50 70 75 60" stroke-dasharray="2 2"/>' },
//             { id: "soja", nombre: "Soja Estructural", nivel: 5, reqAgua: "3L", reqOx: "2.5%", pathSvg: '<path d="M50 90 V20 M50 70 Q70 60 70 40 M50 50 Q30 40 30 20 M50 30 Q65 20 65 10"/>' },
            
//             // Inventadas (Bio-Ingeniería para Marte)
//             { id: "musgo_ares", nombre: "Musgo Oxigenador X-7", nivel: 2, reqAgua: "0.2L", reqOx: "-5%", pathSvg: '<path d="M20 80 Q50 60 80 80 Q70 50 90 30 Q50 40 10 30 Q30 50 20 80 Z" stroke-dasharray="3 3"/>', desc: "Alta prod. de O2" },
//             { id: "tuberculo_ferrico", nombre: "Tubérculo Férrico", nivel: 4, reqAgua: "1.5L", reqOx: "1%", pathSvg: '<polygon points="50,80 30,50 40,20 60,20 70,50"/><path d="M50 80 L50 20 M30 50 L70 50"/>', desc: "Nutrición Densa" },
//             { id: "hongo_luminico", nombre: "Fungi Rad-Lumínico", nivel: 6, reqAgua: "1L", reqOx: "0%", pathSvg: '<path d="M50 20 C20 20 20 50 50 50 C80 50 80 20 50 20 Z"/><path d="M40 50 V80 M60 50 V80 M30 10 L40 25 M70 10 L60 25" stroke-dasharray="1 4"/>', desc: "Procesa Radiación" }
//         ];