import { NextRequest, NextResponse } from 'next/server';
import { query, ensureDatabaseInitialized } from '@/lib/db';
import { getClientIp, hashIp, checkActivaIpRateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Control de frecuencia por IP (1000 consultas por minuto por IP)
    const clientIp = getClientIp(req.headers);
    const ipHash = hashIp(clientIp);

    const rateLimit = await checkActivaIpRateLimit(ipHash);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Has superado el límite de consultas permitidas. Por favor espera un momento.' },
        { status: 429 }
      );
    }

    // Intentar consultar la ponencia activa
    let res = await query<{
      id: number;
      orden: number;
      dia: number;
      fecha: string;
      nombre: string;
      expositor: string | null;
      descripcion: string | null;
      estado: string;
      abierta_en: Date | null;
    }>(
      `
      SELECT id, orden, dia, fecha, nombre, expositor, descripcion, estado, abierta_en
      FROM ponencias
      WHERE estado = 'abierta'
      LIMIT 1;
      `
    );

    // Si por alguna razón la BD aún no ha sido inicializada, la auto-inicializamos y volvemos a consultar
    if (!res) {
      await ensureDatabaseInitialized();
      res = await query(
        `SELECT id, orden, dia, fecha, nombre, expositor, descripcion, estado, abierta_en FROM ponencias WHERE estado = 'abierta' LIMIT 1;`
      );
    }

    const ponenciaActiva = res.rows[0] || null;

    return NextResponse.json({
      hayPonenciaAbierta: !!ponenciaActiva,
      ponencia: ponenciaActiva,
    });
  } catch (error: unknown) {
    const dbErr = error as { code?: string };
    // Si la tabla no existe aún, intentar inicializarla silenciosamente
    if (dbErr?.code === '42P01') {
      try {
        await ensureDatabaseInitialized();
        return NextResponse.json({
          hayPonenciaAbierta: false,
          ponencia: null,
        });
      } catch (initErr) {
        console.error('Error al auto-inicializar base de datos:', initErr);
      }
    }

    console.error('Error en /api/asistencia/activa:', error);
    return NextResponse.json(
      { error: 'No se pudo consultar el estado de las ponencias.' },
      { status: 500 }
    );
  }
}
