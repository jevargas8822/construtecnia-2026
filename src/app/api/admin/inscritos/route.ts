import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticatedStaff } from '@/lib/auth';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isAuth = await isAuthenticatedStaff();
  if (!isAuth) {
    return NextResponse.json({ error: 'No autorizado. Inicie sesión de staff.' }, { status: 401 });
  }

  try {
    const res = await query<{ count: string }>(`SELECT COUNT(*) FROM inscritos;`);
    const totalInscritos = parseInt(res.rows[0]?.count || '0', 10);

    const matchRes = await query<{ count: string }>(`
      SELECT COUNT(DISTINCT a.correo) 
      FROM asistencias a
      INNER JOIN inscritos i ON LOWER(a.correo) = LOWER(i.correo);
    `);
    const totalCruzados = parseInt(matchRes.rows[0]?.count || '0', 10);

    return NextResponse.json({
      totalInscritos,
      totalCruzados,
      tieneInscritos: totalInscritos > 0,
    });
  } catch (error) {
    console.error('Error al consultar inscritos:', error);
    return NextResponse.json(
      { error: 'Error al consultar inscritos.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedStaff();
  if (!isAuth) {
    return NextResponse.json({ error: 'No autorizado. Inicie sesión de staff.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo CSV.' }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json(
        { error: 'El archivo CSV tiene un formato inválido o está vacío.' },
        { status: 400 }
      );
    }

    let insertados = 0;
    const filas = parsed.data as Record<string, unknown>[];

    for (const fila of filas) {
      // Buscar campo correo (puede venir como 'correo', 'email', 'Correo', 'Email', etc.)
      const correoKey = Object.keys(fila).find((k) =>
        ['correo', 'email', 'e-mail', 'mail'].includes(k.trim().toLowerCase())
      );

      const nombresKey = Object.keys(fila).find((k) =>
        ['nombres', 'nombre', 'name', 'asistente', 'completo'].includes(k.trim().toLowerCase())
      );

      const docKey = Object.keys(fila).find((k) =>
        ['documento', 'dni', 'codigo', 'código', 'id'].includes(k.trim().toLowerCase())
      );

      const correo = correoKey ? String(fila[correoKey]).trim().toLowerCase() : '';
      const nombres = nombresKey ? String(fila[nombresKey]).trim() : '';
      const documento = docKey ? String(fila[docKey]).trim() : '';

      if (correo && correo.includes('@')) {
        await query(
          `
          INSERT INTO inscritos (correo, nombres, documento)
          VALUES ($1, $2, $3)
          ON CONFLICT (correo) DO UPDATE
          SET nombres = COALESCE(EXCLUDED.nombres, inscritos.nombres),
              documento = COALESCE(EXCLUDED.documento, inscritos.documento);
          `,
          [correo, nombres || null, documento || null]
        );
        insertados++;
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: `Se procesaron e importaron con éxito ${insertados} inscritos de la lista oficial.`,
      insertados,
    });
  } catch (error) {
    console.error('Error al importar inscritos desde CSV:', error);
    return NextResponse.json(
      { error: 'Error del servidor al procesar el archivo CSV.' },
      { status: 500 }
    );
  }
}
