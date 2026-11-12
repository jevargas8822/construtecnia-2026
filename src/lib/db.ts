import { Pool, QueryResult, QueryResultRow } from 'pg';
import { EVENT_CONFIG } from '@/config';

// Global singleton pool for Next.js development hot-reloading & serverless pooling
declare global {
  // eslint-disable-next-line no-var
  var __postgres_pool__: Pool | undefined;
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'La variable de entorno DATABASE_URL no está configurada. Por favor configúrala en .env.local o en Vercel.'
    );
  }

  if (global.__postgres_pool__) {
    return global.__postgres_pool__;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const connectionString = process.env.DATABASE_URL;

  // Supabase / Neon / Vercel Postgres usually require SSL in production
  const requiresSsl =
    connectionString.includes('sslmode=require') ||
    connectionString.includes('neon.tech') ||
    connectionString.includes('supabase') ||
    connectionString.includes('vercel-storage') ||
    isProduction;

  const pool = new Pool({
    connectionString,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    max: 15, // Conexiones concurrentes optimizadas para serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('[DB Error] Error imprevisto en el pool de PostgreSQL:', err);
  });

  if (process.env.NODE_ENV !== 'production') {
    global.__postgres_pool__ = pool;
  }

  return pool;
}

/**
 * Ejecuta una consulta SQL parametrizada con el pool de conexiones.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB Query] ${text.slice(0, 80)}... (${duration}ms, rows: ${res.rowCount})`);
    }
    return res;
  } catch (error) {
    console.error(`[DB Query Error] Query: "${text}"`, error);
    throw error;
  }
}

/**
 * Inicializa automáticamente las tablas de la base de datos y carga las 8 ponencias de config.ts
 * si aún no existen. Esto facilita enormemente el despliegue inicial.
 */
export async function ensureDatabaseInitialized(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Tabla ponencias
    await client.query(`
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
    `);

    // 2. Tabla asistencias
    await client.query(`
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
    `);

    // 3. Tabla inscritos
    await client.query(`
      CREATE TABLE IF NOT EXISTS inscritos (
        id SERIAL PRIMARY KEY,
        correo VARCHAR(255) NOT NULL UNIQUE,
        nombres VARCHAR(255),
        documento VARCHAR(50),
        cargado_en TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_inscritos_correo ON inscritos(correo);
    `);

    // 4. Rate limits
    await client.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        ip_hash VARCHAR(64) NOT NULL,
        accion VARCHAR(32) NOT NULL,
        minuto_epoch BIGINT NOT NULL,
        contador INT NOT NULL DEFAULT 1,
        PRIMARY KEY (ip_hash, accion, minuto_epoch)
      );
    `);

    // 5. Intentos login staff
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_intentos_login (
        ip_hash VARCHAR(64) PRIMARY KEY,
        intentos INT NOT NULL DEFAULT 1,
        bloqueado_hasta TIMESTAMPTZ,
        ultimo_intento TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Cargar o actualizar las 8 ponencias de config.ts
    for (const p of EVENT_CONFIG.ponencias) {
      await client.query(
        `
        INSERT INTO ponencias (orden, dia, fecha, nombre, expositor, descripcion, estado)
        VALUES ($1, $2, $3, $4, $5, $6, 'cerrada')
        ON CONFLICT (orden) DO UPDATE
        SET 
          dia = EXCLUDED.dia,
          fecha = EXCLUDED.fecha,
          nombre = EXCLUDED.nombre,
          expositor = EXCLUDED.expositor,
          descripcion = EXCLUDED.descripcion;
      `,
        [p.orden, p.dia, p.fecha, p.nombre, p.expositor || null, p.descripcion || null]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  } finally {
    client.release();
  }
}
