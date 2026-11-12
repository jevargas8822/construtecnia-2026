import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, hashIp, checkAdminLoginRateLimit, recordFailedAdminLogin, resetAdminLoginAttempts } from '@/lib/security';
import { verifyAdminPassword, createStaffSessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);
    const ipHash = hashIp(clientIp);

    // 1. Verificar bloqueo por fuerza bruta (máximo 5 intentos por 10 minutos)
    const rateCheck = await checkAdminLoginRateLimit(ipHash);
    if (rateCheck.blocked) {
      return NextResponse.json(
        {
          error: `Acceso bloqueado por seguridad tras múltiples intentos fallidos. Por favor espera ${rateCheck.blockMinutesRemaining} minuto(s) antes de intentar nuevamente.`,
          blocked: true,
        },
        { status: 429 }
      );
    }

    // 2. Extraer contraseña del cuerpo
    let body: { password?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Datos de autenticación inválidos.' },
        { status: 400 }
      );
    }

    const { password } = body;
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Por favor ingresa la contraseña del staff.' },
        { status: 400 }
      );
    }

    // 3. Verificar contraseña contra ADMIN_PASSWORD
    const isCorrect = verifyAdminPassword(password);

    if (!isCorrect) {
      const record = await recordFailedAdminLogin(ipHash);
      if (record.blockedNow) {
        return NextResponse.json(
          {
            error:
              'Demasiados intentos incorrectos. El acceso desde tu dirección IP ha sido bloqueado por 10 minutos.',
            blocked: true,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          error: `Contraseña incorrecta. Te quedan ${record.remainingAttempts} intento(s) antes del bloqueo temporal.`,
          remainingAttempts: record.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 4. Si la contraseña es correcta, reiniciar contador de fallos
    await resetAdminLoginAttempts(ipHash);

    // 5. Crear token de sesión firmado y establecer cookie httpOnly
    const sessionToken = createStaffSessionToken();
    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      success: true,
      mensaje: 'Autenticación exitosa como Staff ADEIC.',
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return response;
  } catch (error) {
    console.error('Error en /api/admin/login:', error);
    return NextResponse.json(
      { error: 'Error del servidor al procesar la autenticación.' },
      { status: 500 }
    );
  }
}
