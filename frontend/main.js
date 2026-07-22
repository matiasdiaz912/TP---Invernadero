const catalog_button = document.getElementById("button_catalog");
const main_view = document.getElementById("main_view");
const cant_comida = document.getElementById("cant_comida")
const cant_agua = document.getElementById("cant_agua")
const cant_energia = document.getElementById("cant_energia")
const cant_oxigeno = document.getElementById("cant_oxigeno")
const cant_nutrientes = document.getElementById("cant_nutrientes")
const crear_modulo_button = document.getElementById("crear-modulo-button")
const module_manage_button = document.getElementById("modules_manage_button")
const boton_avanzar_dia = document.getElementById("button_advance_day")
const contador_dias = document.getElementById("contador_dias")
const cant_tripulantes = document.getElementById("cant_tripulantes")
const contador_nivel = document.getElementById("contador_nivel")
const button_resources = document.getElementById("button-resources")
const button_help = document.getElementById("button-help")

const nivelActual = 3;
let contador = 0
let contador_encendido = false

function activar_botones() {
    crear_modulo_button.disabled = false
    module_manage_button.disabled = false
    catalog_button.disabled = false
    boton_avanzar_dia.disabled = false
    button_resources.disabled = false
    button_help.disabled = false
}

function desactivar_botones() {
    crear_modulo_button.disabled = true
    module_manage_button.disabled = true
    catalog_button.disabled = true
    boton_avanzar_dia.disabled = true
    button_resources.disabled = true
    button_help.disabled = true
}

const reiniciarJuego = async () => {
    activar_botones()
    const response = await fetch("http://localhost:3000/reiniciar")
    let data = await response.json()
    return data
}

const cargarCatalogo = (plantas, modulo, nivel) => {
    let planta_retornada = null
    const catalog = document.createElement("div");
    catalog.classList.add("catalog-window");
    catalog.id = "catalogo-header";
    catalog.innerHTML = `
                    <div class="catalog-header">
                        <h2>> CATÁLOGO DE SEMILLAS</h2>
                        <button id="btn-close-catalog" class="btn-action">[ CERRAR ]</button>
                    </div>
            
                    <div class="plant-grid" id="catalog-grid">
                        <!-- Las tarjetas se generan por JS -->
                    </div>`;

    main_view.appendChild(catalog);
    const nivelActual = nivel;
    const catalogGrid = document.getElementById("catalog-grid");
    let btn_close_catalog = document.getElementById("btn-close-catalog")
    btn_close_catalog.addEventListener("click", () => {
    const descripcion = document.querySelector(".planta-descripcion");
    if (descripcion) descripcion.remove();
    catalog.remove();
    activar_botones();
    })
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
            catalog.classList.add("catalog-hidden");
            let card_descripcion = document.createElement("div")
            card_descripcion.classList.add("planta-descripcion")
            card_descripcion.innerHTML = `
                <div class="catalog-header header-planta">
                        <h2>> DETALLES SEMILLA</h2>
                    <div>
                        <button id="btn-back" class="btn-action ${statusClass}">[ VOLVER ATRAS ]</button>
                        <button id="btn-close-detalles" class="btn-action ${statusClass}">[ CERRAR ]</button>
                    </div>
            
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

            let btn_close_detalles = document.getElementById("btn-close-detalles");
            let btn_back = document.getElementById("btn-back")
            btn_close_detalles.addEventListener("click", () => {
            card_descripcion.remove();
            catalog.remove();
            activar_botones();
            });

            btn_back.addEventListener("click", () => {
                card_descripcion.remove();
                catalog.classList.remove("catalog-hidden");
            })

            let btn_sembrar = document.getElementById("sembrar-button")
            if (modulo == null || bloqueado) {
                btn_sembrar.disabled = true
            }
            btn_sembrar.addEventListener("click", async () => {

                let response = await fetch(`http://localhost:3000/modulos/${modulo.id}/${planta.id}`)
                let msg = await response.json()
                if (response.ok) {
                    generar_logs(`Planta sembrada en "${modulo.nombre}"`, "info")
                } else {
                    generar_logs(msg.error, "alerta")
                }
            })
        })
    })

    desactivar_botones();
    let btn_close = document.getElementById("btn-close-catalog");
    btn_close.addEventListener("click", () => {
        // const catalogWindow = document.getElementById("catalogo-header");
        catalog.remove();
        activar_botones();
    });

    return planta_retornada
}

catalog_button.addEventListener("click", async () => {
    fetch("http://localhost:3000/plantas")
        .then((res) => res.json())
        .then(async (data) => {
            const response = await fetch("http://localhost:3000/estado-juego")
            const estado_juego = await response.json()
            let nivel = estado_juego.nivel
            let info = cargarCatalogo(data, null, nivel)
        })
        .catch((error) => console.error("Error al cargar el catálogo:", error));
});




















//Manejo del contador de días
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

        const response = await fetch("http://localhost:3000/avanzar-dia")
        const data = await response.json()

        if (data.recursos.cant_agua < 50 || data.recursos.cant_comida < 60 || data.recursos.cant_oxigeno == 0) {
            main_view.classList.add("resources-danger")
            setTimeout(() => {
                main_view.classList.remove("resources-danger")
            }, 500)
        }

        if (data.dia_actual == 1) {
            generar_logs("SISTEMA INICIADO... [OK]", "info")
        }

        if (data.dia_actual % 10 == 0) {
            await generar_evento()
        }

        if (data.eventos.length != 0) {
            data.eventos.forEach((evento) => {
                if (evento.tipo == "alerta") generar_logs(`DIA ${data.dia_actual}: ALERTA! ${evento.mensaje}`, "alerta")
                else generar_logs(`DIA ${data.dia_actual}: ALERTA! ${evento.mensaje}`, "info")
            })
        }

        if (data.estado == "victoria") {
            const banner_victoria = document.createElement("div")
            banner_victoria.classList.add("banner-juego-finalizado")
            banner_victoria.innerHTML = `
                <h1>FELICIDADES, LOGRASTE SALVAR A LA CIVILIZACION</h1>
                <button id="btn-reiniciar" class="btn-action">JUGAR DE NUEVO</button>
            `
            main_view.appendChild(banner_victoria)
            desactivar_botones()
            contador_encendido = false
        } else if (data.estado == "derrota") {
            const banner_derrota = document.createElement("div")
            banner_derrota.classList.add("banner-juego-finalizado", "banner-derrota")
            banner_derrota.innerHTML = `
                <h1>HAS PERDIDO, LOS TRIPULANTES HAN MUERTO</h1>
                <button id="btn-reiniciar" class="btn-action">JUGAR DE NUEVO</button>
            `
            main_view.appendChild(banner_derrota)
            desactivar_botones()
            contador_encendido = false

            let btn_reiniciar = document.getElementById("btn-reiniciar")
            btn_reiniciar.addEventListener("click", async () => {
                const datos_iniciales = await reiniciarJuego()
                generar_nuevos_datos(datos_iniciales)
                banner_derrota.remove()
            })
        }
        generar_nuevos_datos(data)

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
    return recursos
}


const generar_nuevos_datos = (data) => {
    cant_agua.innerText = data.recursos.cant_agua
    cant_oxigeno.innerText = data.recursos.cant_oxigeno
    cant_energia.innerText = data.recursos.cant_energia
    cant_nutrientes.innerText = data.recursos.cant_nutrientes
    cant_comida.innerText = data.recursos.cant_comida
    cant_tripulantes.innerText = `TRIPULACIÓN: [ ${data.tripulantes}/30 ]`
    contador = data.dia_actual
    contador_dias.innerText = `DÍA: [ ${data.dia_actual} ]`
}














//Modulos
crear_modulo_button.addEventListener("click", async () => {
    let recursos = await obtener_recursos()
    let form_modulo = document.createElement("div")
    form_modulo.innerHTML = `
        <div class="catalog-header">
            <h2>> CREAR MÓDULO</h2>
            <button id="btn-close-modulo" class="btn-action btn-modulo">[ CERRAR ]</button>
        </div>
        <form>
            <label>Nombre: </label>
            <input required id="nombre_modulo" class="input-nombre-modulo" type="text"></input>
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
            <button class="btn-action crear-modulo-boton" type="submit">CREAR MÓDULO</button>
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
                cant_nutrientes: inputs[4].value,
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

            <button id="btn-close-modulo" class="btn-action">[ CERRAR ]</button>
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
                <button id="btn-back-modulo-detalles" class="btn-action">[ VOLVER ATRAS ]</button>
                <button id="btn-close-modulo-detalles" class="btn-action">[ CERRAR ]</button>
            </div>
        </div>
        <div class="module-details">
            <p><strong>ID:</strong> ${modulo.id}</p>
            <p><strong>Nombre:</strong> ${modulo.nombre}</p>
            <p><strong>Agua:</strong> ${modulo.cant_agua}</p>
            <p><strong>Oxígeno:</strong> ${modulo.cant_oxigeno}</p>
            <p><strong>Energía:</strong> ${modulo.cant_energia}</p>
            <p><strong>Nutrientes:</strong> ${modulo.cant_nutrientes}</p>
            <p><strong>NIVEL:</strong>${modulo.nivel}</p>
        </div>
        <div class="module-plantas">
            <h3>> PLANTAS SEMBRADAS</h3>
            <ul id="lista-plantas-modulo"></ul>
        </div>
        <div class="btn-acciones-modulo">
            <button id="btn-sembrar" class="btn-action">SEMBRAR</button>
            <button id="btn-gestionar" class="btn-action">GESTIONAR RECURSOS</button>
            <button id="btn-mejorar-modulo" class="btn-action">MEJORAR MODULO</button>
            <button id="btn-eliminar-modulo" class="btn-action">ELIMINAR MODULO</button>
        </div>
    `

    main_view.appendChild(modulo_detalles)

    const lista_plantas = document.getElementById("lista-plantas-modulo")
    if (modulo.plantas.length === 0) {
        lista_plantas.innerHTML = "<li>Todavía no hay plantas sembradas</li>"
    } else {
        modulo.plantas.forEach((planta) => {
            const planta_sembrada = document.createElement("div")
            planta_sembrada.classList.add("lista-plantas-modulo")
            planta_sembrada.innerHTML = `<li>${planta.nombre} — ${planta.estado} (día ${planta.dias_transcurridos}/${planta.duracion})</li>`
            if (planta.estado == "lista_para_cosechar") {
                const btn_cosechar = document.createElement("button")
                btn_cosechar.innerHTML = "[ COSECHAR }"
                btn_cosechar.classList.add("btn-action")
                planta_sembrada.appendChild(btn_cosechar)

                btn_cosechar.addEventListener("click", async () => {
                    planta_sembrada.remove()
                    let nivelActual = await fetch(`http://localhost:3000/modulos/${modulo.id}`, {
                        method: "PUT",
                        body: JSON.stringify(planta),
                        headers: { "Content-Type": "application/json" }
                    })
                    nivelActual = await nivelActual.json()

                    contador_nivel.textContent = `NIVEL: [ ${nivelActual.nivel} ]`
                })
            }
            lista_plantas.appendChild(planta_sembrada)
        })
    }
       let btn_gestionar = document.getElementById("btn-gestionar")
btn_gestionar.addEventListener("click", () => {
    modulo_detalles.remove()
    let gestionar_recursos = document.createElement("div")
    gestionar_recursos.classList.add("catalog-window")
    gestionar_recursos.innerHTML = `
        <div class="catalog-header">
            <h2>> GESTIONAR RECURSOS</h2>
            <button id="btn-close-gestionar" class="btn-action">[ CERRAR ]</button>
        </div>
        <div class="gestionar-recursos">
            <label>AGUA A AGREGAR:</label>
            <input id="input-agua" type="number" min="0" class="btn-action" placeholder="0"/>
            <label>NUTRIENTES A AGREGAR:</label>
            <input id="input-nutrientes" type="number" min="0" class="btn-action" placeholder="0"/>
            <label>ENERGIA A AGREGAR:</label>
            <input id="input-energia" type="number" min="0" class="btn-action" placeholder="0"/>
            <button id="btn-confirmar-recursos" class="btn-action">CONFIRMAR</button>
        </div>
    `
    main_view.appendChild(gestionar_recursos)

    document.getElementById("btn-close-gestionar").addEventListener("click", () => {
        gestionar_recursos.remove()
        activar_botones()
    })

    document.getElementById("btn-confirmar-recursos").addEventListener("click", async () => {
        const agua = parseFloat(document.getElementById("input-agua").value) || 0
        const nutrientes = parseFloat(document.getElementById("input-nutrientes").value) || 0
        const energia = parseFloat(document.getElementById("input-energia").value) || 0

        const response = await fetch(`http://localhost:3000/modulos/${modulo.id}/recursos`, {
            method: "PUT",
            body: JSON.stringify({ agua, nutrientes, energia }),
            headers: { "Content-Type": "application/json" }
        })
        const data = await response.json()
        if (response.ok) {
            generar_logs(`Recursos actualizados en "${modulo.nombre}"`, "info")
        } else {
            generar_logs(data.error, "alerta")
        }
        gestionar_recursos.remove()
        activar_botones()
    })
})     
    let btn_sembrar = document.getElementById("btn-sembrar")
    btn_sembrar.addEventListener("click", async () => {
        modulo_detalles.remove()
        desactivar_botones()
        const response = await fetch("http://localhost:3000/estado-juego")
        const estado_juego = await response.json()
        let nivel = estado_juego.nivel
        cargarCatalogo(catalogo, modulo, nivel)
    })

    let btn_eliminar_modulo = document.getElementById("btn-eliminar-modulo")
    btn_eliminar_modulo.addEventListener("click", async () => {
        modulo_detalles.remove()
        activar_botones()
        generar_logs(`Modulo ${modulo.nombre} eliminado`, "alerta")
        await fetch(`http://localhost:3000/modulos/${modulo.id}`, {
            method: "DELETE"
        })
    })

    let btn_mejorar_modulo = document.getElementById("btn-mejorar-modulo")
    btn_mejorar_modulo.addEventListener("click", async () => {
        console.log(btn_mejorar_modulo);

        const response = await fetch(`http://localhost:3000/modulos`, {
            method: "PUT",
            body: JSON.stringify(modulo),
            headers: { "Content-Type": "application/json" }
        })
        const data = await response.json()
        if (data.type == "error") {
            generar_logs(data.msg, "alerta")
        } else {
            generar_logs(data.msg, "info")
        }

        const newMsg = document.createElement("div")
        modulo_detalles.remove()
        newMsg.innerHTML = `
            <h2>${data.msg}</h2>
            <button id="btn-back-modulo-details" class="btn-action" >[ VOLVER ]</button>
        `
        newMsg.classList.add("catalog-window", "modulo-modificado")
        main_view.appendChild(newMsg)

        document.getElementById("btn-back-modulo-details").addEventListener("click", () => {
            newMsg.remove()
            main_view.appendChild(modulo_detalles)
        })
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



// AYUDA

button_help.addEventListener("click", () => {
    main_view.innerHTML = `
        <h1>AYUDA</h1>
        <h3>CUANDO TERMINA EL JUEGO</h3>
        <p>El usuario ganara el juego cuando logre llegar al dia 180 con al menos un tripulante vivo</p>
        <h3>COMO GESTIONAR LOS RECURSOS</h3>
        <p>Los recursos se iran reduciendo a medida que el juego avanza, pero la clave esta en la gestion de recursos en los modulos. \n 
            si bien se pueden usar todos los recursos para alimentar un modulo, esto conllevaria a una escases de recursos para los tripulantes.
            Para lograr que la cantidad de tripulantes se mantenga estable es recomendable visualizar la seccion de estado de los recursos.\n
        </p>
    `
})


//RECURSOS

button_resources.addEventListener("click", async () => {
    desactivar_botones()
    const grafico_estadisticas = document.createElement("div")
    grafico_estadisticas.classList.add("stats-panel")
    grafico_estadisticas.innerHTML = `
        <div class="catalog-header">
            <h2>> ESTADO RECURSOS </h2>
            <button id="btn-close" class="btn-action">[ CERRAR ]</button>
        </div>

        <div class="vital-rings-container">
            <div class="ring-wrapper" id="ring-energy">
                <svg class="progress-ring" width="100" height="100">
                    <circle class="progress-ring-circle-bg" cx="50" cy="50" r="40" />
                    <circle class="progress-ring-circle" cx="50" cy="50" r="40" />
                </svg>
                <div class="ring-value" id="val-energy">0%</div>
                <div class="ring-label">ENERGÍA</div>
            </div>

            <div class="ring-wrapper" id="ring-oxygen">
                <svg class="progress-ring" width="100" height="100">
                    <circle class="progress-ring-circle-bg" cx="50" cy="50" r="40" />
                    <circle class="progress-ring-circle" cx="50" cy="50" r="40" />
                </svg>
                <div class="ring-value" id="val-oxygen">0%</div>
                <div class="ring-label">OXÍGENO</div>
            </div>

            <div class="ring-wrapper" id="ring-water">
                <svg class="progress-ring" width="100" height="100">
                    <circle class="progress-ring-circle-bg" cx="50" cy="50" r="40" />
                    <circle class="progress-ring-circle" cx="50" cy="50" r="40" />
                </svg>
                <div class="ring-value" id="val-water">0 L</div>
                <div class="ring-label">AGUA</div>
            </div>
        </div>

        <div class="inventory-bars-container">
            
            <div class="stat-row" id="bar-food">
                <div class="stat-info">
                    <span>RESERVAS DE COMIDA</span>
                    <span class="stat-trend trend-down">▼ -5/día</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill" id="fill-food"></div>
                </div>
                <div style="text-align: right; font-size: 0.7rem;" id="val-food">0 / 100 ítems</div>
            </div>

            <div class="stat-row" id="bar-nutrients">
                <div class="stat-info">
                    <span>NUTRIENTES SINTÉTICOS</span>
                    <span class="stat-trend trend-up">▲ +2/día</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill" id="fill-nutrients"></div>
                </div>
                <div style="text-align: right; font-size: 0.7rem;" id="val-nutrients">0 / 50 ítems</div>
            </div>

        </div>
    `

    main_view.appendChild(grafico_estadisticas)
    document.getElementById("btn-close").addEventListener("click", () => {
        grafico_estadisticas.remove()
        activar_botones()
    })

    function setRingProgress(elementId, percent, valueText, maxPercent = 100) {
        const wrapper = document.getElementById(elementId);
        const circle = wrapper.querySelector('.progress-ring-circle');
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;

        const safePercent = Math.min(Math.max(percent, 0), maxPercent);
        const offset = circumference - (safePercent / maxPercent) * circumference;

        circle.style.strokeDashoffset = offset;
        document.getElementById(`val-${elementId.split('-')[1]}`).innerText = valueText;

        // Cambiar a color de alerta si baja de ciertos umbrales
        wrapper.classList.remove('warning', 'critical');
        if (percent <= 20) wrapper.classList.add('critical');
        else if (percent <= 50) wrapper.classList.add('warning');
    }

    // Función para actualizar las barras horizontales
    function setBarProgress(elementId, current, max, trendText) {
        const row = document.getElementById(elementId);
        const fill = document.getElementById(`fill-${elementId.split('-')[1]}`);
        const textVal = document.getElementById(`val-${elementId.split('-')[1]}`);

        const percent = Math.min((current / max) * 100, 100);
        fill.style.width = `${percent}%`;
        textVal.innerText = `${current} / ${max} ítems`;

        // Cambiar a color de alerta si está por debajo del 30%
        row.classList.remove('warning');
        if (percent <= 30) row.classList.add('warning');
    }

    const response = await fetch("http://localhost:3000/recursos")
    const recursos = await response.json()

    setTimeout(() => {
        setRingProgress('ring-energy', recursos.cant_energia, `${recursos.cant_energia}%`);
        setRingProgress('ring-oxygen', recursos.cant_oxigeno, `${recursos.cant_oxigeno}%`);

        const aguaActual = recursos.cant_agua;
        const aguaMax = 150;
        const porcentajeAgua = (aguaActual / aguaMax) * 100;
        setRingProgress('ring-water', porcentajeAgua, `${aguaActual}L`);


        setBarProgress('bar-food', recursos.cant_comida, 75);
        setBarProgress('bar-nutrients', recursos.cant_nutrientes, 350);

    }, 100);
})