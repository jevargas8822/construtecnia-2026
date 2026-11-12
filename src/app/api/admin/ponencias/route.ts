import { NextRequest, NextResponse } from 'next/server';
import { query, ensureDatabaseInitialized } from '@/lib/db';
import { isAuthenticatedStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export interface PonenciaAdminRow {
  id: number;
  orden: number;
  dia: number;
  fecha: string;
  nombre: string;
  expositor: string | null;
  descripcion: string | null;
  estado: 'cerrada' | 'abierta' | 'finalizada';
  abierta_en: Date | null;
  cerrada_en: Date | null;
  total_asistentes: number;
}

/**
 * GET: Obtiene las 8 ponencias con sus estados actuales y conteo en tiempo real de asistentes.
 */
export async function GET() {
  const isAuth = await isAuthenticatedStaff();
  if (!isAuth) {
    return NextResponse.json({ error: 'No autorizado. Inicie sesión de staff.' }, { status: 401 });
  }

  try {
    let res = await query<PonenciaAdminRow>(`
      SELECT 
        p.id,
        p.orden,
        p.dia,
        p.fecha,
        p.nombre,
        p.expositor,
        p.descripcion,
        p.estado,
        p.abierta_en,
        p.cerrada_en,
        COUNT(a.id)::int AS total_asistentes
      FROM ponencias p
      LEFT JOIN asistencias a ON p.id = a.ponencia_id
      GROUP BY p.id
      ORDER BY p.orden ASC;
    `);

    if (res.rows.length === 0) {
      await ensureDatabaseInitialized();
      res = await query<PonenciaAdminRow>(`
        SELECT 
          p.id,
          p.orden,
          p.dia,
          p.fecha,
          p.nombre,
          p.expositor,
          p.descripcion,
          p.estado,
          p.abierta_en,
          p.cerrada_en,
          COUNT(a.id)::int AS total_asistentes
        FROM ponencias p
        LEFT JOIN asistencias a ON p.id = a.ponencia_id
        GROUP BY p.id
        ORDER BY p.orden ASC;
      `);
    }

    const ponencias = res.rows;
    const ponenciaAbierta = ponencias.find((p) => p.estado === 'abierta') || null;
    const totalAsistenciasRegistradas = ponencias.reduce((acc, p) => acc + (p.total_asistentes || 0), 0);

    return NextResponse.json({
      ponencias,
      ponenciaAbierta,
      totalAsistenciasRegistradas,
    });
  } catch (error) {
    console.error('Error al listar ponencias en admin:', error);
    return NextResponse.json(
      { error: 'Error al consultar las ponencias.' },
      { status: 500 }
    );
  }
}

/**
 * POST: Abre o cierra una ponencia.
 * Al abrir una ponencia, cualquier otra abierta se cierra atómicamente.
 */
export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedStaff();
  if (!isAuth) {
    return NextResponse.json({ error: 'No autorizado. Inicie sesión de staff.' }, { status: 401 });
  }

  try {
    const { ponenciaId, accion } = await req.json();

    if (!ponenciaId || (accion !== 'abrir' && accion !== 'cerrar')) {
      return NextResponse.json(
        { error: 'Parámetros inválidos. Debe enviar ponenciaId y accion ("abrir" | "cerrar").' },
        { status: 400 }
      );
    }

    if (accion === 'abrir') {
      // 1. Cerrar cualquier otra ponencia que estuviera abierta
      await query(`
        UPDATE ponencias
        SET estado = 'cerrada', cerrada_en = COALESCE(cerrada_en, NOW())
        WHERE estado = 'abierta' AND id != $1;
      `, [ponenciaId]);

      // 2. Abrir la ponencia solicitada (o reabrirla si fue cerrada por error)
      const res = await query(`
        UPDATE ponencias
        SET estado = 'abierta', abierta_en = COALESCE(abierta_en, NOW()), cerrada_en = NULL
        WHERE id = $1
        RETURNING *;
      `, [ponenciaId]);

      if (res.rowCount === 0) {
        return NextResponse.json({ error: 'Ponencia no encontrada.' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        mensaje: `Ponencia "${res.rows[0].nombre}" abierta exitosamente.`,
        ponencia: res.rows[0],
      });
    } else {
      // Cerrar la ponencia indicada
      const res = await query(`
        UPDATE ponencias
        SET estado = 'cerrada', cerrada_en = NOW()
        WHERE id = $1
        RETURNING *;
      `, [ponenciaId]);

      if (res.rowCount === 0) {
        return NextResponse.json({ error: 'Ponencia no encontrada.' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        mensaje: `Ponencia "${res.rows[0].nombre}" cerrada.`,
        ponencia: res.rows[0],
      });
    }
  } catch (error) {
    console.error('Error al cambiar estado de ponencia:', error);
    return NextResponse.json(
      { error: 'Error del servidor al cambiar el estado de la ponencia.' },
      { status: 500 }
    );
  }
}
