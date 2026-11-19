-- ==============================================================================
-- CONSTRUCTECNIA 2026 - XXI EDICIÓN (ADEIC PUCP)
-- Sede B-100 PUCP | 23 y 24 de noviembre de 2026
-- Script DDL de Base de Datos PostgreSQL (Neon / Supabase / Vercel Postgres)
-- ==============================================================================

-- 1. TABLA DE PONENCIAS
CREATE TABLE IF NOT EXISTS ponencias (
    id SERIAL PRIMARY KEY,
    orden INT NOT NULL UNIQUE,
    dia INT NOT NULL,
    fecha DATE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    expositor VARCHAR(255),
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'cerrada' CHECK (estado IN ('cerrada', 'abierta', 'finalizada')),
    abierta_en TIMESTAMPTZ,
    cerrada_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ponencias_estado ON ponencias(estado);
CREATE INDEX IF NOT EXISTS idx_ponencias_orden ON ponencias(orden);

-- 2. TABLA DE ASISTENCIAS
CREATE TABLE IF NOT EXISTS asistencias (
    id SERIAL PRIMARY KEY,
    nombres TEXT,
    apellidos TEXT,
    correo VARCHAR(255) NOT NULL,
    tipo_id VARCHAR(50) NOT NULL CHECK (tipo_id IN ('alumno_pucp', 'externo')),
    documento VARCHAR(50) NOT NULL,
    ponencia_id INT NOT NULL REFERENCES ponencias(id) ON DELETE CASCADE,
    registrado_en TIMESTAMPTZ DEFAULT NOW(),
    ip_hash VARCHAR(64) NOT NULL,
    CONSTRAINT uq_asistencias_correo_ponencia UNIQUE (correo, ponencia_id)
);

-- Migración segura para bases de datos existentes
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS nombres TEXT;
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS apellidos TEXT;

CREATE INDEX IF NOT EXISTS idx_asistencias_ponencia_id ON asistencias(ponencia_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_correo ON asistencias(correo);
CREATE INDEX IF NOT EXISTS idx_asistencias_documento ON asistencias(documento);
CREATE INDEX IF NOT EXISTS idx_asistencias_ip_hash ON asistencias(ip_hash);
CREATE INDEX IF NOT EXISTS idx_asistencias_registrado_en ON asistencias(registrado_en);

-- 3. TABLA DE INSCRITOS PREVIOS (Opcional - Carga Passline)
CREATE TABLE IF NOT EXISTS inscritos (
    id SERIAL PRIMARY KEY,
    correo VARCHAR(255) NOT NULL UNIQUE,
    nombres VARCHAR(255),
    documento VARCHAR(50),
    cargado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inscritos_correo ON inscritos(correo);

-- 4. CONTROL DE RATE LIMITING EN BASE DE DATOS (SERVERLESS COMPATIBLE)
CREATE TABLE IF NOT EXISTS rate_limits (
    clave VARCHAR(128) NOT NULL,
    accion VARCHAR(32) NOT NULL,
    minuto_epoch BIGINT NOT NULL,
    contador INT NOT NULL DEFAULT 1,
    PRIMARY KEY (clave, accion, minuto_epoch)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_minuto ON rate_limits(minuto_epoch);

-- Migración automática si existía previamente con columna ip_hash
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rate_limits' AND column_name = 'ip_hash'
  ) THEN
    ALTER TABLE rate_limits RENAME COLUMN ip_hash TO clave;
    ALTER TABLE rate_limits ALTER COLUMN clave TYPE VARCHAR(128);
  END IF;
END $$;

-- 5. CONTROL DE INTENTOS FALLIDOS DE LOGIN DEL STAFF
CREATE TABLE IF NOT EXISTS admin_intentos_login (
    ip_hash VARCHAR(64) PRIMARY KEY,
    intentos INT NOT NULL DEFAULT 1,
    bloqueado_hasta TIMESTAMPTZ,
    ultimo_intento TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- CARGA INICIAL DE LAS 8 PONENCIAS (DÍA 1: 1-4 | DÍA 2: 5-8)
-- ==============================================================================
INSERT INTO ponencias (orden, dia, fecha, nombre, expositor, descripcion, estado)
VALUES
    (1, 1, '2026-11-23', 'Barton Aliaga · AECOM', 'Ingeniero Geotécnico', 'Ingeniero Geotécnico', 'cerrada'),
    (2, 1, '2026-11-23', 'Karla Vallejos · Pacasmayo (Prefabricados)', 'Subgerenta de Ingeniería y Prospección', 'Subgerenta de Ingeniería y Prospección', 'cerrada'),
    (3, 1, '2026-11-23', 'Fernando Chávez · PDK', 'Subgerente de PMO', 'Subgerente de PMO', 'cerrada'),
    (4, 1, '2026-11-23', 'Yerssy Saavedra · Gleeds', 'Assistant Contract Manager', 'Assistant Contract Manager', 'cerrada'),
    (5, 2, '2026-11-24', 'Toninho Serrano · PROMET', 'Director de Operaciones Regional (Perú y Chile)', 'Director de Operaciones Regional (Perú y Chile)', 'cerrada'),
    (6, 2, '2026-11-24', 'Gonzalo Vigo · Pacasmayo (Pavimentos)', 'Jefe de Ingeniería de Pavimentos', 'Jefe de Ingeniería de Pavimentos', 'cerrada'),
    (7, 2, '2026-11-24', 'Gustavo Loa · Prisma Ingeniería', 'Jefe del Área I+D+i y de Revisión de Proyectos de Estructuras · Profesor PUCP', 'Jefe del Área I+D+i y de Revisión de Proyectos de Estructuras · Profesor PUCP', 'cerrada'),
    (8, 2, '2026-11-24', 'Ronald Roosvelt y Omar Alfaro · COSAPI', 'Ingeniero y Gerente de la Unidad de Proyectos Colaborativos', 'Ingeniero y Gerente de la Unidad de Proyectos Colaborativos', 'cerrada')
ON CONFLICT (orden) DO UPDATE 
SET 
    dia = EXCLUDED.dia,
    fecha = EXCLUDED.fecha,
    nombre = EXCLUDED.nombre,
    expositor = EXCLUDED.expositor,
    descripcion = EXCLUDED.descripcion;
