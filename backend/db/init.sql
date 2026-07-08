CREATE TABLE base_espacial (
    id               SERIAL PRIMARY KEY,
    dia_actual       INT DEFAULT 1,
    nivel            INT DEFAULT 1,
    agua             DECIMAL(8,2) DEFAULT 20,
    nutrientes       INT DEFAULT 20,
    energia          DECIMAL(5,2) DEFAULT 10,
    comida           INT DEFAULT 100,
    total_cosechas   INT DEFAULT 0,
    estado           VARCHAR(20) DEFAULT 'en_curso'
                     CHECK (estado IN ('en_curso', 'victoria', 'derrota'))
);

CREATE TABLE tripulantes (
    id               SERIAL PRIMARY KEY,
    cantidad         INT DEFAULT 10,
    estado           VARCHAR(20) DEFAULT 'sano'
                     CHECK (estado IN ('sano', 'desnutrido', 'critico')),
    dias_sin_comer   INT DEFAULT 0
);

CREATE TABLE especies (
    id                          SERIAL PRIMARY KEY,
    nombre                      VARCHAR(100) NOT NULL,
    bloques_requeridos          INT NOT NULL,
    agua_por_dia                DECIMAL(5,2) NOT NULL,
    nutrientes_por_dia          DECIMAL(5,2) NOT NULL,
    energia_por_dia             DECIMAL(5,2) NOT NULL,
    comida_por_dia              DECIMAL(5,2) NOT NULL,
    agua_producida_por_cosecha  DECIMAL(5,2) NOT NULL,
    dias_hasta_cosecha          INT NOT NULL,
    nivel_requerido             INT NOT NULL,
    descripcion                 TEXT
);

CREATE TABLE modulos (
    id               SERIAL PRIMARY KEY,
    nivel            INT DEFAULT 1,
    estado           VARCHAR(20) DEFAULT 'estable'
                     CHECK (estado IN ('estable', 'critico', 'sobreriego', 'desechado')),
    bloques_totales  INT DEFAULT 2,
    bloques_ocupados INT DEFAULT 0,
    agua             DECIMAL(8,2) DEFAULT 0,
    nutrientes       DECIMAL(8,2) DEFAULT 0,
    energia          DECIMAL(8,2) DEFAULT 0
);

CREATE TABLE plantas (
    id                    SERIAL PRIMARY KEY,
    modulo_id             INT NOT NULL REFERENCES modulos(id),
    especie_id            INT NOT NULL REFERENCES especies(id),
    dia_sembrado          INT NOT NULL,
    dia_cosecha           INT NOT NULL,
    estado                VARCHAR(30) DEFAULT 'creciendo'
                          CHECK (estado IN ('creciendo', 'lista_para_cosechar', 'seca', 'perdida')),
    porcentaje_agua       DECIMAL(5,2) DEFAULT 100,
    porcentaje_nutrientes DECIMAL(5,2) DEFAULT 100
);