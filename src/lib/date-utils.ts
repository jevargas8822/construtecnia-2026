import { EVENT_CONFIG } from '@/config';

const LIMA_TZ = EVENT_CONFIG.zonaHoraria || 'America/Lima';

/**
 * Formatea una fecha u objeto Date al formato de fecha y hora en Lima (ej. "23/11/2026, 09:35:10 am").
 */
export function formatLimaDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Formatea solo la hora en Lima (ej. "09:35 am").
 */
export function formatLimaTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Formatea solo la fecha en Lima (ej. "Lunes 23 de noviembre").
 */
export function formatLimaDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Formatea la fecha y horario de una ponencia para que sea legible en Lima (ej. "Lunes 23 nov · 4–5 PM").
 * Nunca produce cadenas crudas como "2026-11-23T00:00:00.000Z".
 */
export function formatPonenciaFechaHorario(
  fecha: Date | string | null | undefined,
  horario?: string | null,
  dia?: number
): string {
  let dateStr = '';
  if (typeof fecha === 'string') {
    dateStr = fecha.includes('T') ? fecha.split('T')[0] : fecha;
  } else if (fecha instanceof Date && !isNaN(fecha.getTime())) {
    dateStr = fecha.toISOString().split('T')[0];
  }

  let fechaTexto = '';
  if (dateStr === '2026-11-23' || dia === 1) {
    fechaTexto = 'Lunes 23 nov';
  } else if (dateStr === '2026-11-24' || dia === 2) {
    fechaTexto = 'Martes 24 nov';
  } else if (dateStr && dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (y && m && d) {
      const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      fechaTexto = new Intl.DateTimeFormat('es-PE', {
        timeZone: LIMA_TZ,
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      }).format(utcDate);
      fechaTexto = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
    }
  }

  if (!fechaTexto) {
    fechaTexto = dia ? `Día ${dia}` : '-';
  }

  if (horario) {
    return `${fechaTexto} · ${horario}`;
  }
  return fechaTexto;
}
