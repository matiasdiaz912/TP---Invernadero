
const main_view = document.getElementById("main_view")
const loss_nutrients = document.getElementById("loss-nutrients")
const loss_food = document.getElementById("loss-food")

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
    const response = await fetch("https://intro-camejor-despliegue-bd.onrender.com/recursos")
    const recursos = await response.json()
    return recursos
}

setTimeout(async () => {
    let recursos = await fetchAndUpdateResources();
    console.log(recursos);
    
    setRingProgress('ring-energy', recursos.cant_energia, `${recursos.cant_energia}W`, 150);
    setRingProgress('ring-oxygen', recursos.cant_oxigeno, `${recursos.cant_oxigeno}%`,);

    const aguaActual = recursos.cant_agua;
    const aguaMax = 200;
    const porcentajeAgua = (aguaActual / aguaMax) * 100;
    setRingProgress('ring-water', porcentajeAgua, `${aguaActual}L`, 200);


    setBarProgress('bar-food', recursos.cant_comida, 200);
    setBarProgress('bar-nutrients', recursos.cant_nutrientes, 150);
    loss_food.innerText = `-${recursos.comida_usada_por_dia}/d`

}, 100);


