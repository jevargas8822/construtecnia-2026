-- ==============================================================================
-- CONSTRUCTECNIA 2026 - XXI EDICIÓN (ADEIC PUCP)
-- Sede B-100 PUCP | 23 y 24 de noviembre de 2026
-- Script SQL para Actualizar los Nombres de las 8 Ponencias en Base de Datos
--
-- IMPORTANTE:
-- - NO borra ni recrea ninguna tabla.
-- - NO borra ni modifica ningún registro de la tabla 'asistencias'.
-- - Preserva intactos los 'id' (claves primarias) y el orden (1 a 8).
-- - Preserva los estados actuales ('cerrada', 'abierta') y las horas de apertura/cierre.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- DÍA 1: Lunes 23 de noviembre de 2026 (Ponencias 1 a 4)
-- ------------------------------------------------------------------------------

-- Ponencia 1 (4–5 PM)
UPDATE ponencias
SET 
    nombre = 'Barton Aliaga · AECOM',
    expositor = 'Ingeniero Geotécnico · 4–5 PM',
    descripcion = 'Ingeniero Geotécnico — Horario: 4–5 PM',
    dia = 1,
    fecha = '2026-11-23'
WHERE orden = 1;

-- Ponencia 2 (5–6 PM)
UPDATE ponencias
SET 
    nombre = 'Karla Vallejos · Pacasmayo (Prefabricados)',
    expositor = 'Subgerenta de Ingeniería y Prospección · 5–6 PM',
    descripcion = 'Subgerenta de Ingeniería y Prospección — Horario: 5–6 PM',
    dia = 1,
    fecha = '2026-11-23'
WHERE orden = 2;

-- Ponencia 3 (6–7 PM)
UPDATE ponencias
SET 
    nombre = 'Fernando Chávez · PDK',
    expositor = 'Subgerente de PMO · 6–7 PM',
    descripcion = 'Subgerente de PMO — Horario: 6–7 PM',
    dia = 1,
    fecha = '2026-11-23'
WHERE orden = 3;

-- Ponencia 4 (7–8 PM)
UPDATE ponencias
SET 
    nombre = 'Yerssy Saavedra · Gleeds',
    expositor = 'Assistant Contract Manager · 7–8 PM',
    descripcion = 'Assistant Contract Manager — Horario: 7–8 PM',
    dia = 1,
    fecha = '2026-11-23'
WHERE orden = 4;

-- ------------------------------------------------------------------------------
-- DÍA 2: Martes 24 de noviembre de 2026 (Ponencias 5 a 8)
-- ------------------------------------------------------------------------------

-- Ponencia 5 (4–5 PM)
UPDATE ponencias
SET 
    nombre = 'Toninho Serrano · PROMET',
    expositor = 'Director de Operaciones Regional (Perú y Chile) · 4–5 PM',
    descripcion = 'Director de Operaciones Regional (Perú y Chile) — Horario: 4–5 PM',
    dia = 2,
    fecha = '2026-11-24'
WHERE orden = 5;

-- Ponencia 6 (5–6 PM)
UPDATE ponencias
SET 
    nombre = 'Gonzalo Vigo · Pacasmayo (Pavimentos)',
    expositor = 'Jefe de Ingeniería de Pavimentos · 5–6 PM',
    descripcion = 'Jefe de Ingeniería de Pavimentos — Horario: 5–6 PM',
    dia = 2,
    fecha = '2026-11-24'
WHERE orden = 6;

-- Ponencia 7 (6–7 PM)
UPDATE ponencias
SET 
    nombre = 'Gustavo Loa · Prisma Ingeniería',
    expositor = 'Jefe del Área I+D+i y de Revisión de Proyectos de Estructuras, Profesor PUCP · 6–7 PM',
    descripcion = 'Jefe del Área I+D+i y de Revisión de Proyectos de Estructuras, Profesor PUCP — Horario: 6–7 PM',
    dia = 2,
    fecha = '2026-11-24'
WHERE orden = 7;

-- Ponencia 8 (7–8 PM)
UPDATE ponencias
SET 
    nombre = 'Ronald Roosvelt y Omar Alfaro · COSAPI',
    expositor = 'Ingeniero y Gerente de la Unidad de Proyectos Colaborativos · 7–8 PM',
    descripcion = 'Ingeniero y Gerente de la Unidad de Proyectos Colaborativos — Horario: 7–8 PM',
    dia = 2,
    fecha = '2026-11-24'
WHERE orden = 8;

COMMIT;

-- Verificación de los cambios realizados:
SELECT orden, dia, fecha, nombre, expositor, estado FROM ponencias ORDER BY orden ASC;
