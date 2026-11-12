import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticatedStaff } from '@/lib/auth';
import { EVENT_CONFIG } from '@/config';
import { formatLimaDateTime } from '@/lib/date-utils';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedStaff();
  if (!isAuth) {
    return NextResponse.json({ error: 'No autorizado. Inicie sesión de staff.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo'); // 'asistencias' | 'certificados_todos' | 'certificados_aptos'
    const minPonencias = EVENT_CONFIG.minimoPonenciasParaCertificado || 4;

    let csvData: Record<string, unknown>[] = [];
    let filename = `constructecnia-2026-${tipo || 'reporte'}.csv`;

    if (tipo === 'asistencias') {
      filename = `constructecnia-2026-asistencias-todas-${new Date().toISOString().slice(0, 10)}.csv`;
      const res = await query(`
        SELECT 
          a.id,
          a.correo,
          CASE WHEN a.tipo_id = 'alumno_pucp' THEN 'Alumno PUCP' ELSE 'Externo' END AS tipo_identificacion,
          a.documento,
          p.orden AS orden_ponencia,
          p.nombre AS nombre_ponencia,
          p.dia AS dia_evento,
          a.registrado_en,
          CASE WHEN i.id IS NOT NULL THEN 'Sí' ELSE 'No' END AS inscrito_en_passline
        FROM asistencias a
        INNER JOIN ponencias p ON a.ponencia_id = p.id
        LEFT JOIN inscritos i ON LOWER(a.correo) = LOWER(i.correo)
        ORDER BY a.registrado_en ASC;
      `);

      csvData = res.rows.map((r) => ({
        ID: r.id,
        'Correo Electrónico': r.correo,
        'Tipo Asistente': r.tipo_identificacion,
        'Documento / Código': `="${r.documento}"`, // Prevenir pérdida de ceros a la izquierda en Excel
        'Día': r.dia_evento,
        'N° Ponencia': r.orden_ponencia,
        'Título de Ponencia': r.nombre_ponencia,
        'Fecha y Hora (Lima)': formatLimaDateTime(r.registrado_en),
        'Inscrito en Passline': r.inscrito_en_passline,
      }));
    } else if (tipo === 'certificados_aptos' || tipo === 'certificados_todos') {
      const soloAptos = tipo === 'certificados_aptos';
      filename = soloAptos
        ? `constructecnia-2026-aptos-certificado-min${minPonencias}-${new Date().toISOString().slice(0, 10)}.csv`
        : `constructecnia-2026-asistentes-consolidados-${new Date().toISOString().slice(0, 10)}.csv`;

      const res = await query(`
        SELECT 
          a.correo,
          a.documento,
          CASE WHEN a.tipo_id = 'alumno_pucp' THEN 'Alumno PUCP' ELSE 'Externo' END AS tipo_identificacion,
          COUNT(DISTINCT a.ponencia_id)::int AS total_ponencias,
          string_agg(DISTINCT p.orden::text, ', ' ORDER BY p.orden::text) AS ponencias_asistidas,
          MIN(a.registrado_en) AS primera_asistencia,
          MAX(a.registrado_en) AS ultima_asistencia,
          CASE WHEN i.id IS NOT NULL THEN 'Sí' ELSE 'No' END AS inscrito_en_passline,
          i.nombres AS nombres_passline
        FROM asistencias a
        INNER JOIN ponencias p ON a.ponencia_id = p.id
        LEFT JOIN inscritos i ON LOWER(a.correo) = LOWER(i.correo)
        GROUP BY a.correo, a.documento, a.tipo_id, i.id, i.nombres
        ORDER BY total_ponencias DESC, a.correo ASC;
      `);

      let rows = res.rows;
      if (soloAptos) {
        rows = rows.filter((r) => r.total_ponencias >= minPonencias);
      }

      csvData = rows.map((r, index) => ({
        'N°': index + 1,
        'Correo Electrónico': r.correo,
        'Tipo Asistente': r.tipo_identificacion,
        'Documento / Código': `="${r.documento}"`,
        'Ponencias Asistidas (Total)': r.total_ponencias,
        'Nros de Ponencia Asistidas': r.ponencias_asistidas,
        '¿Apto para Certificado?': r.total_ponencias >= minPonencias ? 'SÍ (Apto)' : 'NO',
        'Inscrito en Passline': r.inscrito_en_passline,
        'Nombre Registrado (Passline)': r.nombres_passline || '-',
        'Primera Asistencia (Lima)': formatLimaDateTime(r.primera_asistencia),
        'Última Asistencia (Lima)': formatLimaDateTime(r.ultima_asistencia),
      }));
    } else {
      return NextResponse.json({ error: 'Tipo de exportación no soportado.' }, { status: 400 });
    }

    // Convertir a CSV con encabezados
    const csvContent = Papa.unparse(csvData, {
      quotes: true,
      delimiter: ',',
    });

    // Agregar BOM UTF-8 (\uFEFF) para que Excel en Windows reconozca caracteres en español automáticamente
    const csvWithBom = '\uFEFF' + csvContent;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    return NextResponse.json(
      { error: 'Error del servidor al generar la exportación CSV.' },
      { status: 500 }
    );
  }
}
