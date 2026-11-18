// Constantes con nombre para control de frecuencia (Rate Limiting)
// Modificables desde un solo lugar para adaptarse al tráfico del evento (Wifi compartido / IP móvil)
export const RATE_LIMIT_ASISTENCIA_POR_MINUTO = 1000;
export const RATE_LIMIT_CONSULTA_ACTIVA_POR_MINUTO = 1000;
export const RATE_LIMIT_ASISTENCIA_POR_CORREO_MINUTO = 5;
export const RATE_LIMIT_ADMIN_LOGIN_INTENTOS = 5;
export const RATE_LIMIT_ADMIN_LOGIN_BLOQUEO_MINUTOS = 10;

export interface PonenciaConfig {
  orden: number;
  dia: number;
  fecha: string; // YYYY-MM-DD
  horaEstimada: string;
  nombre: string;
  expositor?: string;
  descripcion?: string;
}

export const EVENT_CONFIG = {
  nombreEvento: "Constructecnia 2026",
  edicion: "XXI Edición",
  organizador: "ADEIC PUCP",
  fechasTexto: "23 y 24 de noviembre de 2026",
  sede: "Auditorio B-100, Pontificia Universidad Católica del Perú (PUCP)",
  zonaHoraria: "America/Lima",
  
  // Requisito de certificación: mínimo 4 ponencias distintas
  minimoPonenciasParaCertificado: 4,
  totalPonencias: 8,

  // Configuración de validación de identificación
  validacion: {
    alumnoPucp: {
      regex: /^[0-9]{8}$/,
      longitud: 8,
      ejemplo: "20221234",
      errorMensaje: "El código de alumno PUCP debe contener exactamente 8 dígitos numéricos.",
    },
    externo: {
      regex: /^[0-9]{8}$/,
      longitud: 8,
      ejemplo: "71234567",
      errorMensaje: "El DNI debe contener exactamente 8 dígitos numéricos.",
    },
    correo: {
      // Regex estándar robusto para correos
      regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      errorMensaje: "Por favor, ingresa un correo electrónico válido.",
    },
  },

  // Seguridad y Rate Limiting
  seguridad: {
    maxAsistenciasPorMinutoPorIp: RATE_LIMIT_ASISTENCIA_POR_MINUTO,
    maxConsultasActivaPorMinutoPorIp: RATE_LIMIT_CONSULTA_ACTIVA_POR_MINUTO,
    maxAsistenciasPorMinutoPorCorreo: RATE_LIMIT_ASISTENCIA_POR_CORREO_MINUTO,
    maxIntentosLoginStaff: RATE_LIMIT_ADMIN_LOGIN_INTENTOS,
    minutosBloqueoLoginStaff: RATE_LIMIT_ADMIN_LOGIN_BLOQUEO_MINUTOS,
  },

  // Las 8 ponencias oficiales del congreso (4 por día: 23 y 24 de noviembre)
  ponencias: [
    {
      orden: 1,
      dia: 1,
      fecha: "2026-11-23",
      horaEstimada: "4–5 PM",
      nombre: "Barton Aliaga · AECOM",
      expositor: "Ingeniero Geotécnico · 4–5 PM",
      descripcion: "Ingeniero Geotécnico — Horario: 4–5 PM",
    },
    {
      orden: 2,
      dia: 1,
      fecha: "2026-11-23",
      horaEstimada: "5–6 PM",
      nombre: "Karla Vallejos · Pacasmayo (Prefabricados)",
      expositor: "Subgerenta de Ingeniería y Prospección · 5–6 PM",
      descripcion: "Subgerenta de Ingeniería y Prospección — Horario: 5–6 PM",
    },
    {
      orden: 3,
      dia: 1,
      fecha: "2026-11-23",
      horaEstimada: "6–7 PM",
      nombre: "Fernando Chávez · PDK",
      expositor: "Subgerente de PMO · 6–7 PM",
      descripcion: "Subgerente de PMO — Horario: 6–7 PM",
    },
    {
      orden: 4,
      dia: 1,
      fecha: "2026-11-23",
      horaEstimada: "7–8 PM",
      nombre: "Yerssy Saavedra · Gleeds",
      expositor: "Assistant Contract Manager · 7–8 PM",
      descripcion: "Assistant Contract Manager — Horario: 7–8 PM",
    },
    {
      orden: 5,
      dia: 2,
      fecha: "2026-11-24",
      horaEstimada: "4–5 PM",
      nombre: "Toninho Serrano · PROMET",
      expositor: "Director de Operaciones Regional (Perú y Chile) · 4–5 PM",
      descripcion: "Director de Operaciones Regional (Perú y Chile) — Horario: 4–5 PM",
    },
    {
      orden: 6,
      dia: 2,
      fecha: "2026-11-24",
      horaEstimada: "5–6 PM",
      nombre: "Gonzalo Vigo · Pacasmayo (Pavimentos)",
      expositor: "Jefe de Ingeniería de Pavimentos · 5–6 PM",
      descripcion: "Jefe de Ingeniería de Pavimentos — Horario: 5–6 PM",
    },
    {
      orden: 7,
      dia: 2,
      fecha: "2026-11-24",
      horaEstimada: "6–7 PM",
      nombre: "Gustavo Loa · Prisma Ingeniería",
      expositor: "Jefe del Área I+D+i y de Revisión de Proyectos de Estructuras, Profesor PUCP · 6–7 PM",
      descripcion: "Jefe del Área I+D+i y de Revisión de Proyectos de Estructuras, Profesor PUCP — Horario: 6–7 PM",
    },
    {
      orden: 8,
      dia: 2,
      fecha: "2026-11-24",
      horaEstimada: "7–8 PM",
      nombre: "Ronald Roosvelt y Omar Alfaro · COSAPI",
      expositor: "Ingeniero y Gerente de la Unidad de Proyectos Colaborativos · 7–8 PM",
      descripcion: "Ingeniero y Gerente de la Unidad de Proyectos Colaborativos — Horario: 7–8 PM",
    },
  ] as PonenciaConfig[],
};
