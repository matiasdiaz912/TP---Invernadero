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


const cargarCatalogo = (plantas, nivel) => {
    plantas.forEach((planta) => {
        const bloqueado = planta.nivel_requerido > nivel;
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
                                ${planta.pathsvg}
                            </svg>
                        </div>
                        
                        <div class="plant-info">
                            <h3 class="plant-name" ${bloqueado ? 'style="color: #f97316;"' : ""}>${planta.nombre}</h3>
                            <div class="plant-stats">
                                H2O: ${planta.agua_requerida} | O2: ${planta.oxigeno_requerido}
                            </div>
                        </div>
                `;``

        catalog_grid.appendChild(card_planta);
        card_planta.addEventListener("click", () => {
            main_view.remove()
            let card_descripcion = document.createElement("div")
            card_descripcion.classList.add("planta-descripcion")
            card_descripcion.innerHTML = `
                <div class="catalog-header header-planta">
                        <h2> > DETALLES SEMILLA</h2>
                    <div>
                        <button id="btn-back" class="btn-action ${statusClass}">[ VOLVER ]</button>
                    </div>
            
                </div>
                <div class="plant-card-descripcion">
                    <div class="plant-image-container">
                        <svg viewBox="0 0 100 100" class="plant-svg" ${colorSvg}>
                            ${planta.pathsvg}
                        </svg>
                    </div>
                    <div class="descripcion_planta">
                        <h3>${planta.nombre}</h3>
                        <h4>AGUA: ${planta.agua_requerida}</h4>
                        <h4>OXIGENO: ${planta.oxigeno_requerido}</h4>
                    </div>
                </div>
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