/**
 * Utilidades para validación y formateo de nombres y apellidos.
 */

// Permite letras latinas, tildes, diéresis, ñ/Ñ, espacios, guiones y apóstrofes.
// Rechaza números y símbolos especiales (@, $, %, #, etc.).
export const NOMBRE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

/**
 * Limpia espacios sobrantes al inicio y al final, y colapsa espacios dobles o múltiples a uno solo.
 */
export function limpiarTextoNombre(str: string | null | undefined): string {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ').replace(/[’‘´`]/g, "'");
}

/**
 * Valida un campo de nombre o apellido según las especificaciones:
 * - Mínimo 2 caracteres, máximo 80.
 * - Solo letras, tildes, ñ, espacios, guiones y apóstrofes.
 */
export function validarNombreOApellido(
  str: string | null | undefined,
  campo: 'Nombres' | 'Apellidos'
): { valido: boolean; error?: string; limpio: string } {
  const limpio = limpiarTextoNombre(str);
  if (!limpio || limpio.length < 2) {
    return {
      valido: false,
      error: `${campo} debe tener al menos 2 caracteres.`,
      limpio,
    };
  }
  if (limpio.length > 80) {
    return {
      valido: false,
      error: `${campo} no puede exceder 80 caracteres.`,
      limpio,
    };
  }
  if (!NOMBRE_REGEX.test(limpio)) {
    return {
      valido: false,
      error: `${campo} solo puede contener letras, tildes, espacios, guiones o apóstrofes (sin números ni símbolos especiales).`,
      limpio,
    };
  }
  return { valido: true, limpio };
}

/**
 * Normaliza nombres y apellidos a formato Capitalizado / Title Case:
 * Primera letra de cada palabra en mayúscula y el resto en minúscula.
 * Maneja además palabras con guiones (ej. "pérez-álvarez" -> "Pérez-Álvarez")
 * y apóstrofes (ej. "o'connor" -> "O'Connor").
 */
export function normalizarNombrePropio(str: string | null | undefined): string {
  const limpio = limpiarTextoNombre(str);
  if (!limpio) return '';

  return limpio
    .toLowerCase()
    .split(' ')
    .map((palabra) => {
      if (!palabra) return '';
      if (palabra.includes('-')) {
        return palabra
          .split('-')
          .map((sub) => (sub ? sub.charAt(0).toUpperCase() + sub.slice(1) : ''))
          .join('-');
      }
      if (palabra.includes("'")) {
        return palabra
          .split("'")
          .map((sub) => (sub ? sub.charAt(0).toUpperCase() + sub.slice(1) : ''))
          .join("'");
      }
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(' ');
}
