CREATE TABLE base_espacial (
    id               SERIAL PRIMARY KEY,
    dia_actual       INT DEFAULT 1,
    nivel            INT DEFAULT 1,
    cant_agua        INT DEFAULT 20,
    cant_nutrientes  INT DEFAULT 20,
    cant_energia     INT DEFAULT 90,
    cant_oxigeno     INT DEFAULT 100,
    cant_comida      INT DEFAULT 100,
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
    eventos_creados         INT DEFAULT 0,
    fertilizaciones_disponibles INT DEFAULT 1
);

INSERT INTO base_espacial (dia_actual, nivel, cant_agua, cant_nutrientes, cant_energia, cant_oxigeno, cant_comida, total_cosechas, estado, tripulantes, evento_bloqueado_id, dias_restantes_bloqueo, eventos_creados, fertilizaciones_disponibles)
VALUES (1, 1, 100, 25, 70, 100, 100, 0, 'en_curso', 30, NULL, 0, 0, 1);

CREATE TABLE especies (
    id                    SERIAL PRIMARY KEY,
    nombre                VARCHAR(100) NOT NULL,
    tamanio               INT NOT NULL,
    nivel_requerido       INT NOT NULL,
    duracion              INT NOT NULL,
    agua_requerida        INT NOT NULL,
    oxigeno_requerido     INT NOT NULL,
    nutrientes_requeridos INT NOT NULL,
    energia_requerida     INT NOT NULL,
    nutrientes_generados  INT NOT NULL,
    oxigeno_generado      INT NOT NULL,
    agua_generada         INT NOT NULL,
    comida_generada       INT NOT NULL,
    estado                VARCHAR(20) DEFAULT 'inicial',
    pathSvg               TEXT,
    descripcion           TEXT
);

INSERT INTO especies (
    nombre, tamanio, nivel_requerido, duracion,
    agua_requerida, oxigeno_requerido, nutrientes_requeridos, energia_requerida,
    nutrientes_generados, oxigeno_generado, agua_generada, comida_generada,
    estado, pathSvg, descripcion
) VALUES 
(
    'Alga Chlorella', 1, 1, 4,
    10, 0, 2, 5,
    0, 25, 0, 2,
    'inicial', 
    '<circle cx="50" cy="50" r="38" fill="#1b4332"/><circle cx="45" cy="45" r="28" fill="#2d6a4f"/><path d="M40 70 C25 55 30 30 50 20 C70 30 75 55 60 70 Z" fill="#40916c" opacity="0.8"/><circle cx="40" cy="35" r="5" fill="#74c69d"/><circle cx="62" cy="55" r="4" fill="#95d5b2"/>',
    'Microalga de crecimiento súper rápido. Excelente para estabilizar y purificar la atmósfera inicial del invernadero.'
),
(
    'Papa', 2, 1, 5,
    15, 2, 8, 10,
    0, 5, 0, 35,
    'inicial', 
    '<path d="M50 50 Q45 20 30 15 Q45 20 40 35 Q50 20 60 10 Q55 25 50 50 Z" fill="#2e8b57"/><ellipse cx="50" cy="70" rx="26" ry="18" fill="#a0522d"/><ellipse cx="38" cy="65" rx="3" ry="2" fill="#693010"/><ellipse cx="62" cy="74" rx="4" ry="2" fill="#693010"/><ellipse cx="48" cy="78" rx="3" ry="1.5" fill="#693010"/>',
    'El tubérculo de supervivencia por excelencia. Muy rica en calorías y carbohidratos para mantener a la tripulación.'
),
(
    'Lechuga Hidropónica', 1, 1, 5,
    8, 1, 4, 4,
    0, 10, 5, 15,
    'inicial', 
    '<path d="M50 85 C25 80 15 50 30 30 C40 50 45 70 50 85 Z" fill="#52b69a"/><path d="M50 85 C75 80 85 50 70 30 C60 50 55 70 50 85 Z" fill="#40916c"/><path d="M50 85 C30 70 30 35 50 20 C70 35 70 70 50 85 Z" fill="#74c69d"/><path d="M50 85 L50 25" stroke="#d8f3dc" stroke-width="2"/>',
    'De ciclo corto y bajo costo energético. Recupera parte del agua de riego gracias a un sistema de transpiración eficiente.'
),
(
    'Tomate Cherry', 2, 2, 10,
    20, 3, 10, 15,
    0, 8, 5, 45,
    'inicial', 
    '<rect x="30" y="80" width="40" height="6" fill="#495057" rx="3"/><path d="M50 80 L50 30 M50 50 L30 40 M50 60 L70 45" stroke="#2d6a4f" stroke-width="4" stroke-linecap="round"/><circle cx="33" cy="44" r="10" fill="#d00000"/><circle cx="67" cy="49" r="11" fill="#dc2f02"/><circle cx="50" cy="26" r="9" fill="#e85d04"/><path d="M33 34 L33 31 M67 38 L67 35 M50 17 L50 14" stroke="#1b4332" stroke-width="3"/>',
    'Cultivo en vertical que aporta grandes nutrientes y variedad a la dieta de la base a cambio de más riego y luz.'
),
(
    'Frutilla', 1, 2, 9,
    12, 2, 6, 10,
    0, 12, 0, 25,
    'inicial', 
    '<path d="M50 25 Q30 25 28 45 Q26 75 50 88 Q74 75 72 45 Q70 25 50 25 Z" fill="#e63946"/><path d="M50 25 L35 18 M50 25 L50 12 M50 25 L65 18" stroke="#2a9d8f" stroke-width="4" stroke-linecap="round"/><circle cx="40" cy="45" r="1.5" fill="#ffd166"/><circle cx="60" cy="45" r="1.5" fill="#ffd166"/><circle cx="50" cy="60" r="1.5" fill="#ffd166"/><circle cx="42" cy="70" r="1.5" fill="#ffd166"/><circle cx="58" cy="68" r="1.5" fill="#ffd166"/>',
    'Fruto pequeño de alta moral para los astronautas. Consume poca agua y tiene un tiempo de cosecha relativamente rápido.'
),
(
    'Trigo Enano', 2, 3, 13,
    25, 5, 15, 30,
    5, 15, 0, 80,
    'inicial', 
    '<line x1="50" y1="90" x2="50" y2="15" stroke="#d4a373" stroke-width="4"/><ellipse cx="42" cy="30" rx="6" ry="12" fill="#ffd166" transform="rotate(-15 42 30)"/><ellipse cx="58" cy="40" rx="6" ry="12" fill="#ffd166" transform="rotate(15 58 40)"/><ellipse cx="42" cy="50" rx="6" ry="12" fill="#ffd166" transform="rotate(-15 42 50)"/><ellipse cx="58" cy="60" rx="6" ry="12" fill="#ffd166" transform="rotate(15 58 60)"/><ellipse cx="50" cy="18" rx="5" ry="10" fill="#ffb703"/>',
    'Cereal modificado de tallo corto para optimizar volumen. Base fundamental para producir harinas y reservas a largo plazo.'
),
(
    'Soja', 2, 3, 15,
    18, 4, 0, 20,
    30, 15, 0, 50,
    'inicial', 
    '<path d="M50 90 L50 20" stroke="#52796f" stroke-width="4"/><path d="M50 40 C30 40 25 60 50 65 Z" fill="#84a98c"/><path d="M50 55 C70 55 75 75 50 80 Z" fill="#52796f"/><circle cx="38" cy="51" r="4" fill="#cad2c5"/><circle cx="45" cy="54" r="4" fill="#cad2c5"/><circle cx="55" cy="67" r="4" fill="#cad2c5"/><circle cx="62" cy="69" r="4" fill="#cad2c5"/>',
    'Legumbre clave del invernadero: gracias a sus bacterias simbióticas fija nitrógeno y genera nutrientes para la tierra.'
),
(
    'Arroz Hidropónico', 3, 4, 20,
    45, 8, 20, 35,
    10, 45, 30, 95,
    'inicial', 
    '<rect x="20" y="75" width="60" height="15" rx="5" fill="#48cae4" opacity="0.5"/><path d="M50 80 L50 25 M50 60 L35 35 M50 65 L65 40" stroke="#588157" stroke-width="3" stroke-linecap="round"/><ellipse cx="46" cy="20" rx="3" ry="8" fill="#a3b18a" transform="rotate(-10 46 20)"/><ellipse cx="54" cy="22" rx="3" ry="8" fill="#a3b18a" transform="rotate(15 54 22)"/><ellipse cx="32" cy="32" rx="3" ry="8" fill="#a3b18a" transform="rotate(-20 32 32)"/><ellipse cx="68" cy="37" rx="3" ry="8" fill="#a3b18a" transform="rotate(20 68 37)"/>',
    'Cultivo masivo de alto nivel en bandejas inundadas. Excelente rendimiento calórico y gran productor de oxígeno.'
);


CREATE TABLE modulos (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    nivel            INT DEFAULT 1,
    cosechas         INT DEFAULT 0,
    bloques_totales  INT DEFAULT 2,
    bloques_ocupados INT DEFAULT 0,
    cant_agua        INT DEFAULT 0,
    cant_nutrientes  INT DEFAULT 0,
    cant_energia     INT DEFAULT 0,
    cant_oxigeno     INT DEFAULT 0,
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
                          CHECK (estado IN ('creciendo', 'lista_para_cosechar', 'cosechada', 'seca', 'perdida')),
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