import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'constructecnia_staff_token';

function getSessionSecret(): string {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      'La variable de entorno ADMIN_PASSWORD no está definida. Es obligatoria para la seguridad del panel de staff.'
    );
  }
  // Derivar clave de firma segura a partir de la contraseña del entorno
  return crypto.createHash('sha256').update(`staff-session-salt:${adminPassword}`).digest('hex');
}

export interface SessionPayload {
  role: 'staff';
  iat: number;
  exp: number;
}

/**
 * Genera un token HMAC firmado para la sesión del staff (duración: 24 horas).
 */
export function createStaffSessionToken(): string {
  const secret = getSessionSecret();
  const now = Date.now();
  const payload: SessionPayload = {
    role: 'staff',
    iat: now,
    exp: now + 24 * 60 * 60 * 1000, // 24 horas
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Valida de forma estricta y con comparación segura en tiempo constante el token del staff.
 */
export function verifyStaffSessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;

  try {
    const secret = getSessionSecret();
    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return false;
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(payloadJson);

    if (payload.role !== 'staff') return false;
    if (Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica si la petición entrante en el servidor tiene una sesión válida de staff.
 */
export async function isAuthenticatedStaff(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyStaffSessionToken(token);
}

/**
 * Valida la contraseña proporcionada contra la variable de entorno ADMIN_PASSWORD
 * utilizando comparación en tiempo constante para evitar ataques de timing.
 */
export function verifyAdminPassword(passwordAttempt: string): boolean {
  const correctPassword = process.env.ADMIN_PASSWORD;
  if (!correctPassword) {
    console.error('[Auth Error] ADMIN_PASSWORD no está configurada en las variables de entorno.');
    return false;
  }

  const attemptBuf = Buffer.from(passwordAttempt);
  const correctBuf = Buffer.from(correctPassword);

  if (attemptBuf.length !== correctBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(attemptBuf, correctBuf);
}
