CREATE TABLE base_espacial (
    id               SERIAL PRIMARY KEY,
    dia_actual       INT DEFAULT 1,
    nivel            INT DEFAULT 1,
    cant_agua        DECIMAL(8,2) DEFAULT 20,
    cant_nutrientes  DECIMAL(8,2) DEFAULT 20,
    cant_energia     DECIMAL(5,2) DEFAULT 90,
    cant_oxigeno     DECIMAL(5,2) DEFAULT 100,
    cant_comida      DECIMAL(5,2) DEFAULT 100,
    total_cosechas   INT DEFAULT 0,
    estado           VARCHAR(20) DEFAULT 'en_curso'
                     CHECK (estado IN ('en_curso', 'victoria', 'derrota')),
    dias_comida_insuficiente INT DEFAULT 0,
    dias_agua_insuficiente   INT DEFAULT 0,
    dias_oxigeno_insuficiente INT DEFAULT 0,
    dias_usados_trajes INT DEFAULT 0,
    tripulantes INT DEFAULT 30
);

INSERT INTO base_espacial (dia_actual, nivel, cant_agua, cant_nutrientes, cant_energia, cant_oxigeno, cant_comida, total_cosechas, estado, tripulantes)
VALUES (1, 1, 20, 20, 10, 100, 100, 0, 'en_curso', 30);


-- Los nombres de estas columnas tienen que coincidir con los que lee dia.js:
--   *_requerida/o                    -> lo que la planta consume del modulo por dia
--   comida_por_dia / oxigeno_por_dia -> lo que le suma a la base cada dia
--   agua_cosecha / comida_cosecha    -> el golpe unico al cosechar
CREATE TABLE especies (
    id                    SERIAL PRIMARY KEY,
    nombre                VARCHAR(100) NOT NULL,
    tamanio               INT NOT NULL,
    nivel_requerido       INT NOT NULL,
    duracion              INT NOT NULL,
    agua_requerida        DECIMAL(5,2) NOT NULL,
    oxigeno_requerido     DECIMAL(5,2) NOT NULL,
    nutrientes_requeridos DECIMAL(5,2) NOT NULL,
    energia_requerida     DECIMAL(5,2) NOT NULL,
    comida_por_dia        DECIMAL(5,2) NOT NULL DEFAULT 0,
    oxigeno_por_dia       DECIMAL(5,2) NOT NULL DEFAULT 0,
    agua_cosecha          DECIMAL(5,2) NOT NULL DEFAULT 0,
    comida_cosecha        DECIMAL(5,2) NOT NULL DEFAULT 0,
    estado                VARCHAR(20) DEFAULT 'inicial',
    pathSvg               TEXT,
    descripcion           TEXT
);

INSERT INTO especies (nombre, tamanio, nivel_requerido, duracion, agua_requerida, oxigeno_requerido, nutrientes_requeridos, energia_requerida, comida_por_dia, oxigeno_por_dia, agua_cosecha, comida_cosecha, estado, pathSvg, descripcion)
VALUES
('Rábano',     1, 1, 3,  0.5, 0.5, 1, 0.4, 1,   1.5, 1.5, 2,  'inicial', '<circle cx="50" cy="60" r="16"/><path d="M50 44 V16 M40 22 Q50 27 60 22"/><path d="M50 76 V88"/>', 'El más económico en recursos. Perfecto para cuando los suministros escasean.'),
('Lechuga',    1, 1, 3,  2,   0.5, 1, 0.4, 0.5, 2,   3,   2,  'inicial', '<path d="M50 80 Q30 60 40 30 Q50 10 60 30 Q70 60 50 80 Z"/><path d="M50 80 V30"/>', 'Crece rápido y produce oxígeno. Ideal para los primeros días de la colonia.'),
('Tomate',     1, 1, 5,  2,   1,   2, 0.8, 1,   2,   8,   5,  'inicial', '<circle cx="50" cy="40" r="15"/><path d="M50 25 V15 M40 15 Q50 20 60 15"/>', 'Planta resistente y versátil. Buena fuente de alimento con ciclo de cosecha medio.'),
('Papa',       2, 3, 8,  3,   1.5, 3, 1.2, 0,   5,   15,  24, 'inicial', '<ellipse cx="50" cy="60" rx="25" ry="18"/><circle cx="40" cy="55" r="2"/><circle cx="60" cy="65" r="1.5"/><path d="M50 42 V20 M35 25 Q50 30 65 25"/>', 'Requiere espacio y paciencia, pero su cosecha es la más abundante.'),
('Espirulina', 1, 4, 2,  4,   0.1, 1, 1.0, 4,   10,  4,   4,  'inicial', '<rect x="25" y="20" width="50" height="60" rx="5"/><path d="M25 40 Q50 50 75 40 M25 60 Q50 70 75 60" stroke-dasharray="2 2"/>', 'Microalga de alta eficiencia. Produce mucho oxígeno y alimento en poco tiempo.'),
('Soja',       3, 5, 12, 3,   2.5, 4, 1.6, 1,   8,   25,  30, 'inicial', '<ellipse cx="50" cy="55" rx="22" ry="12"/><circle cx="40" cy="55" r="4"/><circle cx="52" cy="55" r="4"/><circle cx="64" cy="55" r="4"/><path d="M50 43 V20 M38 28 Q50 33 62 28"/>', 'La planta más exigente pero la más productiva. Solo para bases avanzadas.');


CREATE TABLE modulos (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    nivel            INT DEFAULT 1,
    cosechas         INT DEFAULT 0,
    bloques_totales  INT DEFAULT 2,
    bloques_ocupados INT DEFAULT 0,
    cant_agua        DECIMAL(8,2) DEFAULT 0,
    cant_nutrientes  DECIMAL(8,2) DEFAULT 0,
    cant_energia     DECIMAL(8,2) DEFAULT 0,
    cant_oxigeno     DECIMAL(8,2) DEFAULT 0,
    estado           VARCHAR(20) DEFAULT 'estable'
                     CHECK (estado IN ('estable', 'critico', 'sobreriego', 'desechado')),
    -- a los 3 dias seguidos en critico el modulo se desecha
    dias_en_critico  INT DEFAULT 0
);


CREATE TABLE plantas (
    id                    SERIAL PRIMARY KEY,
    nombre                VARCHAR(100) NOT NULL,
    modulo_id             INT NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
    especie_id            INT NOT NULL REFERENCES especies(id),
    dias_transcurridos    INT NOT NULL,
    duracion              INT NOT NULL,
    estado                VARCHAR(30) DEFAULT 'creciendo'
                          CHECK (estado IN ('creciendo', 'lista_para_cosechar', 'seca', 'perdida')),
    porcentaje_agua       DECIMAL(5,2) DEFAULT 100,
    porcentaje_nutrientes DECIMAL(5,2) DEFAULT 100,
    porcentaje_energia    DECIMAL(5,2) DEFAULT 100
);


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

INSERT INTO eventos (id, nombre, descripcion, tipo, efecto_energia, efecto_oxigeno, efecto_agua, efecto_nutrientes)
VALUES
('tormenta_arena',  'Tormenta de Arena Marciana',    'El polvo denso bloquea los paneles solares y satura los filtros.',              'negativo', -15, -5,   0,  0),
('fuga_tanques',    'Microrrotura en Tanques',        'La fatiga del material provocó una leve fuga de líquidos antes de ser sellada.', 'negativo',   0,  0,  -8,  0),
('plaga_hongos',    'Contaminación Fúngica',          'Un hongo resistente está consumiendo los sustratos de los módulos.',             'negativo',   0,  0,   0, -5),
('vientos_optimos', 'Corrientes de Viento Óptimas',   'Las turbinas eólicas auxiliares operaron a máxima capacidad esta noche.',        'positivo',  10,  0,   0,  0),
('hielo_subterraneo','Veta de Hielo Encontrada',      'El rover automatizado extrajo un bloque de permafrost marciano.',                'positivo',  -2,  0,  12,  0),
('falla_electrica', 'Cortocircuito en Soporte Vital', 'Los sistemas de purificación se detuvieron temporalmente.',                     'negativo',  -5, -10,  0,  0);