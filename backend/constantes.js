export const RECURSOS_INICIALES = {
    cant_agua: 20,
    cant_oxigeno: 20,
    cant_energia: 10,
    cant_nutrientes: 20,
    cant_comida: 100,
}

export const CANT_AGUA = RECURSOS_INICIALES.cant_agua
export const CANT_OXIGENO = RECURSOS_INICIALES.cant_oxigeno
export const CANT_ENERGIA = RECURSOS_INICIALES.cant_energia
export const CANT_NUTRIENTES = RECURSOS_INICIALES.cant_nutrientes
export const CANT_COMIDA = RECURSOS_INICIALES.cant_comida

// Barras 0..100. agua/energia: >60 normal, 40-60 demora, <40 muere.
// nutrientes: >60 normal, 30-60 critico, <30 muere.
export const SALUD = {
    max: 100,
    danio_por_dia: 20,
    recuperacion_por_dia: 10,
    agua_normal: 60,
    agua_muere: 40,
    nutrientes_normal: 60,
    nutrientes_muere: 30,
    energia_normal: 60,
    energia_muere: 40,
}

export const MODULO = {
    // Sobreriego por capacidad (agua_max_por_bloque * bloques). El reglamento
    // decia "el doble de lo que piden por dia", pero con eso guardar reserva
    // era imposible: 5 lts ya ahogaban a un tomate.
    agua_max_por_bloque: 15,
    dias_criticos_para_desechar: 3,
    bloques_iniciales: 2,
}

export const COSECHAS_POR_NIVEL = [0, 0, 10, 30, 70, 140, 250]
export const ENTREGA_POR_NIVEL = { agua: 20, energia: 10, nutrientes: 15, bloques: 1 }

export const TRIPULANTES_INICIALES = 10
export const CONSUMO_TRIPULANTE = { comida: 0.5, agua: 0.2, oxigeno: 0.2 }
export const DIAS_SIN_COMER = { desnutrido: 3, critico: 5, muerte: 7 }

export const PROB_EVENTO_POR_DIA = 0.15
export const REGEN_NUTRIENTES_POR_DIA = 2
export const DIA_VICTORIA = 180

// "_requerida/o" = por dia, sale del modulo.
// "comida_por_dia" / "oxigeno_por_dia" = goteo diario a la base.
// "agua_cosecha" / "comida_cosecha" = golpe unico al cosechar.
export const ESPECIES = [
    {
        id: 1, nombre: "Rábano", tamanio: 1, nivel_requerido: 1, duracion: 3,
        agua_requerida: 0.5, oxigeno_requerido: 0.5, nutrientes_requeridos: 1, energia_requerida: 0.4,
        comida_por_dia: 1, oxigeno_por_dia: 1.5, agua_cosecha: 1.5, comida_cosecha: 2,
        pathSvg: '<circle cx="50" cy="60" r="16"/><path d="M50 44 V16 M40 22 Q50 27 60 22"/><path d="M50 76 V88"/>'
    },
    {
        id: 2, nombre: "Lechuga", tamanio: 1, nivel_requerido: 1, duracion: 3,
        agua_requerida: 2, oxigeno_requerido: 0.5, nutrientes_requeridos: 1, energia_requerida: 0.4,
        comida_por_dia: 0.5, oxigeno_por_dia: 2, agua_cosecha: 3, comida_cosecha: 2,
        pathSvg: '<path d="M50 80 Q30 60 40 30 Q50 10 60 30 Q70 60 50 80 Z"/><path d="M50 80 V30"/>'
    },
    {
        id: 3, nombre: "Tomate", tamanio: 1, nivel_requerido: 1, duracion: 5,
        agua_requerida: 2, oxigeno_requerido: 1, nutrientes_requeridos: 2, energia_requerida: 0.8,
        comida_por_dia: 1, oxigeno_por_dia: 2, agua_cosecha: 8, comida_cosecha: 5,
        pathSvg: '<circle cx="50" cy="40" r="15"/><path d="M50 25 V15 M40 15 Q50 20 60 15"/>'
    },
    {
        id: 4, nombre: "Papa", tamanio: 2, nivel_requerido: 3, duracion: 8,
        agua_requerida: 3, oxigeno_requerido: 1.5, nutrientes_requeridos: 3, energia_requerida: 1.2,
        comida_por_dia: 0, oxigeno_por_dia: 5, agua_cosecha: 15, comida_cosecha: 24,
        pathSvg: '<ellipse cx="50" cy="60" rx="25" ry="18"/><circle cx="40" cy="55" r="2"/><circle cx="60" cy="65" r="1.5"/><path d="M50 42 V20 M35 25 Q50 30 65 25"/>'
    },
    {
        id: 5, nombre: "Espirulina", tamanio: 1, nivel_requerido: 4, duracion: 2,
        agua_requerida: 4, oxigeno_requerido: 0.1, nutrientes_requeridos: 1, energia_requerida: 1.0,
        comida_por_dia: 4, oxigeno_por_dia: 10, agua_cosecha: 4, comida_cosecha: 4,
        pathSvg: '<rect x="25" y="20" width="50" height="60" rx="5"/><path d="M25 40 Q50 50 75 40 M25 60 Q50 70 75 60" stroke-dasharray="2 2"/>'
    },
    {
        id: 6, nombre: "Soja", tamanio: 3, nivel_requerido: 5, duracion: 12,
        agua_requerida: 3, oxigeno_requerido: 2.5, nutrientes_requeridos: 4, energia_requerida: 1.6,
        comida_por_dia: 1, oxigeno_por_dia: 8, agua_cosecha: 25, comida_cosecha: 30,
        pathSvg: '<ellipse cx="50" cy="55" rx="22" ry="12"/><circle cx="40" cy="55" r="4"/><circle cx="52" cy="55" r="4"/><circle cx="64" cy="55" r="4"/><path d="M50 43 V20 M38 28 Q50 33 62 28"/>'
    },
]
