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
const button_help = document.getElementById("button-help")
const button_eventos = document.getElementById("button-eventos")

let contador = 0
let contador_encendido = false

fetch("http://localhost:3000/recursos")
    .then((response) => response.json())
    .then((data) => generar_nuevos_datos(data))

function activar_botones() {
    crear_modulo_button.disabled = false
    module_manage_button.disabled = false
    boton_avanzar_dia.disabled = false
    button_help.disabled = false
    button_eventos.disabled = false
}

function desactivar_botones() {
    crear_modulo_button.disabled = true
    module_manage_button.disabled = true
    boton_avanzar_dia.disabled = true
    button_help.disabled = true
    button_eventos.disabled = true
}

const reiniciarJuego = async () => {
    activar_botones()
    const response = await fetch("http://localhost:3000/reiniciar")
    let data = await response.json()
    return data
}

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

        await fetch("http://localhost:3000/avanzar-dia")
        const response = await fetch("http://localhost:3000/recursos-actualizados")
        const data = await response.json()        


        if (data.estado_base.cant_agua < 50 || data.estado_base.cant_comida < 60 || data.estado_base.cant_oxigeno == 0) {
            main_view.classList.add("resources-danger")
            setTimeout(() => {
                main_view.classList.remove("resources-danger")
            }, 500)
            if(data.estado_base.cant_oxigeno == 0){
                generar_logs(`DIA ${data.estado_base.dia_actual}: ALERTA! Recursos críticos. Oxígeno: ${data.estado_base.cant_oxigeno}%`, "alerta")
            }
            if(data.estado_base.cant_agua < 50){
                generar_logs(`DIA ${data.estado_base.dia_actual}: ALERTA! Recursos críticos. Agua: ${data.estado_base.cant_agua}L`, "alerta")
            }

            if(data.estado_base.cant_comida < 60){
                generar_logs(`DIA ${data.estado_base.dia_actual}: ALERTA! Recursos críticos. Comida: ${data.estado_base.cant_comida}kg`, "alerta")
            }
        }

        if(data.estado_base.cant_energia <= 30 && data.estado_base.cant_energia % 10 == 0){
            
        }

        if (data.estado_base.dia_actual == 1) {
            generar_logs("SISTEMA INICIADO... [OK]", "info")
        }

        if (data.estado_base.dia_actual % 10 == 0 && data.estado_base.dia_actual != 0) {
            await generar_evento()
        }

        if (data.eventos.length != 0) {
            data.eventos.forEach((evento) => {
                if (evento.tipo == "alerta") generar_logs(`DIA ${data.estado_base.dia_actual}: ALERTA! ${evento.mensaje}`, "alerta")
                else generar_logs(`DIA ${data.estado_base.dia_actual}: ALERTA! ${evento.mensaje}`, "info")
            })
        }

        data.plantas.forEach((planta) => {
            if (planta.estado == "perdida") {
                let modulo = data.modulos.find((mod) => mod.id == planta.modulo_id)
                generar_logs(`DIA ${data.estado_base.dia_actual}: ALERTA! La planta "${planta.nombre}" del modulo "${modulo.nombre}" ha sido ${planta.estado}`, "alerta")
            }else if(planta.estado == "lista"){
                let modulo = data.modulos.find((mod) => mod.id == planta.modulo_id)
                generar_logs(`DIA ${data.estado_base.dia_actual}: INFO! La planta "${planta.nombre}" del modulo "${modulo.nombre}" está lista para cosechar`, "info")
            }
        })


        if (data.estado_base.estado == "victoria") {
            const video_final = document.createElement("div")
            video_final.classList.add("video-final-container")
            video_final.innerHTML = `
                <video width="100%" height="100%" id="video_final" autoplay muted class="video-final">
                    <source src="final_victoria.mp4" type="video/mp4">
                </video>
            `
            desactivar_botones()
            contador_encendido = false
            const banner_victoria = document.createElement("div")
            banner_victoria.classList.add("banner-juego-finalizado")
            banner_victoria.innerHTML = `
                <h1>FELICIDADES, LOGRASTE SALVAR A LA CIVILIZACION</h1>
                <button id="btn-reiniciar" class="btn-action">JUGAR DE NUEVO</button>
            `

            document.querySelector("body").appendChild(video_final)
            const video_final_ganador = document.getElementById("video_final")
            video_final_ganador.addEventListener("ended", () => {
                video_final.remove()
                main_view.appendChild(banner_victoria)

                let btn_reiniciar = document.getElementById("btn-reiniciar")
                btn_reiniciar.addEventListener("click", async () => {
                const datos_iniciales = await reiniciarJuego()
                document.querySelector("footer").textContent = ""
                banner_victoria.remove()
                activar_botones()
                generar_nuevos_datos(datos_iniciales)
                boton_avanzar_dia.innerText = "AVANZAR CICLO DÍA"
            })
            })

        } else if (data.estado_base.estado == "derrota") {
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
                document.querySelector("footer").textContent = ""
                banner_derrota.remove()
                activar_botones()
                generar_nuevos_datos(datos_iniciales)
                boton_avanzar_dia.innerText = "AVANZAR CICLO DÍA"
            })

        }else{
            generar_nuevos_datos(data.estado_base)
        }

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
    if(data.cant_agua < 0){
        cant_agua.innerHTML = `<span>0L   </span>`
    }else{
        cant_agua.innerHTML = `<span>${data.cant_agua}L   </span>`
    }

    if(data.cant_comida < 0){
        cant_comida.innerHTML = `<span>0kg   </span>`
    }else{
        cant_comida.innerHTML = `<span>${data.cant_comida}kg   </span>`
    }

    if(data.cant_energia < 0){
        cant_energia.innerHTML = `<span>0W   </span>`
    }else{
        cant_energia.innerHTML = `<span>${data.cant_energia}W   </span>`
    }

    if(data.cant_nutrientes < 0){
        cant_nutrientes.innerHTML = `<span>0U   </span>`
    }else{
        cant_nutrientes.innerHTML = `<span>${data.cant_nutrientes}U   </span>`
    }

    if(data.cant_oxigeno < 0){
        cant_oxigeno.innerHTML = `<span>0%   </span>`
    }else{
        cant_oxigeno.innerHTML = `<span>${data.cant_oxigeno}%   </span>`
    }
    
    if(data.agua_usada_por_dia && data.comida_usada_por_dia && data.energia_usada_por_dia && data.oxigeno_usado_por_dia){
        cant_agua.innerHTML += ` <span class="recursos-usados">[ - ${data.agua_usada_por_dia}L/día ]</span>`
        cant_comida.innerHTML += ` <span class="recursos-usados">[ - ${data.comida_usada_por_dia}kg/día ]</span>`
        cant_energia.innerHTML += ` <span class="recursos-usados">[ - ${data.energia_usada_por_dia}W/día ]</span>`
        cant_nutrientes.innerHTML += `<span class="recursos-usados">[ - ${data.nutrientes_usados_por_dia}U/día ]</span>`
        cant_oxigeno.innerHTML += `<span class="recursos-usados">[ - ${data.oxigeno_usado_por_dia}%/día ]</span>`
    }
    contador_dias.innerText = `DÍA: [ ${data.dia_actual} ]`
    cant_tripulantes.innerText = `TRIPULACIÓN: [ ${data.tripulantes}/30 ]`
    contador = data.dia_actual
    contador_dias.innerText = `DÍA: [ ${data.dia_actual} ]`
    renderizarModulos()
    contador_nivel.textContent = `NIVEL: [ ${data.nivel} ]`
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
                <p>${recursos.cant_agua}</p><span>L</span>
            </label>
            <label>Cantidad de oxígeno suministrado:
                <input value="${recursos.cant_oxigeno}" id="input_oxigeno" type="range" min="0" max="${recursos.cant_oxigeno}"></input>
                <p>${recursos.cant_oxigeno}</p><span>%</span>
            </label>
            <label>Cantidad de energía suministrada:
                <input value="${recursos.cant_energia}" id="input_energia" type="range" min="0" max="${recursos.cant_energia}"></input>
                <p>${recursos.cant_energia}</p><span>W</span>
            </label>
            <label>Cantidad de nutrientes suministrados:
                <input value="${recursos.cant_nutrientes}" id="input_nutrientes" type="range" min="0" max="${recursos.cant_nutrientes}"></input>
                <p>${recursos.cant_nutrientes}</p><span>U</span>
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
            let recursos = await fetch(`http://localhost:3000/recursos`)
            recursos = await recursos.json()
            generar_nuevos_datos(recursos)
        } else {
            generar_logs("No puedes crear un modulo nuevo hasta que subas de nivel", "alerta")
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
    const [modulosRes, plantasRes, moduloPlantasRes] = await Promise.all([
        fetch(`http://localhost:3000/modulos/${modulo_id}`),
        fetch("http://localhost:3000/especies"),
        fetch(`http://localhost:3000/plantas/${modulo_id}`)
    ])

    const modulo = await modulosRes.json()
    const moduloPlantas = await moduloPlantasRes.json()
    const catalogo = await plantasRes.json()
    

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
            <p><strong>Nombre:</strong> ${modulo.nombre}</p>
            <p><strong>Agua:</strong> ${modulo.cant_agua}L</p>
            <p><strong>Oxígeno:</strong> ${modulo.cant_oxigeno}%</p>
            <p><strong>Energía:</strong> ${modulo.cant_energia}W</p>
            <p><strong>Nutrientes:</strong> ${modulo.cant_nutrientes}U</p>
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
            <button id="btn-renombrar-modulo" class="btn-action">RENOMBRAR MODULO</button>
        </div>
    `

    main_view.appendChild(modulo_detalles)

    const lista_plantas = document.getElementById("lista-plantas-modulo")
    if (moduloPlantas.length === 0) {
        lista_plantas.innerHTML = "<li>Todavía no hay plantas sembradas</li>"
    } else {
        moduloPlantas.forEach((planta) => {
            const planta_sembrada = document.createElement("div")
            planta_sembrada.classList.add("lista-plantas-modulo")
            planta_sembrada.innerHTML = `<li>${planta.nombre} — ${planta.estado} (día ${planta.dias_transcurridos}/${planta.duracion})</li>`
            if (planta.dias_transcurridos >= planta.duracion) {
                const btn_cosechar = document.createElement("button")
                btn_cosechar.innerHTML = "[ COSECHAR }"
                btn_cosechar.classList.add("btn-action")
                planta_sembrada.appendChild(btn_cosechar)

                btn_cosechar.addEventListener("click", async () => {
                    planta_sembrada.remove()
                    let plantaActual = await fetch(`http://localhost:3000/plantas`, {
                        method: "PUT",
                        body: JSON.stringify(planta),
                        headers: { "Content-Type": "application/json" }
                    })
                    
                    let res = await fetch(`http://localhost:3000/plantas`, {
                        method: "DELETE",
                        body: JSON.stringify(planta),
                        headers: { "Content-Type": "application/json" }
                    })
                    res = await res.json()

                    contador_nivel.textContent = `NIVEL: [ ${res.nivel} ]`
                    generar_nuevos_datos(res.recursos)
                    
                    let moduloPlantasActualizado = await fetch(`http://localhost:3000/plantas/${modulo_id}`)
                    moduloPlantasActualizado = await moduloPlantasActualizado.json()
                    if (moduloPlantasActualizado.length === 0) {
                        lista_plantas.innerHTML = "<li>Todavía no hay plantas sembradas</li>"
                    }

                    generar_logs(`Planta ${planta.nombre} cosechada en "${modulo.nombre}"`, "info")
                })
            }else if (planta.estado == "perdida"){
                const btn_desechar = document.createElement("button")
                btn_desechar.innerHTML = "[ DESECHAR }"
                btn_desechar.classList.add("btn-action")
                planta_sembrada.appendChild(btn_desechar)

                btn_desechar.addEventListener("click", async () =>{
                    planta_sembrada.remove()
                    await fetch(`http://localhost:3000/plantas`, {
                        method: "DELETE",
                        body: JSON.stringify(planta),
                        headers: { "Content-Type": "application/json" }
                    })

                    let moduloPlantasActualizado = await fetch(`http://localhost:3000/plantas/${modulo_id}`)
                    moduloPlantasActualizado = await moduloPlantasActualizado.json()
                    if (moduloPlantasActualizado.length === 0) {
                        lista_plantas.innerHTML = "<li>Todavía no hay plantas sembradas</li>"
                    }
                    generar_logs(`Planta ${planta.nombre} desechada en "${modulo.nombre}"`, "alerta")

                })
            }
            lista_plantas.appendChild(planta_sembrada)
        })
    }
    
    let btn_gestionar = document.getElementById("btn-gestionar")
    
    btn_gestionar.addEventListener("click", async () => {
    modulo_detalles.remove()
    let gestionar_recursos = document.createElement("div")
    gestionar_recursos.classList.add("catalog-window")
    const recursos = await obtener_recursos()
    gestionar_recursos.innerHTML = `
        <div class="catalog-header">
            <h2>> GESTIONAR RECURSOS</h2>
            <div>
                <button id="btn-back-gestionar" class="btn-action">[ VOLVER ATRAS ]</button>
                <button id="btn-close-gestionar" class="btn-action">[ CERRAR ]</button>
            </div>
        </div>
        <form class="gestionar-recursos" id="gestionar-recursos-form">
            <label>Cantidad de agua:
                <input value="0" id="input_water" type="range" min="${-modulo.cant_agua}" max="${recursos.cant_agua}"></input>
                <p id="p_water">${recursos.cant_agua}</p>
            </label>
            <label>Cantidad de oxígeno:
                <input value="0" id="input_oxygen" type="range" min="${-modulo.cant_oxigeno}" max="${recursos.cant_oxigeno}"></input>
                <p id="p_oxygen">${recursos.cant_oxigeno}</p>
            </label>
            <label>Cantidad de energía:
                <input value="0" id="input_energy" type="range" min="${-modulo.cant_energia}" max="${recursos.cant_energia}"></input>
                <p id="p_energy">${recursos.cant_energia}</p>
            </label>
            <label>Cantidad de nutrientes:
                <input value="0" id="input_nutrients" type="range" min="${-modulo.cant_nutrientes}" max="${recursos.cant_nutrientes}"></input>
                <p id="p_nutrients">${recursos.cant_nutrientes}</p>
            </label>
            <button id="btn-confirmar-recursos" class="btn-action">CONFIRMAR</button>
        </form>
    `
    main_view.appendChild(gestionar_recursos)

    document.getElementById("p_water").textContent = document.getElementById("input_water").value
    document.getElementById("p_oxygen").textContent = document.getElementById("input_oxygen").value
    document.getElementById("p_energy").textContent = document.getElementById("input_energy").value
    document.getElementById("p_nutrients").textContent = document.getElementById("input_nutrients").value
    
    document.getElementById("btn-close-gestionar").addEventListener("click", () => {
        gestionar_recursos.remove()
        activar_botones()
    })

    document.getElementById("btn-back-gestionar").addEventListener("click", () => {
        gestionar_recursos.remove()
        main_view.appendChild(modulo_detalles)
    })

    document.getElementById("gestionar-recursos-form").querySelectorAll("input[type='range']").forEach((input) => {
        input.addEventListener("input", (event) => {
            const value = event.target.value;
            const pElement = event.target.nextElementSibling;
            pElement.textContent = value;
        })
    })

    document.getElementById("btn-confirmar-recursos").addEventListener("click", async (e) => {
        e.preventDefault();
        const agua = parseInt(document.getElementById("input_water").value) || 0
        const nutrientes = parseInt(document.getElementById("input_nutrients").value) || 0
        const energia = parseInt(document.getElementById("input_energy").value) || 0
        const oxigeno = parseInt(document.getElementById("input_oxygen").value) || 0

        const response = await fetch(`http://localhost:3000/modulos/${modulo.id}/recursos`, {
            method: "PUT",
            body: JSON.stringify({ agua, nutrientes, energia, oxigeno }),
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
        let recursos = await fetch(`http://localhost:3000/recursos`)
        recursos = await recursos.json()
        generar_nuevos_datos(recursos)
    })
})     
    let btn_sembrar = document.getElementById("btn-sembrar")
    btn_sembrar.addEventListener("click", async () => {
        modulo_detalles.remove()
        desactivar_botones()
        const response = await fetch("http://localhost:3000/estado-juego")
        const estado_juego = await response.json()
        let nivel = estado_juego.nivel

        const catalog = document.createElement("div");
        catalog.classList.add("catalog-window");
        catalog.id = "catalogo-header";
        catalog.innerHTML = `
                    <div class="catalog-header">
                        <h2>> CATÁLOGO DE SEMILLAS</h2>
                        <div>
                            <button id="btn-back-catalog" class="btn-action">[ VOLVER ATRAS ]</button>
                            <button id="btn-close-catalog" class="btn-action">[ CERRAR ]</button>
                        </div>
                    </div>
            
                    <div class="plant-grid" id="catalog-grid">

                    </div>`;

        main_view.appendChild(catalog);
        const nivelActual = nivel;
        const catalogGrid = document.getElementById("catalog-grid");
        let btn_close_catalog = document.getElementById("btn-close-catalog")
        btn_close_catalog.addEventListener("click", () => {
            catalog.remove();
            activar_botones();
        })

        let btn_back_catalog = document.getElementById("btn-back-catalog")
        btn_back_catalog.addEventListener("click", () =>{
            catalog.remove();
            main_view.appendChild(modulo_detalles)
            activar_botones();
        })


        catalogo.forEach((especie) => {
            const bloqueado = especie.nivel_requerido > nivelActual;
            const statusClass = bloqueado ? "locked" : "";
            const colorSvg = bloqueado
                ? 'stroke="#f97316" filter="none" opacity="0.4"'
                : "";

            let card_especie = document.createElement("div")
            card_especie.classList.add("plant-card");
            card_especie.style.borderColor = bloqueado ? "#f97316" : "";
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
                    `;
            catalogGrid.appendChild(card_especie);
            card_especie.addEventListener("click", () => {
                if (bloqueado) {
                    generar_logs(`Necesitás nivel ${especie.nivel_requerido} para sembrar ${especie.nombre}`, "alerta")
                    return
                }

                catalog.remove()
                let card_descripcion = document.createElement("div")
                card_descripcion.classList.add("catalog-window");
                card_descripcion.innerHTML = `
                    <div class="catalog-header">
                            <h2>> DETALLES SEMILLA</h2>
                        <div>
                            <button id="btn-back" class="btn-action ${statusClass}">[ VOLVER ATRAS ]</button>
                        </div>
                
                    </div>
                    <div class="plant-card-descripcion">
                        <div class="plant-image-container plant-image">
                            <svg viewBox="0 0 100 100" class="plant-svg" ${colorSvg}>
                                ${especie.pathsvg}
                            </svg>
                            <div>
                                <h3>${especie.nombre}</h3>
                            </div>
                        </div>
                        
                        <div class="descripcion_planta">
                            <h3 class="parrafo-detalles">REQUISITOS</h3>
                            <h4>AGUA: ${especie.agua_requerida}L / d</h4>
                            <h4>OXIGENO: ${especie.oxigeno_requerido}% / d</h4>
                            <h4>NUTRIENTES: ${especie.nutrientes_requeridos}U / d</h4>
                            <h4>ENERGIA: ${especie.energia_requerida}W / d</h4>
                        </div>
                        <div class="descripcion_planta">
                            <h3 class="parrafo-detalles">BENEFICIOS</h3>
                            <h4>AGUA: ${especie.agua_generada}L</h4>
                            <h4>OXIGENO: ${especie.oxigeno_generado}%</h4>
                            <h4>NUTRIENTES: ${especie.nutrientes_generados}U</h4>
                            <h4>ENERGIA: ${especie.comida_generada}W</h4>
                        </div>
                        <div class="descripcion_planta">
                            <p>Tiempo de sembrado: ${especie.duracion} días</p>
                            <p>Tamaño: ${especie.tamanio}</p>
                        </div>
                    </div>
                    
                    <p>${especie.descripcion}</p>

                    <button id="sembrar-button" class="btn-action ${statusClass}">SEMBRAR</button>
                `;

                
                if (bloqueado) {
                    card_descripcion.classList.add("plant-card-descripcion-desactivada")
                }
                main_view.appendChild(card_descripcion);

                let btn_back = document.getElementById("btn-back")

                btn_back.addEventListener("click", () => {
                    card_descripcion.remove();
                    main_view.appendChild(catalog)
                })

                let btn_sembrar = document.getElementById("sembrar-button")
                btn_sembrar.addEventListener("click", async () => {
                    let response = await fetch(`http://localhost:3000/plantas/${especie.id}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(modulo)
                    })

                    if (response.ok) {
                        generar_logs(`Planta sembrada en "${modulo.nombre}"`, "info")
                        renderizarModulos()
                    } else {
                        let msg = await response.json()
                        generar_logs(msg.error, "alerta")
                    }
                })
            })
        })

        desactivar_botones();
        let btn_close = document.getElementById("btn-close-catalog");
        btn_close.addEventListener("click", () => {
            catalog.remove();
            activar_botones();
        });
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
    let btn_renombrar_modulo = document.getElementById("btn-renombrar-modulo")
btn_renombrar_modulo.addEventListener("click", () => {
    modulo_detalles.remove()
    let renombrar_window = document.createElement("div")
    renombrar_window.classList.add("catalog-window")
    renombrar_window.innerHTML = `
        <div class="catalog-header">
            <h2>> RENOMBRAR MÓDULO </h2>
            <div>
                <button id="btn-back-renombrar" class="btn-action">[ VOLVER ATRAS ]</button>
                <button id="btn-close-renombrar" class="btn-action">[ CERRAR ]</button>
            </div>
        </div>
        <div class="gestionar-recursos">
            <label>NOMBRE ACTUAL: ${modulo.nombre}</label>
            <input id="input-nombre-modulo" type="text" class="btn-action" placeholder="Nuevo nombre"/>
            <button id="btn-confirmar-nombre" class="btn-action">CONFIRMAR</button>
        </div>
    `
    main_view.appendChild(renombrar_window)

    document.getElementById("btn-close-renombrar").addEventListener("click", () => {
        renombrar_window.remove()
        activar_botones()
    })

    document.getElementById("btn-back-renombrar").addEventListener("click", () => {
        renombrar_window.remove()
        main_view.appendChild(modulo_detalles)
    })

    document.getElementById("btn-confirmar-nombre").addEventListener("click", async () => {
        const nombre = document.getElementById("input-nombre-modulo").value
        const response = await fetch(`http://localhost:3000/modulos/${modulo.id}/nombre`, {
            method: "PATCH",
            body: JSON.stringify({ nombre }),
            headers: { "Content-Type": "application/json" }
        })
        const data = await response.json()
        if (response.ok) {
            generar_logs(`Módulo renombrado a "${data.nombre}"`, "info")
        } else {
            generar_logs(data.error, "alerta")
        }
        renombrar_window.remove()
        activar_botones()
    })
})

    let btn_mejorar_modulo = document.getElementById("btn-mejorar-modulo")
    btn_mejorar_modulo.addEventListener("click", async () => {

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


button_eventos.addEventListener("click", async () => {
    desactivar_botones()
    const [eventosRes, estadoRes] = await Promise.all([
        fetch("http://localhost:3000/eventos"),
        fetch("http://localhost:3000/estado-juego")
    ])
    const eventos = await eventosRes.json()
    const estado = await estadoRes.json()

    let eventos_window = document.createElement("div")
    eventos_window.classList.add("catalog-window")
    eventos_window.style.overflowY = "auto"
    eventos_window.style.maxHeight = "80vh"
    eventos_window.innerHTML = `
        <div class="catalog-header">
            <h2>> CENTRO DE EVENTOS</h2>
            <button id="btn-close-eventos" class="btn-action">[ CERRAR ]</button>
        </div>
        <p>Eventos creados: ${estado.eventos_creados}/3 | Evento bloqueado: ${estado.evento_bloqueado_id ? estado.evento_bloqueado_id + ' (' + estado.dias_restantes_bloqueo + ' días)' : 'Ninguno'}</p>
        <button id="btn-crear-evento" class="btn-action">+ SINTETIZAR EVENTO</button>
        <div id="lista-eventos"></div>
    `
    main_view.appendChild(eventos_window)

    const lista = document.getElementById("lista-eventos")
    eventos.forEach(evento => {
        let card = document.createElement("div")
        card.classList.add("btn-action", "module-card")
        const bloqueado = estado.evento_bloqueado_id === evento.id
        card.innerHTML = `
            <p>${evento.nombre} ${bloqueado ? '🔒 BLOQUEADO' : ''}</p>
            <p>Tipo: ${evento.tipo}</p>
            <p>Efectos: Agua ${evento.efecto_agua} | Oxígeno ${evento.efecto_oxigeno} | Energía ${evento.efecto_energia} | Nutrientes ${evento.efecto_nutrientes}</p>
            <div style="display:flex; gap:8px; margin-top:8px">
                ${evento.tipo === 'negativo' && !estado.evento_bloqueado_id ? `<button class="btn-action btn-bloquear" data-id="${evento.id}">BLOQUEAR</button>` : ''}
                ${!evento.modificado && estado.evento_bloqueado_id !== evento.id ? `<button class="btn-action btn-modificar" data-id="${evento.id}">MODIFICAR</button>` : ''}
            </div>
        `
        lista.appendChild(card)
    })

    document.getElementById("btn-close-eventos").addEventListener("click", () => {
        eventos_window.remove()
        activar_botones()
    })

    document.getElementById("btn-crear-evento").addEventListener("click", () => {
        eventos_window.remove()
        let crear_window = document.createElement("div")
        crear_window.classList.add("catalog-window")
        crear_window.innerHTML = `
            <div class="catalog-header">
                <h2>> SINTETIZAR EVENTO</h2>
                <div style="display:flex; gap:8px;">
                <button id="btn-back-crear-evento" class="btn-action">[ VOLVER ATRAS ]</button>
                <button id="btn-close-crear-evento" class="btn-action">[ CERRAR ]</button>
            </div>
        </div>
            <p>Costo: la mitad de los efectos que definas</p>
            <div class="gestionar-recursos">
                <label>NOMBRE:</label>
                <input id="input-evento-nombre" type="text" class="btn-action" placeholder="Nombre del evento"/>
                <label>DESCRIPCIÓN:</label>
                <input id="input-evento-desc" type="text" class="btn-action" placeholder="Descripción"/>
                <label>EFECTO AGUA:</label>
                <input id="input-evento-agua" type="number" min="0" onkeydown="return false" class="btn-action" placeholder="0"/>
                <label>EFECTO OXÍGENO:</label>
                <input id="input-evento-oxigeno" type="number" min="0" onkeydown="return false" class="btn-action" placeholder="0"/>
                <label>EFECTO ENERGÍA:</label>
                <input id="input-evento-energia" type="number" min="0" onkeydown="return false" class="btn-action" placeholder="0"/>
                <label>EFECTO NUTRIENTES:</label>
                <input id="input-evento-nutrientes" type="number" min="0" onkeydown="return false" class="btn-action" placeholder="0"/>
                <button id="btn-confirmar-evento" class="btn-action">SINTETIZAR</button>
            </div>
        `
        main_view.appendChild(crear_window)
        document.getElementById("btn-back-crear-evento").addEventListener("click", () => {
        crear_window.remove()
        activar_botones()
        button_eventos.click()
    })

        document.getElementById("btn-close-crear-evento").addEventListener("click", () => {
            crear_window.remove()
            activar_botones()
        })

        document.getElementById("btn-confirmar-evento").addEventListener("click", async () => {
            const body = {
                nombre: document.getElementById("input-evento-nombre").value,
                descripcion: document.getElementById("input-evento-desc").value,
                efecto_agua: parseFloat(document.getElementById("input-evento-agua").value) || 0,
                efecto_oxigeno: parseFloat(document.getElementById("input-evento-oxigeno").value) || 0,
                efecto_energia: parseFloat(document.getElementById("input-evento-energia").value) || 0,
                efecto_nutrientes: parseFloat(document.getElementById("input-evento-nutrientes").value) || 0,
            }
            const response = await fetch("http://localhost:3000/eventos", {
                method: "POST",
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" }
            })
            const data = await response.json()
            if (response.ok) {
                generar_logs(`Evento "${data.nombre}" sintetizado`, "info")
            } else {
                generar_logs(data.error, "alerta")
            }
            crear_window.remove()
            activar_botones()
        })
    })

    document.querySelectorAll(".btn-bloquear").forEach(btn => {
    btn.addEventListener("click", async () => {
        const evento = eventos.find(e => e.id === btn.dataset.id)
        const costo = Math.abs(evento.efecto_energia + evento.efecto_oxigeno + evento.efecto_agua + evento.efecto_nutrientes) * 0.3

        eventos_window.remove()
        let confirm_window = document.createElement("div")
        confirm_window.classList.add("catalog-window")
        confirm_window.innerHTML = `
            <div class="catalog-header">
                <h2>> BLOQUEAR EVENTO</h2>
                <button id="btn-close-confirm-bloquear" class="btn-action">[ CERRAR ]</button>
            </div>
            <p>Evento: ${evento.nombre}</p>
            <p>Costo: ${costo.toFixed(1)} de energía</p>
            <p>Duración del bloqueo: 15 días</p>
            <button id="btn-confirmar-bloquear" class="btn-action">CONFIRMAR BLOQUEO</button>
        `
        main_view.appendChild(confirm_window)

        document.getElementById("btn-close-confirm-bloquear").addEventListener("click", () => {
            confirm_window.remove()
            activar_botones()
        })

        document.getElementById("btn-confirmar-bloquear").addEventListener("click", async () => {
            const response = await fetch(`http://localhost:3000/eventos/${btn.dataset.id}/bloquear`, {
                method: "DELETE"
            })
            const data = await response.json()
            if (response.ok) {
                generar_logs(data.msg, "info")
            } else {
                generar_logs(data.error, "alerta")
            }
            confirm_window.remove()
            activar_botones()
        })
    })
})

    document.querySelectorAll(".btn-modificar").forEach(btn => {
        btn.addEventListener("click", async () => {
            eventos_window.remove()
            let mod_window = document.createElement("div")
            mod_window.classList.add("catalog-window")
            const evento = eventos.find(e => e.id === btn.dataset.id)
            mod_window.innerHTML = `
                <div class="catalog-header">
                    <h2>> MODIFICAR - ${evento.nombre}</h2>
                    <button id="btn-close-mod" class="btn-action">[ CERRAR ]</button>
                </div>
                <p>Costo: 20% de cada recurso que afecta este evento</p>
                <div class="gestionar-recursos">
                        ${evento.efecto_agua !== 0 ? `
                            <label>EFECTO AGUA (actual: ${evento.efecto_agua}):</label>
                            <input id="mod-agua" type="number" class="btn-action" value="${evento.efecto_agua}"/>
                        ` : ''}
                        ${evento.efecto_oxigeno !== 0 ? `
                            <label>EFECTO OXÍGENO (actual: ${evento.efecto_oxigeno}):</label>
                            <input id="mod-oxigeno" type="number" class="btn-action" value="${evento.efecto_oxigeno}"/>
                        ` : ''}
                        ${evento.efecto_energia !== 0 ? `
                            <label>EFECTO ENERGÍA (actual: ${evento.efecto_energia}):</label>
                            <input id="mod-energia" type="number" class="btn-action" value="${evento.efecto_energia}"/>
                        ` : ''}
                        ${evento.efecto_nutrientes !== 0 ? `
                            <label>EFECTO NUTRIENTES (actual: ${evento.efecto_nutrientes}):</label>
                            <input id="mod-nutrientes" type="number" class="btn-action" value="${evento.efecto_nutrientes}"/>
                        ` : ''}
                    <button id="btn-confirmar-mod" class="btn-action">CONFIRMAR</button>
                </div>
            `
            main_view.appendChild(mod_window)

            document.getElementById("btn-close-mod").addEventListener("click", () => {
                mod_window.remove()
                activar_botones()
            })

            document.getElementById("btn-confirmar-mod").addEventListener("click", async () => {
                const body = {
                    efecto_agua: document.getElementById("mod-agua") ? parseFloat(document.getElementById("mod-agua").value) || 0 : null,
                    efecto_oxigeno: document.getElementById("mod-oxigeno") ? parseFloat(document.getElementById("mod-oxigeno").value) || 0 : null,
                    efecto_energia: document.getElementById("mod-energia") ? parseFloat(document.getElementById("mod-energia").value) || 0 : null,
                    efecto_nutrientes: document.getElementById("mod-nutrientes") ? parseFloat(document.getElementById("mod-nutrientes").value) || 0 : null,
                }
                const response = await fetch(`http://localhost:3000/eventos/${evento.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(body),
                    headers: { "Content-Type": "application/json" }
                })
                const data = await response.json()
                if (response.ok) {
                    generar_logs(`Evento "${data.nombre}" modificado`, "info")
                } else {
                    generar_logs(data.error, "alerta")
                }
                mod_window.remove()
                activar_botones()
            })
        })
    })
})
// AYUDA

button_help.addEventListener("click", () => {
    desactivar_botones()
    let ayuda_window = document.createElement("div")
    ayuda_window.classList.add("catalog-window", "seccion-ayuda")
    ayuda_window.innerHTML = `
        <div class="catalog-header">
            <h2>> AYUDA</h2>
            <button id="btn-close-ayuda" class="btn-action">[ CERRAR ]</button>
        </div>
        <h3>CUANDO TERMINA EL JUEGO</h3>
        <p>El usuario ganara el juego cuando logre llegar al dia 180 con al menos un tripulante vivo</p>
        <h3>COMO GESTIONAR LOS RECURSOS</h3>
        <p>Los recursos se iran reduciendo a medida que el juego avanza, pero la clave esta en la gestion de recursos en los modulos.
            Si bien se pueden usar todos los recursos para alimentar un modulo, esto conllevaria a una escases de recursos para los tripulantes.
            Para lograr que la cantidad de tripulantes se mantenga estable es recomendable visualizar la seccion de estado de los recursos.
        </p>
    `
    main_view.appendChild(ayuda_window)

    document.getElementById("btn-close-ayuda").addEventListener("click", () => {
        ayuda_window.remove()
        activar_botones()
    })
})

const renderizarModulos = async () => {
    const [modulosRes, estadoRes] = await Promise.all([
        fetch("http://localhost:3000/modulos"),
        fetch("http://localhost:3000/estado-juego")
    ])
    const modulos = await modulosRes.json()
    const estado = await estadoRes.json()
    const maxModulos = 6

    let grilla = document.getElementById("grilla-modulos")
    if (!grilla) {
        grilla = document.createElement("div")
        grilla.id = "grilla-modulos"
        grilla.classList.add("grilla-modulos")
        main_view.appendChild(grilla)
    }
    grilla.innerHTML = ""

    for (let i = 0; i < maxModulos; i++) {
        const modulo = modulos[i]
        const slot = document.createElement("div")
        slot.classList.add("modulo-slot")

        if (!modulo) {
            const bloqueado = i >= estado.nivel
            slot.classList.add(bloqueado ? "modulo-bloqueado" : "modulo-vacio")
            slot.innerHTML = bloqueado ? `<p>🔒</p><p>NVL ${i + 1}</p>` : `<p>+ VACÍO</p>`
        } else {
            slot.classList.add(`modulo-${modulo.estado}`)
            const plantasRes = await fetch(`http://localhost:3000/plantas/${modulo.id}`)
            const plantas = await plantasRes.json()
            const bloquesVacios = modulo.bloques_totales - modulo.bloques_ocupados

            slot.innerHTML = `
                <div class="modulo-header">
                    <span class="modulo-nombre">${modulo.nombre.substring(0, 20)}</span>
                    <span class="modulo-nivel">NIVEL ${modulo.nivel}</span>
                </div>
                <div class="modulo-estado-badge">${modulo.estado.toUpperCase()}</div>
                <div class="modulo-plantas-grid">
                    ${plantas.map(p => `
                        <div class="planta-slot">
                            <svg viewBox="0 0 100 100" width="30" height="30">
                                ${p.pathsvg || ''}
                            </svg>
                            <span>${p.nombre}</span>
                        </div>
                    `).join('')}
                    ${Array(6 - plantas.length).fill(`
                        <div class="planta-slot-vacio">
                            <svg viewBox="0 0 40 30" width="34" height="26" stroke="rgba(45,212,191,0.3)" fill="none" stroke-width="1.2">
                                <rect x="2" y="2" width="36" height="5" rx="1"/>
                                <polygon points="5,7 35,7 32,28 8,28"/>
                            </svg>
                        </div>
                    `).join('')}
                </div>
            `
        }
        grilla.appendChild(slot)
    }
}