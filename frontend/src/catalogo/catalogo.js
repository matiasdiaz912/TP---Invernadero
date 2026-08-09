const catalog_grid = document.getElementById("catalog-grid")
const main_view = document.getElementById("main_view")
const catalog_page = document.getElementById("catalog-page")


fetch("http://localhost:3000/especies")
        .then((res) => res.json())
        .then( async (data) => {
            const response = await fetch("http://localhost:3000/estado-juego")
            const estado_juego = await response.json()
            let nivel = estado_juego.nivel
            
            let info = cargarCatalogo(data, nivel)
        })
        .catch((error) => console.error("Error al cargar el catálogo:", error));


const cargarCatalogo = (especies, nivel) => {
    especies.forEach((especie) => {
        const bloqueado = especie.nivel_requerido > nivel;
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
                `;``

        catalog_grid.appendChild(card_especie);
        card_especie.addEventListener("click", () => {
            main_view.remove()
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

                <button id="sembrar-button" class="btn-action ${statusClass}">SEMBRAR</button>
            `;

         if (bloqueado) {
                card_descripcion.classList.add("plant-card-descripcion-desactivada")
            }
        catalog_page.appendChild(card_descripcion);

        const btn_back = document.getElementById("btn-back")
        btn_back.addEventListener("click", () => {
            card_descripcion.remove()
            catalog_page.appendChild(main_view)
        })
    })

})}