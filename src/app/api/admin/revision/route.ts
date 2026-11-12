import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticatedStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isAuth = await isAuthenticatedStaff();
  if (!isAuth) {
    return NextResponse.json({ error: 'No autorizado. Inicie sesión de staff.' }, { status: 401 });
  }

  try {
    // 1. Documentos asociados a más de un correo electrónico
    const docRes = await query<{
      documento: string;
      correos: string[];
      total_correos: number;
      total_registros: number;
    }>(`
      SELECT 
        a.documento,
        array_agg(DISTINCT a.correo) AS correos,
        COUNT(DISTINCT a.correo)::int AS total_correos,
        COUNT(a.id)::int AS total_registros
      FROM asistencias a
      GROUP BY a.documento
      HAVING COUNT(DISTINCT a.correo) > 1
      ORDER BY total_correos DESC;
    `);

    // 2. Correos electrónicos asociados a más de un documento
    const emailRes = await query<{
      correo: string;
      documentos: string[];
      total_documentos: number;
      total_registros: number;
    }>(`
      SELECT 
        a.correo,
        array_agg(DISTINCT a.documento) AS documentos,
        COUNT(DISTINCT a.documento)::int AS total_documentos,
        COUNT(a.id)::int AS total_registros
      FROM asistencias a
      GROUP BY a.correo
      HAVING COUNT(DISTINCT a.documento) > 1
      ORDER BY total_documentos DESC;
    `);

    // 3. IPs que registraron un volumen inusual de asistentes distintos (posible registro masivo por terceros)
    const ipRes = await query<{
      ip_hash: string;
      total_correos: number;
      total_registros: number;
      correos_muestra: string[];
    }>(`
      SELECT 
        a.ip_hash,
        COUNT(DISTINCT a.correo)::int AS total_correos,
        COUNT(a.id)::int AS total_registros,
        (array_agg(DISTINCT a.correo))[1:5] AS correos_muestra
      FROM asistencias a
      GROUP BY a.ip_hash
      HAVING COUNT(DISTINCT a.correo) >= 4
      ORDER BY total_correos DESC
      LIMIT 20;
    `);

    const totalCasosSospechosos = docRes.rows.length + emailRes.rows.length + ipRes.rows.length;

    return NextResponse.json({
      totalCasosSospechosos,
      documentosConMultiplesCorreos: docRes.rows,
      correosConMultiplesDocumentos: emailRes.rows,
      ipsConMultiplesAsistentes: ipRes.rows,
    });
  } catch (error) {
    console.error('Error al consultar revisión de seguridad:', error);
    return NextResponse.json(
      { error: 'Error al consultar casos para revisión de seguridad.' },
      { status: 500 }
    );
  }
}
