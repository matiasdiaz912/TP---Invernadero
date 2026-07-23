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
    tripulantes INT DEFAULT 30,
    evento_bloqueado_id     VARCHAR(50) DEFAULT NULL,
    dias_restantes_bloqueo  INT DEFAULT 0,
    eventos_creados         INT DEFAULT 0
);

INSERT INTO base_espacial (dia_actual, nivel, cant_agua, cant_nutrientes, cant_energia, cant_oxigeno, cant_comida, total_cosechas, estado, tripulantes,evento_bloqueado_id, dias_restantes_bloqueo, eventos_creados)
VALUES (1, 1, 20, 20, 10, 100, 100, 0, 'en_curso', 30, NULL, 0, 0);


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
    nutrientes_generados  DECIMAL(5,2) NOT NULL,
    agua_generada         DECIMAL(5,2) NOT NULL,
    comida_generada       DECIMAL(5,2) NOT NULL,
    estado                VARCHAR(20) DEFAULT 'inicial',
    pathSvg               TEXT,
    descripcion           TEXT
);

INSERT INTO especies (nombre, tamanio, nivel_requerido, duracion, agua_requerida, oxigeno_requerido, nutrientes_requeridos, energia_requerida, nutrientes_generados, agua_generada, comida_generada, estado, pathSvg, descripcion)
VALUES
('Rábano',     1, 1, 3, 0.5, 0.5, 1, 1, 1.5,  1, 1, 'inicial', '<circle cx="50" cy="60" r="16"/><path d="M50 44 V16 M40 22 Q50 27 60 22"/><path d="M50 76 V88"/>', 'El más económico en recursos. Perfecto para cuando los suministros escasean.'),
('Lechuga',    1, 1, 4, 0.5, 0.5, 1, 1, 2,    1, 1, 'inicial', '<ellipse cx="50" cy="65" rx="12" ry="18"/><path d="M50 47 V25 M40 30 Q50 27 60 30"/>', 'Una opción de bajo costo y rápido crecimiento. Ideal para mantener la dieta balanceada.'),
('Tomate',     2, 2, 5, 1,   1,   2, 2, 3.5, 2, 2, 'inicial', '<ellipse cx="50" cy="65" rx="12" ry="18"/><path d="M50 47 V25 M40 30 Q50 27 60 30"/>', 'Requiere más recursos que el rábano o la lechuga pero ofrece una mayor recompensa.'),
('Papa',       3, 3, 6, 1.5, 1.5, 3, 3, 5.5, 3, 3, 'inicial', '<ellipse cx="50" cy="65" rx="12" ry="18"/><path d="M50 47 V25 M40 30 Q50 27 60 30"/>', 'Una opción más costosa pero con un rendimiento mucho mayor en comparación con las anteriores.'),
('Zanahoria',   4,4 ,7 ,2 ,2 ,4 ,4 ,7.5 ,4 ,4 ,'inicial','<ellipse cx="50" cy="65" rx="12" ry="18"/><path d="M50 47 V25 M40 30 Q50 27 60 30"/>','Una opción de alto costo y alto rendimiento. Perfecta para cuando los suministros son abundantes.');


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
                     CHECK (estado IN ('estable', 'critico', 'sobreriego', 'desechado'))
);


CREATE TABLE plantas (
    id                    SERIAL PRIMARY KEY,
    nombre                VARCHAR(100) NOT NULL,
    modulo_id             INT NOT NULL REFERENCES modulos(id),
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
    efecto_nutrientes   INT DEFAULT 0,
    modificado          BOOLEAN DEFAULT FALSE
);

INSERT INTO eventos (id, nombre, descripcion, tipo, efecto_energia, efecto_oxigeno, efecto_agua, efecto_nutrientes, modificado)
VALUES
('tormenta_arena',  'Tormenta de Arena Marciana',    'El polvo denso bloquea los paneles solares y satura los filtros.',              'negativo', -15, -5,   0,  0, FALSE),
('fuga_tanques',    'Microrrotura en Tanques',        'La fatiga del material provocó una leve fuga de líquidos antes de ser sellada.', 'negativo',   0,  0,  -8,  0, FALSE),
('plaga_hongos',    'Contaminación Fúngica',          'Un hongo resistente está consumiendo los sustratos de los módulos.',             'negativo',   0,  0,   0, -5, FALSE),
('vientos_optimos', 'Corrientes de Viento Óptimas',   'Las turbinas eólicas auxiliares operaron a máxima capacidad esta noche.',        'positivo',  10,  0,   0,  0, FALSE),
('hielo_subterraneo','Veta de Hielo Encontrada',      'El rover automatizado extrajo un bloque de permafrost marciano.',                'positivo',  -2,  0,  12,  0, FALSE),
('falla_electrica', 'Cortocircuito en Soporte Vital', 'Los sistemas de purificación se detuvieron temporalmente.',                     'negativo',  -5, -10,  0,  0, FALSE);