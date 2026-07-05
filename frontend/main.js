const catalog_button = document.getElementById("button_catalog");
const main_view = document.getElementById("main_view");
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

boton_avanzar_dia.addEventListener("click", () => {
    contador_encendido = !contador_encendido
    if(!contador_encendido){
        boton_avanzar_dia.innerText = "AVANZAR CICLO DÍA"
        return
    } 
        boton_avanzar_dia.innerText = "DETENER CICLO DÍA"
    let timer = setInterval(() => {
        if (!contador_encendido) {
            contador_encendido = false
            clearInterval(timer)
            return
        }
        
        contador++;
        contador_dias.innerText = `DÍA: [ ${contador} ]`
    }, 1000)
})