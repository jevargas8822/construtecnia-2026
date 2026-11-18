-- ==============================================================================
-- CONSTRUCTECNIA 2026 - XXI EDICIÓN (ADEIC PUCP)
-- Sede B-100 PUCP | 23 y 24 de noviembre de 2026
-- Script SQL de Referencia para Actualizar los Nombres de las 8 Ponencias
-- (NOTA: Ya no es necesario ejecutar este script manualmente, ya que la aplicación
-- sincroniza automáticamente los datos desde src/config.ts al consultar el sistema).
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
    expositor = 'Ingeniero Geotécnico',
    descripcion = 'Ingeniero Geotécnico',
    dia = 1,
    fecha = '2026-11-23'
WHERE orden = 1;

-- Ponencia 2 (5–6 PM)
UPDATE ponencias
SET 
    nombre = 'Karla Vallejos · Pacasmayo (Prefabricados)',
    expositor = 'Subgerenta de Ingeniería y Prospección',
    descripcion = 'Subgerenta de Ingeniería y Prospección',
    dia = 1,
    fecha = '2026-11-23'
WHERE orden = 2;

-- Ponencia 3 (6–7 PM)
UPDATE ponencias
SET 
    nombre = 'Fernando Chávez · PDK',
    expositor = 'Subgerente de PMO',
    descripcion = 'Subgerente de PMO',
    dia = 1,
    fecha = '2026-11-23'
WHERE orden = 3;

-- Ponencia 4 (7–8 PM)
UPDATE ponencias
SET 
    nombre = 'Yerssy Saavedra · Gleeds',
    expositor = 'Assistant Contract Manager',
    descripcion = 'Assistant Contract Manager',
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
    expositor = 'Director de Operaciones Regional (Perú y Chile)',
    descripcion = 'Director de Operaciones Regional (Perú y Chile)',
    dia = 2,
    fecha = '2026-11-24'
WHERE orden = 5;

-- Ponencia 6 (5–6 PM)
UPDATE ponencias
SET 
    nombre = 'Gonzalo Vigo · Pacasmayo (Pavimentos)',
    expositor = 'Jefe de Ingeniería de Pavimentos',
    descripcion = 'Jefe de Ingeniería de Pavimentos',
    dia = 2,
    fecha = '2026-11-24'
WHERE orden = 6;

-- Ponencia 7 (6–7 PM)
UPDATE ponencias
SET 
    nombre = 'Gustavo Loa · Prisma Ingeniería',
    expositor = 'Jefe del Área I+D+i y de Revisión de Proyectos de Estructuras · Profesor PUCP',
    descripcion = 'Jefe del Área I+D+i y de Revisión de Proyectos de Estructuras · Profesor PUCP',
    dia = 2,
    fecha = '2026-11-24'
WHERE orden = 7;

-- Ponencia 8 (7–8 PM)
UPDATE ponencias
SET 
    nombre = 'Ronald Roosvelt y Omar Alfaro · COSAPI',
    expositor = 'Ingeniero y Gerente de la Unidad de Proyectos Colaborativos',
    descripcion = 'Ingeniero y Gerente de la Unidad de Proyectos Colaborativos',
    dia = 2,
    fecha = '2026-11-24'
WHERE orden = 8;

COMMIT;

-- Verificación de los cambios realizados:
SELECT orden, dia, fecha, nombre, expositor, estado FROM ponencias ORDER BY orden ASC;
