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
    id                    SERIAL PRIMARY KEY,
    nombre                VARCHAR(100) NOT NULL,
    tamanio               INT NOT NULL,
    agua_requerida        DECIMAL(5,2) NOT NULL,
    oxigeno_requerido     DECIMAL(5,2) NOT NULL,
    nutrientes_requeridos DECIMAL(5,2) NOT NULL,
    nutrientes_generados  DECIMAL(5,2) NOT NULL,
    duracion              INT NOT NULL,
    agua_producida        DECIMAL(5,2) NOT NULL,
    nivel_requerido       INT NOT NULL,
    estado                VARCHAR(20) DEFAULT 'inicial',
    path_svg              TEXT,
    descripcion           TEXT
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

CREATE TABLE registros_dia (
    id                    SERIAL PRIMARY KEY,
    dia                   INT NOT NULL,
    comida_inicio         INT NOT NULL,
    comida_fin            INT NOT NULL,
    agua_consumida        DECIMAL(8,2),
    nutrientes_consumidos DECIMAL(8,2),
    evento_random         TEXT
);

INSERT INTO base_espacial (dia_actual, nivel, agua, nutrientes, energia, comida, total_cosechas, estado)
VALUES (1, 1, 20, 20, 10, 100, 0, 'en_curso');

INSERT INTO tripulantes (cantidad, estado, dias_sin_comer)
VALUES (10, 'sano', 0);

INSERT INTO modulos (nivel, estado, bloques_totales, bloques_ocupados, agua, nutrientes, energia)
VALUES (1, 'estable', 2, 0, 0, 0, 0);

INSERT INTO especies (nombre, bloques_requeridos, agua_por_dia, nutrientes_por_dia, energia_por_dia, comida_por_dia, agua_producida_por_cosecha, dias_hasta_cosecha, nivel_requerido, descripcion)
VALUES
('Tomate',     1, 2.0, 2.0, 1.0, 1.0, 8.0,  5,  1, 'Planta resistente y versátil. Buena fuente de alimento con ciclo de cosecha medio.'),
('Lechuga',    1, 1.0, 1.0, 0.5, 0.5, 3.0,  3,  1, 'Crece rápido y produce oxígeno. Ideal para los primeros días de la colonia.'),
('Rábano',     1, 0.5, 1.0, 0.5, 1.0, 1.5,  3,  1, 'El más económico en recursos. Perfecto para cuando los suministros escasean.'),
('Papa',       2, 3.0, 3.0, 1.5, 0.0, 15.0, 8,  3, 'Requiere espacio y paciencia, pero su cosecha es la más abundante en')

CREATE TABLE eventos (
    id                  VARCHAR(50) PRIMARY KEY,
    nombre              VARCHAR(100) NOT NULL,
    descripcion         TEXT NOT NULL,
    tipo                VARCHAR(20) NOT NULL
                        CHECK (tipo IN ('positivo', 'negativo')),
    efecto_energia      INT DEFAULT 0,
    efecto_oxigeno      INT DEFAULT 0,
    efecto_agua         INT DEFAULT 0,
    efecto_nutrientes   INT DEFAULT 0
);