CREATE TABLE base_espacial (
    id               SERIAL PRIMARY KEY,
    dia_actual       INT DEFAULT 1,
    nivel            INT DEFAULT 1,
    agua             DECIMAL(8,2) DEFAULT 20,
    nutrientes       INT DEFAULT 20,
    energia          DECIMAL(5,2) DEFAULT 10,
    oxigeno          DECIMAL(5,2) DEFAULT 100,
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
    energia          DECIMAL(8,2) DEFAULT 0,
    oxigeno          DECIMAL(8,2) DEFAULT 0
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

INSERT INTO base_espacial (dia_actual, nivel, agua, nutrientes, energia, oxigeno, comida, total_cosechas, estado)
VALUES (1, 1, 20, 20, 10, 100, 100, 0, 'en_curso');

INSERT INTO tripulantes (cantidad, estado, dias_sin_comer)
VALUES (10, 'sano', 0);

INSERT INTO modulos (nivel, estado, bloques_totales, bloques_ocupados, agua, nutrientes, energia)
VALUES (1, 'estable', 2, 0, 0, 0, 0);

INSERT INTO especies (nombre, tamanio, agua_requerida, oxigeno_requerido, nutrientes_requeridos, nutrientes_generados, duracion, agua_producida, nivel_requerido, estado, path_svg, descripcion)
VALUES
('Tomate',     1, 2.0, 1.0, 2.0, 1.0, 5,  8.0,  1, 'inicial', '<circle cx="50" cy="40" r="15"/><path d="M50 25 V15 M40 15 Q50 20 60 15"/>',                                                          'Planta resistente y versátil. Buena fuente de alimento con ciclo de cosecha medio.'),
('Lechuga',    1, 1.0, 0.5, 1.0, 0.5, 3,  3.0,  1, 'inicial', '<path d="M50 80 Q30 60 40 30 Q50 10 60 30 Q70 60 50 80 Z"/><path d="M50 80 V30"/>',                                                   'Crece rápido y produce oxígeno. Ideal para los primeros días de la colonia.'),
('Rábano',     1, 0.5, 0.5, 1.0, 1.0, 3,  1.5,  1, 'inicial', '<ellipse cx="50" cy="65" rx="12" ry="18"/><path d="M50 47 V25 M40 30 Q50 27 60 30"/>',                                               'El más económico en recursos. Perfecto para cuando los suministros escasean.'),
('Papa',       2, 3.0, 1.5, 3.0, 0.0, 8,  15.0, 3, 'inicial', '<ellipse cx="50" cy="60" rx="25" ry="18"/><circle cx="40" cy="55" r="2"/><circle cx="60" cy="65" r="1.5"/><path d="M50 42 V20"/>',   'Requiere espacio y paciencia, pero su cosecha es la más abundante en agua.'),
('Espirulina', 1, 4.0, 0.1, 1.0, 4.0, 2,  4.0,  4, 'inicial', '<rect x="25" y="20" width="50" height="60" rx="5"/><path d="M25 40 Q50 50 75 40 M25 60 Q50 70 75 60" stroke-dasharray="2 2"/>',      'Microalga de alta eficiencia. Produce mucho oxígeno y alimento en poco tiempo.'),
('Soja',       3, 5.0, 2.5, 4.0, 1.0, 12, 25.0, 5, 'inicial', '<path d="M50 80 V20 M35 35 Q50 45 65 35 M35 55 Q50 65 65 55"/>' ,                                                                    'La planta más exigente pero la más productiva en agua. Solo para bases avanzadas.');

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