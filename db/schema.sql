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
    correo VARCHAR(255) NOT NULL,
    tipo_id VARCHAR(50) NOT NULL CHECK (tipo_id IN ('alumno_pucp', 'externo')),
    documento VARCHAR(50) NOT NULL,
    ponencia_id INT NOT NULL REFERENCES ponencias(id) ON DELETE CASCADE,
    registrado_en TIMESTAMPTZ DEFAULT NOW(),
    ip_hash VARCHAR(64) NOT NULL,
    CONSTRAINT uq_asistencias_correo_ponencia UNIQUE (correo, ponencia_id)
);

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

-- 4. CONTROL DE RATE LIMITING EN BASE DE DATOS
CREATE TABLE IF NOT EXISTS rate_limits (
    ip_hash VARCHAR(64) NOT NULL,
    accion VARCHAR(32) NOT NULL,
    minuto_epoch BIGINT NOT NULL,
    contador INT NOT NULL DEFAULT 1,
    PRIMARY KEY (ip_hash, accion, minuto_epoch)
);

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
    (1, 1, '2026-11-23', 'Ponencia 1: Innovación en Estructuras Sismorresistentes y Concreto de Alto Desempeño', 'Especialista Nacional en Estructuras', 'Nuevas tendencias en diseño sismorresistente aplicadas a infraestructura nacional.', 'cerrada'),
    (2, 1, '2026-11-23', 'Ponencia 2: Geotecnia Aplicada y Cimentaciones Especiales en Obras Complejas', 'Especialista en Mecánica de Suelos', 'Retos y soluciones en cimentaciones profundas y estabilización de taludes.', 'cerrada'),
    (3, 1, '2026-11-23', 'Ponencia 3: Transformación Digital y Metodología BIM-VDC en Mega Proyectos', 'Consultor Senior BIM / VDC', 'Implementación estratégica de modelos digitales para optimización de plazos y costos.', 'cerrada'),
    (4, 1, '2026-11-23', 'Ponencia 4: Gestión de Proyectos de Infraestructura y Contratos Colaborativos NEC/FIDIC', 'Experto en Gestión de Contratos y Dirección de Obras', 'Mejores prácticas en la resolución de controversias y ejecución eficiente de proyectos públicos.', 'cerrada'),
    (5, 2, '2026-11-24', 'Ponencia 5: Construcción Sostenible, Certificaciones Verdes y Economía Circular', 'Especialista en Edificaciones Sostenibles (LEED / EDGE)', 'Reducción de huella de carbono y materiales ecoamigables en la industria de la construcción.', 'cerrada'),
    (6, 2, '2026-11-24', 'Ponencia 6: Hidráulica Urbana, Drenaje Sostenible y Resiliencia ante Eventos Climáticos', 'Consultor en Recursos Hídricos e Ingeniería Sanitaria', 'Sistemas urbanos de drenaje sostenible (SUDS) y mitigación de desastres.', 'cerrada'),
    (7, 2, '2026-11-24', 'Ponencia 7: Automatización, Robótica e Inteligencia Artificial en Obra', 'Investigador en Construtech e IA Aplicada', 'Uso de drones, sensores IoT e IA predictiva para supervisión y seguridad en faena.', 'cerrada'),
    (8, 2, '2026-11-24', 'Ponencia 8: Lean Construction y Productividad en la Industria de la Construcción', 'Líder de Productividad y Last Planner System', 'Estrategias prácticas de eliminación de pérdidas y mejora continua del flujo de trabajo.', 'cerrada')
ON CONFLICT (orden) DO UPDATE 
SET 
    dia = EXCLUDED.dia,
    fecha = EXCLUDED.fecha,
    nombre = EXCLUDED.nombre,
    expositor = EXCLUDED.expositor,
    descripcion = EXCLUDED.descripcion;
