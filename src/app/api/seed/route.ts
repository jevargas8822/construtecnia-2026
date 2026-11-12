import { NextResponse } from 'next/server';
import { ensureDatabaseInitialized } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDatabaseInitialized();
    return NextResponse.json({
      success: true,
      mensaje: 'Base de datos inicializada correctamente con las 8 ponencias oficiales de Constructecnia 2026.',
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al inicializar la base de datos vía /api/seed:', error);
    return NextResponse.json(
      { error: 'Error al inicializar la base de datos.', detalle: err?.message },
      { status: 500 }
    );
  }
}
