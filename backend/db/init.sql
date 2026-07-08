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