import { NextRequest, NextResponse } from 'next/server';
import { query, ensureDatabaseInitialized } from '@/lib/db';
import { EVENT_CONFIG } from '@/config';
import {
  getClientIp,
  hashIp,
  checkAttendanceIpRateLimit,
  checkAttendanceEmailRateLimit,
} from '@/lib/security';
import { formatLimaDateTime } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Detección y Rate Limiting por IP (1000 solicitudes por minuto por IP)
    const clientIp = getClientIp(req.headers);
    const ipHash = hashIp(clientIp);

    const ipRateLimit = await checkAttendanceIpRateLimit(ipHash);
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            'Has realizado demasiadas solicitudes en poco tiempo. Por favor espera un minuto antes de reintentar.',
        },
        { status: 429 }
      );
    }

    // 2. Extracción y parseo seguro del cuerpo JSON
    let body: { correo?: unknown; tipo_id?: unknown; documento?: unknown; consentimiento?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'El formato de los datos enviados no es válido.' },
        { status: 400 }
      );
    }

    const { correo, tipo_id, documento, consentimiento } = body;

    // 3. Validación estricta en el SERVIDOR

    // A) Consentimiento obligatorio
    if (consentimiento !== true) {
      return NextResponse.json(
        {
          error:
            'Debes aceptar el consentimiento de uso de datos para poder registrar tu asistencia y emitir tu certificado.',
        },
        { status: 400 }
      );
    }

    // B) Correo electrónico (formato y normalización a minúsculas)
    if (!correo || typeof correo !== 'string') {
      return NextResponse.json(
        { error: 'El correo electrónico es obligatorio.' },
        { status: 400 }
      );
    }
    const correoNormalizado = correo.trim().toLowerCase();
    if (!EVENT_CONFIG.validacion.correo.regex.test(correoNormalizado)) {
      return NextResponse.json(
        { error: EVENT_CONFIG.validacion.correo.errorMensaje },
        { status: 400 }
      );
    }

    // Límite adicional por correo electrónico (máx. 5 intentos por minuto por correo)
    const emailRateLimit = await checkAttendanceEmailRateLimit(correoNormalizado);
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            'Has intentado registrar demasiadas asistencias con este correo en poco tiempo. Por favor espera un minuto antes de reintentar.',
        },
        { status: 429 }
      );
    }

    // C) Tipo de identificación
    if (tipo_id !== 'alumno_pucp' && tipo_id !== 'externo') {
      return NextResponse.json(
        { error: 'Selecciona si eres alumno PUCP o asistente externo.' },
        { status: 400 }
      );
    }

    // D) Documento / Código
    if (!documento || typeof documento !== 'string') {
      return NextResponse.json(
        { error: 'El código de alumno o documento de identidad es obligatorio.' },
        { status: 400 }
      );
    }
    const docLimpio = documento.trim().replace(/\s+/g, '');
    const configValidacion =
      tipo_id === 'alumno_pucp'
        ? EVENT_CONFIG.validacion.alumnoPucp
        : EVENT_CONFIG.validacion.externo;

    if (!configValidacion.regex.test(docLimpio)) {
      return NextResponse.json(
        { error: configValidacion.errorMensaje },
        { status: 400 }
      );
    }

    // 4. Verificar qué ponencia está ABIERTA en este momento en la Base de Datos
    let ponenciaRes;
    try {
      ponenciaRes = await query<{ id: number; nombre: string; orden: number }>(
        `
        SELECT id, nombre, orden
        FROM ponencias
        WHERE estado = 'abierta'
        LIMIT 1;
        `
      );
    } catch (dbErr: unknown) {
      const err = dbErr as { code?: string };
      if (err?.code === '42P01') {
        await ensureDatabaseInitialized();
        ponenciaRes = await query<{ id: number; nombre: string; orden: number }>(
          `SELECT id, nombre, orden FROM ponencias WHERE estado = 'abierta' LIMIT 1;`
        );
      } else {
        throw dbErr;
      }
    }

    if (!ponenciaRes || ponenciaRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ahora no hay ninguna ponencia abierta para registrar asistencia' },
        { status: 400 }
      );
    }

    const ponenciaAbierta = ponenciaRes.rows[0];

    // 5. Inserción atómica en base de datos con manejo de duplicados
    try {
      const insertRes = await query<{ id: number; registrado_en: Date }>(
        `
        INSERT INTO asistencias (correo, tipo_id, documento, ponencia_id, ip_hash)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, registrado_en;
        `,
        [correoNormalizado, tipo_id, docLimpio, ponenciaAbierta.id, ipHash]
      );

      const fila = insertRes.rows[0];
      const fechaHoraFormateada = formatLimaDateTime(fila.registrado_en);

      return NextResponse.json({
        success: true,
        mensaje: `¡Asistencia registrada para ${ponenciaAbierta.nombre}!`,
        ponenciaNombre: ponenciaAbierta.nombre,
        ponenciaOrden: ponenciaAbierta.orden,
        correo: correoNormalizado,
        registradoEn: fechaHoraFormateada,
      });
    } catch (insertError: unknown) {
      const err = insertError as { code?: string };
      // Código PostgreSQL 23505 = unique_violation (violación de restricción uq_asistencias_correo_ponencia)
      if (err?.code === '23505') {
        return NextResponse.json(
          { error: 'Ya registraste tu asistencia en esta ponencia' },
          { status: 409 }
        );
      }
      throw insertError;
    }
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    return NextResponse.json(
      {
        error:
          'Ocurrió un inconveniente al procesar tu registro. Por favor vuelve a intentarlo en unos segundos.',
      },
      { status: 500 }
    );
  }
}
