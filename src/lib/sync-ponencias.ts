import { query, ensureDatabaseInitialized, ensureMigrations } from '@/lib/db';
import { EVENT_CONFIG } from '@/config';

let lastSyncTime = 0;
let inFlightSync: Promise<void> | null = null;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // Máximo una vez cada 5 minutos por instancia

/**
 * Sincroniza automáticamente las 8 ponencias desde src/config.ts hacia la base de datos PostgreSQL.
 *
 * Reglas estrictas:
 * - Actualiza ÚNICAMENTE: nombre, cargo/subtítulo (columna 'expositor'), fecha, dia, descripcion y horario (si existe la columna).
 * - NO toca: estado ('abierta' | 'cerrada' | 'finalizada'), abierta_en, cerrada_en ni la tabla 'asistencias'.
 * - NUNCA borra ni recrea tablas ni filas, ni altera las claves primarias (id).
 * - Idempotente: si los datos en la base de datos ya coinciden con config.ts, no ejecuta escrituras.
 * - Control en memoria: corre como máximo 1 vez cada 5 minutos por instancia.
 */
export async function syncPonenciasSiEsNecesario(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastSyncTime < SYNC_INTERVAL_MS) {
    return;
  }

  if (inFlightSync) {
    return inFlightSync;
  }

  inFlightSync = (async () => {
    try {
      await ejecutarSincronizacionPonencias();
      lastSyncTime = Date.now();
    } catch (error) {
      console.error('[Sync Ponencias Error]: Error al sincronizar ponencias automáticas:', error);
    } finally {
      inFlightSync = null;
    }
  })();

  return inFlightSync;
}

export async function ejecutarSincronizacionPonencias(): Promise<void> {
  // Asegurar migraciones automáticas en la base de datos (nombres, apellidos en asistencias)
  await ensureMigrations();

  // 1. Verificar si la tabla 'ponencias' existe y qué columnas tiene
  let hasHorarioCol = false;
  try {
    const colRes = await query<{ column_name: string }>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ponencias';
    `);

    if (colRes.rows.length === 0) {
      // La tabla aún no existe; inicializarla
      await ensureDatabaseInitialized();
      return;
    }

    const cols = new Set(colRes.rows.map((r) => r.column_name.toLowerCase()));
    hasHorarioCol = cols.has('horario');
  } catch (err: unknown) {
    const dbErr = err as { code?: string };
    if (dbErr?.code === '42P01') {
      await ensureDatabaseInitialized();
      return;
    }
    throw err;
  }

  // 2. Sincronizar de forma idempotente las 8 ponencias de config.ts
  for (const p of EVENT_CONFIG.ponencias) {
    const cargoTexto = p.cargo || p.expositor || '';
    const descripcionTexto = p.descripcion || cargoTexto;
    const targetId = p.id || p.orden;

    // Verificar si existe la fila con ese id
    const existeRes = await query<{ id: number }>(
      `SELECT id FROM ponencias WHERE id = $1 LIMIT 1;`,
      [targetId]
    );

    if (existeRes.rows.length > 0) {
      // La fila existe: UPDATE idempotente por id
      // Preserva intactos: estado, abierta_en, cerrada_en y asistencias
      if (hasHorarioCol) {
        await query(
          `
          UPDATE ponencias
          SET 
            nombre = $1,
            expositor = $2,
            fecha = $3,
            dia = $4,
            descripcion = $5,
            horario = $6
          WHERE id = $7 AND (
            nombre IS DISTINCT FROM $1 OR
            expositor IS DISTINCT FROM $2 OR
            fecha IS DISTINCT FROM $3::date OR
            dia IS DISTINCT FROM $4 OR
            descripcion IS DISTINCT FROM $5 OR
            horario IS DISTINCT FROM $6
          );
        `,
          [p.nombre, cargoTexto, p.fecha, p.dia, descripcionTexto, p.horario, targetId]
        );
      } else {
        await query(
          `
          UPDATE ponencias
          SET 
            nombre = $1,
            expositor = $2,
            fecha = $3,
            dia = $4,
            descripcion = $5
          WHERE id = $6 AND (
            nombre IS DISTINCT FROM $1 OR
            expositor IS DISTINCT FROM $2 OR
            fecha IS DISTINCT FROM $3::date OR
            dia IS DISTINCT FROM $4 OR
            descripcion IS DISTINCT FROM $5
          );
        `,
          [p.nombre, cargoTexto, p.fecha, p.dia, descripcionTexto, targetId]
        );
      }
    } else {
      // Fila no existe previamente: INSERT atómico con ON CONFLICT (id) DO UPDATE
      if (hasHorarioCol) {
        await query(
          `
          INSERT INTO ponencias (id, orden, dia, fecha, nombre, expositor, descripcion, horario, estado)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'cerrada')
          ON CONFLICT (id) DO UPDATE
          SET 
            nombre = EXCLUDED.nombre,
            expositor = EXCLUDED.expositor,
            fecha = EXCLUDED.fecha,
            dia = EXCLUDED.dia,
            descripcion = EXCLUDED.descripcion,
            horario = EXCLUDED.horario
          WHERE 
            ponencias.nombre IS DISTINCT FROM EXCLUDED.nombre OR
            ponencias.expositor IS DISTINCT FROM EXCLUDED.expositor OR
            ponencias.fecha IS DISTINCT FROM EXCLUDED.fecha OR
            ponencias.dia IS DISTINCT FROM EXCLUDED.dia OR
            ponencias.descripcion IS DISTINCT FROM EXCLUDED.descripcion OR
            ponencias.horario IS DISTINCT FROM EXCLUDED.horario;
        `,
          [targetId, p.orden, p.dia, p.fecha, p.nombre, cargoTexto, descripcionTexto, p.horario]
        );
      } else {
        await query(
          `
          INSERT INTO ponencias (id, orden, dia, fecha, nombre, expositor, descripcion, estado)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'cerrada')
          ON CONFLICT (id) DO UPDATE
          SET 
            nombre = EXCLUDED.nombre,
            expositor = EXCLUDED.expositor,
            fecha = EXCLUDED.fecha,
            dia = EXCLUDED.dia,
            descripcion = EXCLUDED.descripcion
          WHERE 
            ponencias.nombre IS DISTINCT FROM EXCLUDED.nombre OR
            ponencias.expositor IS DISTINCT FROM EXCLUDED.expositor OR
            ponencias.fecha IS DISTINCT FROM EXCLUDED.fecha OR
            ponencias.dia IS DISTINCT FROM EXCLUDED.dia OR
            ponencias.descripcion IS DISTINCT FROM EXCLUDED.descripcion;
        `,
          [targetId, p.orden, p.dia, p.fecha, p.nombre, cargoTexto, descripcionTexto]
        );
      }
    }
  }
}
