const main_view = document.getElementById("main_view")


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


async function fetchAndUpdateResources() {
    const response = await fetch("http://localhost:3000/recursos")
    const recursos = await response.json()
}

setTimeout(async () => {
    await fetchAndUpdateResources();
    setRingProgress('ring-energy', recursos.cant_energia, `${recursos.cant_energia}%`);
    setRingProgress('ring-oxygen', recursos.cant_oxigeno, `${recursos.cant_oxigeno}%`);

    const aguaActual = recursos.cant_agua;
    const aguaMax = 150;
    const porcentajeAgua = (aguaActual / aguaMax) * 100;
    setRingProgress('ring-water', porcentajeAgua, `${aguaActual}L`);


    setBarProgress('bar-food', recursos.cant_comida, 75);
    setBarProgress('bar-nutrients', recursos.cant_nutrientes, 350);

}, 100);


