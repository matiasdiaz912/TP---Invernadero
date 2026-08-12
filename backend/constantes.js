export const RECURSOS_INICIALES = {
    cant_agua: 150,
    cant_oxigeno: 80,
    cant_energia: 120,
    cant_nutrientes: 100,
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

export const PLANTA = {
    lista_para_cosechar_consume: true,
    desechado_se_reusa: true
}

export const COSECHAS_POR_NIVEL = [0, 0, 10, 30, 70, 140, 250]
export const ENTREGA_POR_NIVEL = { agua: 20, energia: 10, nutrientes: 15, bloques: 1 }

export const TRIPULANTES_INICIALES = 30
export const CONSUMO_TRIPULANTE = { comida: 0.5, agua: 0.2, oxigeno: 0.2 }
export const DIAS_SIN_COMER = { desnutrido: 3, critico: 5, muerte: 7 }

export const PROB_EVENTO_POR_DIA = 0.15
export const REGEN_NUTRIENTES_POR_DIA = 2
export const DIA_VICTORIA = 180

export const AGUA_MAX = 200
export const OXIGENO_MAX = 100
export const ENERGIA_MAX = 150
export const NUTRIENTES_MAX = 150
export const COMIDA_MAX = 200


