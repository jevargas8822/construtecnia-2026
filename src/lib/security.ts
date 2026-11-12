import crypto from 'crypto';
import { query } from './db';
import { EVENT_CONFIG } from '@/config';

const IP_SALT = process.env.IP_SALT || 'constructecnia-adeic-pucp-2026-salt';

/**
 * Extrae la dirección IP del cliente a partir de los encabezados HTTP de la solicitud (Next.js / Vercel).
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // Si hay proxies en cadena, la primera IP es la del cliente original
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Genera un hash criptográfico SHA-256 de la IP con salt para preservar la privacidad de los asistentes.
 */
export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(`${ip}:${IP_SALT}`).digest('hex');
}

/**
 * Verifica y aplica el límite de frecuencia genérico en PostgreSQL (Serverless / Vercel).
 * Utiliza INSERT ... ON CONFLICT DO UPDATE para ser 100% atómico y seguro ante concurrencia.
 * Limpieza oportunista de registros con más de 60 minutos para optimizar almacenamiento.
 */
export async function checkRateLimit(
  clave: string,
  accion: string,
  maxAllowed: number
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const currentMinute = Math.floor(Date.now() / 60000);

  // Limpieza oportunista en segundo plano (2% de las peticiones) de filas antiguas
  if (Math.random() < 0.02) {
    query(`DELETE FROM rate_limits WHERE minuto_epoch < $1;`, [currentMinute - 60]).catch((err) => {
      console.warn('[RateLimit Cleanup Warning]', err);
    });
  }

  try {
    const res = await query<{ contador: number }>(
      `
      INSERT INTO rate_limits (clave, accion, minuto_epoch, contador)
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (clave, accion, minuto_epoch)
      DO UPDATE SET contador = rate_limits.contador + 1
      RETURNING contador;
      `,
      [clave, accion, currentMinute]
    );

    const count = res.rows[0]?.contador || 1;
    return {
      allowed: count <= maxAllowed,
      count,
      limit: maxAllowed,
    };
  } catch (error) {
    // Si la tabla aún no se ha migrado de ip_hash a clave, intentar con ip_hash como fallback
    try {
      const fallbackRes = await query<{ contador: number }>(
        `
        INSERT INTO rate_limits (ip_hash, accion, minuto_epoch, contador)
        VALUES ($1, $2, $3, 1)
        ON CONFLICT (ip_hash, accion, minuto_epoch)
        DO UPDATE SET contador = rate_limits.contador + 1
        RETURNING contador;
        `,
        [clave.slice(0, 64), accion, currentMinute]
      );
      const count = fallbackRes.rows[0]?.contador || 1;
      return { allowed: count <= maxAllowed, count, limit: maxAllowed };
    } catch {
      console.warn('[RateLimit Warning] No se pudo verificar rate_limits en BD, permitiendo:', error);
      return { allowed: true, count: 1, limit: maxAllowed };
    }
  }
}

/**
 * Límite por IP para el registro de asistencias (1000 por minuto por IP).
 * Permite que cientos de celulares compartan la misma IP pública (Wifi PUCP / antena móvil).
 */
export async function checkAttendanceIpRateLimit(
  ipHash: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  return checkRateLimit(
    ipHash,
    'asistencia_ip',
    EVENT_CONFIG.seguridad.maxAsistenciasPorMinutoPorIp
  );
}

/**
 * Límite por Correo Electrónico para registro de asistencia (máx. 5 intentos por minuto por correo).
 * Frena abusos o scripts repetitivos con el mismo correo, incluso compartiendo IP.
 */
export async function checkAttendanceEmailRateLimit(
  correo: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const correoKey = correo.trim().toLowerCase();
  return checkRateLimit(
    correoKey,
    'asistencia_correo',
    EVENT_CONFIG.seguridad.maxAsistenciasPorMinutoPorCorreo
  );
}

/**
 * Límite por IP para consultar la ponencia abierta (1000 solicitudes por minuto por IP).
 * Garantiza que el polling automático de los celulares no se bloquee durante el evento.
 */
export async function checkActivaIpRateLimit(
  ipHash: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  return checkRateLimit(
    ipHash,
    'consulta_activa_ip',
    EVENT_CONFIG.seguridad.maxConsultasActivaPorMinutoPorIp
  );
}

// Alias de retrocompatibilidad
export const checkAttendanceRateLimit = checkAttendanceIpRateLimit;

/**
 * Verifica si la IP del staff está temporalmente bloqueada por exceso de intentos fallidos.
 */
export async function checkAdminLoginRateLimit(ipHash: string): Promise<{
  blocked: boolean;
  remainingAttempts: number;
  blockMinutesRemaining?: number;
}> {
  const maxAttempts = EVENT_CONFIG.seguridad.maxIntentosLoginStaff;

  try {
    const res = await query<{
      intentos: number;
      bloqueado_hasta: Date | null;
      ahora: Date;
    }>(
      `
      SELECT intentos, bloqueado_hasta, NOW() as ahora
      FROM admin_intentos_login
      WHERE ip_hash = $1;
      `,
      [ipHash]
    );

    if (res.rows.length === 0) {
      return { blocked: false, remainingAttempts: maxAttempts };
    }

    const row = res.rows[0];
    const ahora = new Date(row.ahora).getTime();
    const bloqueadoHasta = row.bloqueado_hasta ? new Date(row.bloqueado_hasta).getTime() : null;

    if (bloqueadoHasta && bloqueadoHasta > ahora) {
      const minutesRemaining = Math.ceil((bloqueadoHasta - ahora) / (1000 * 60));
      return {
        blocked: true,
        remainingAttempts: 0,
        blockMinutesRemaining: Math.max(1, minutesRemaining),
      };
    }

    // Si ya expiró el bloqueo, restablecer automáticamente
    if (bloqueadoHasta && bloqueadoHasta <= ahora) {
      await resetAdminLoginAttempts(ipHash);
      return { blocked: false, remainingAttempts: maxAttempts };
    }

    const remaining = Math.max(0, maxAttempts - row.intentos);
    return { blocked: false, remainingAttempts: remaining };
  } catch (error) {
    console.warn('[AdminRateLimit Warning] Falló chequeo de login attempts:', error);
    return { blocked: false, remainingAttempts: maxAttempts };
  }
}

/**
 * Registra un intento fallido de login de staff. Si supera el límite (5), bloquea por 10 minutos.
 */
export async function recordFailedAdminLogin(ipHash: string): Promise<{
  blockedNow: boolean;
  remainingAttempts: number;
}> {
  const maxAttempts = EVENT_CONFIG.seguridad.maxIntentosLoginStaff;
  const blockMinutes = EVENT_CONFIG.seguridad.minutosBloqueoLoginStaff;

  try {
    const res = await query<{ intentos: number }>(
      `
      INSERT INTO admin_intentos_login (ip_hash, intentos, ultimo_intento)
      VALUES ($1, 1, NOW())
      ON CONFLICT (ip_hash)
      DO UPDATE SET 
        intentos = admin_intentos_login.intentos + 1,
        ultimo_intento = NOW(),
        bloqueado_hasta = CASE 
          WHEN admin_intentos_login.intentos + 1 >= $2 
          THEN NOW() + ($3 || ' minutes')::INTERVAL
          ELSE admin_intentos_login.bloqueado_hasta
        END
      RETURNING intentos;
      `,
      [ipHash, maxAttempts, blockMinutes]
    );

    const attempts = res.rows[0]?.intentos || 1;
    const blockedNow = attempts >= maxAttempts;
    return {
      blockedNow,
      remainingAttempts: Math.max(0, maxAttempts - attempts),
    };
  } catch (error) {
    console.error('[AdminRateLimit Error] Error al registrar intento fallido:', error);
    return { blockedNow: false, remainingAttempts: 1 };
  }
}

/**
 * Restablece los intentos fallidos al iniciar sesión exitosamente.
 */
export async function resetAdminLoginAttempts(ipHash: string): Promise<void> {
  try {
    await query(`DELETE FROM admin_intentos_login WHERE ip_hash = $1;`, [ipHash]);
  } catch (error) {
    console.warn('[AdminRateLimit Error] Error al resetear intentos:', error);
  }
}
