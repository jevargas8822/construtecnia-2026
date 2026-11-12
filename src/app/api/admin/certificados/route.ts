import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticatedStaff } from '@/lib/auth';
import { EVENT_CONFIG } from '@/config';
import { formatLimaDateTime } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedStaff();
  if (!isAuth) {
    return NextResponse.json({ error: 'No autorizado. Inicie sesión de staff.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const soloAptos = searchParams.get('soloAptos') === 'true';
    const soloInscritos = searchParams.get('soloInscritos') === 'true';
    const busqueda = searchParams.get('q')?.trim() || '';
    const minPonencias = EVENT_CONFIG.minimoPonenciasParaCertificado || 4;

    // Verificar si la tabla de inscritos tiene datos cargados
    const inscritosCountRes = await query<{ count: string }>(`SELECT COUNT(*) FROM inscritos;`);
    const tieneInscritosCargados = parseInt(inscritosCountRes.rows[0]?.count || '0', 10) > 0;

    const sql = `
      SELECT 
        a.correo,
        a.documento,
        a.tipo_id,
        COUNT(DISTINCT a.ponencia_id)::int AS total_ponencias,
        array_agg(DISTINCT p.orden ORDER BY p.orden) AS ponencias_asistidas,
        MIN(a.registrado_en) AS primera_asistencia,
        MAX(a.registrado_en) AS ultima_asistencia,
        CASE WHEN COUNT(DISTINCT a.ponencia_id) >= $1 THEN true ELSE false END AS apto_certificado,
        CASE WHEN i.id IS NOT NULL THEN true ELSE false END AS es_inscrito,
        i.nombres AS nombre_inscrito
      FROM asistencias a
      INNER JOIN ponencias p ON a.ponencia_id = p.id
      LEFT JOIN inscritos i ON LOWER(a.correo) = LOWER(i.correo)
      GROUP BY a.correo, a.documento, a.tipo_id, i.id, i.nombres
      ORDER BY total_ponencias DESC, a.correo ASC;
    `;

    const res = await query(sql, [minPonencias]);
    let asistentes = res.rows;

    // Filtrar en memoria por búsqueda si existe
    if (busqueda) {
      const qLower = busqueda.toLowerCase();
      asistentes = asistentes.filter(
        (a) =>
          a.correo.toLowerCase().includes(qLower) ||
          a.documento.toLowerCase().includes(qLower) ||
          (a.nombre_inscrito && a.nombre_inscrito.toLowerCase().includes(qLower))
      );
    }

    // Filtrar por aptos si se solicitó
    if (soloAptos) {
      asistentes = asistentes.filter((a) => a.total_ponencias >= minPonencias);
    }

    // Filtrar por inscritos si se solicitó
    if (soloInscritos) {
      asistentes = asistentes.filter((a) => a.es_inscrito);
    }

    // Estadísticas
    const totalAsistentesUnicos = res.rows.length;
    const totalAptosCertificado = res.rows.filter((a) => a.total_ponencias >= minPonencias).length;
    const totalInscritosCruzados = res.rows.filter((a) => a.es_inscrito).length;

    const asistentesFormateados = asistentes.map((a) => ({
      ...a,
      primera_asistencia_lima: formatLimaDateTime(a.primera_asistencia),
      ultima_asistencia_lima: formatLimaDateTime(a.ultima_asistencia),
    }));

    return NextResponse.json({
      asistentes: asistentesFormateados,
      totalAsistentesUnicos,
      totalAptosCertificado,
      totalInscritosCruzados,
      tieneInscritosCargados,
      minPonenciasRequeridas: minPonencias,
    });
  } catch (error) {
    console.error('Error al generar reporte de certificados:', error);
    return NextResponse.json(
      { error: 'Error al consultar datos de certificación.' },
      { status: 500 }
    );
  }
}
