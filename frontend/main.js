const catalog_button = document.getElementById("button_catalog");
const main_view = document.getElementById("main_view");
const cant_comida = document.getElementById("cant_comida")
const cant_agua = document.getElementById("cant_agua")
const cant_energia = document.getElementById("cant_energia")
const cant_oxigeno = document.getElementById("cant_oxigeno")
const cant_nutrientes = document.getElementById("cant_nutrientes")
let btn_close;



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
            catalog_button.disabled = true; // Deshabilita el botón después de cargar el catálogo
            btn_close = document.getElementById("btn-close");
        })
        .catch((error) => console.error("Error al cargar el catálogo:", error));
});

btn_close?.addEventListener("click", () => {
    const catalogWindow = document.getElementById("catalogo-header");
    catalogWindow.style.display = "none";
});

//Manejo del contador de días
const boton_avanzar_dia = document.getElementById("button_advance_day")
const contador_dias = document.getElementById("contador_dias")
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
}
