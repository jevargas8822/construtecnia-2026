import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticatedStaff } from '@/lib/auth';
import { formatLimaDateTime } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedStaff();
  if (!isAuth) {
    return NextResponse.json({ error: 'No autorizado. Inicie sesión de staff.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const busqueda = searchParams.get('q')?.trim() || '';
    const ponenciaId = searchParams.get('ponenciaId');
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 1000);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (busqueda) {
      conditions.push(`(a.correo ILIKE $${paramIndex} OR a.documento ILIKE $${paramIndex})`);
      params.push(`%${busqueda}%`);
      paramIndex++;
    }

    if (ponenciaId && !isNaN(Number(ponenciaId))) {
      conditions.push(`a.ponencia_id = $${paramIndex}`);
      params.push(Number(ponenciaId));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        a.id,
        a.correo,
        a.tipo_id,
        a.documento,
        a.ponencia_id,
        a.registrado_en,
        p.nombre AS ponencia_nombre,
        p.orden AS ponencia_orden,
        CASE WHEN i.id IS NOT NULL THEN true ELSE false END AS es_inscrito
      FROM asistencias a
      INNER JOIN ponencias p ON a.ponencia_id = p.id
      LEFT JOIN inscritos i ON LOWER(a.correo) = LOWER(i.correo)
      ${whereClause}
      ORDER BY a.registrado_en DESC
      LIMIT $${paramIndex};
    `;

    params.push(limit);

    const res = await query(sql, params);

    // Contar total general
    const totalCountRes = await query<{ count: string }>(`SELECT COUNT(*) FROM asistencias;`);
    const totalRegistros = parseInt(totalCountRes.rows[0]?.count || '0', 10);

    const asistenciasFormateadas = res.rows.map((row) => ({
      ...row,
      registrado_en_lima: formatLimaDateTime(row.registrado_en),
    }));

    return NextResponse.json({
      asistencias: asistenciasFormateadas,
      totalRegistros,
      encontrados: asistenciasFormateadas.length,
    });
  } catch (error) {
    console.error('Error al consultar asistencias:', error);
    return NextResponse.json(
      { error: 'Error al consultar la lista de asistencias.' },
      { status: 500 }
    );
  }
}
