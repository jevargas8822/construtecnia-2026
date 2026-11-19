// Constantes con nombre para control de frecuencia (Rate Limiting)
// Modificables desde un solo lugar para adaptarse al tráfico del evento (Wifi compartido / IP móvil)
export const RATE_LIMIT_ASISTENCIA_POR_MINUTO = 1000;
export const RATE_LIMIT_CONSULTA_ACTIVA_POR_MINUTO = 1000;
export const RATE_LIMIT_ASISTENCIA_POR_CORREO_MINUTO = 5;
export const RATE_LIMIT_ADMIN_LOGIN_INTENTOS = 5;
export const RATE_LIMIT_ADMIN_LOGIN_BLOQUEO_MINUTOS = 10;

export interface PonenciaConfig {
  id: number;
  orden: number;
  dia: number;
  fecha: string; // YYYY-MM-DD
  horario: string; // ej. "4–5 PM"
  horaEstimada: string; // alias para compatibilidad
  nombre: string;
  cargo: string;
  expositor?: string; // alias para compatibilidad
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
    nombres: {
      min: 2,
      max: 80,
      regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
      errorMensaje: "Los nombres deben tener entre 2 y 80 caracteres y contener solo letras.",
    },
    apellidos: {
      min: 2,
      max: 80,
      regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
      errorMensaje: "Los apellidos deben tener entre 2 y 80 caracteres y contener solo letras.",
    },
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

  // Las 8 ponencias oficiales del congreso (Única fuente de verdad: id 1 a 8)
  ponencias: [
    {
      id: 1,
      orden: 1,
      dia: 1,
      fecha: "2026-11-23",
      horario: "4–5 PM",
      horaEstimada: "4–5 PM",
      nombre: "Barton Aliaga · AECOM",
      cargo: "Ingeniero Geotécnico",
      expositor: "Ingeniero Geotécnico",
      descripcion: "Ingeniero Geotécnico",
    },
    {
      id: 2,
      orden: 2,
      dia: 1,
      fecha: "2026-11-23",
      horario: "5–6 PM",
      horaEstimada: "5–6 PM",
      nombre: "Karla Vallejos · Pacasmayo (Prefabricados)",
      cargo: "Subgerenta de Ingeniería y Prospección",
      expositor: "Subgerenta de Ingeniería y Prospección",
      descripcion: "Subgerenta de Ingeniería y Prospección",
    },
    {
      id: 3,
      orden: 3,
      dia: 1,
      fecha: "2026-11-23",
      horario: "6–7 PM",
      horaEstimada: "6–7 PM",
      nombre: "Fernando Chávez · PDK",
      cargo: "Subgerente de PMO",
      expositor: "Subgerente de PMO",
      descripcion: "Subgerente de PMO",
    },
    {
      id: 4,
      orden: 4,
      dia: 1,
      fecha: "2026-11-23",
      horario: "7–8 PM",
      horaEstimada: "7–8 PM",
      nombre: "Yerssy Saavedra · Gleeds",
      cargo: "Assistant Contract Manager",
      expositor: "Assistant Contract Manager",
      descripcion: "Assistant Contract Manager",
    },
    {
      id: 5,
      orden: 5,
      dia: 2,
      fecha: "2026-11-24",
      horario: "4–5 PM",
      horaEstimada: "4–5 PM",
      nombre: "Toninho Serrano · PROMET",
      cargo: "Director de Operaciones Regional (Perú y Chile)",
      expositor: "Director de Operaciones Regional (Perú y Chile)",
      descripcion: "Director de Operaciones Regional (Perú y Chile)",
    },
    {
      id: 6,
      orden: 6,
      dia: 2,
      fecha: "2026-11-24",
      horario: "5–6 PM",
      horaEstimada: "5–6 PM",
      nombre: "Gonzalo Vigo · Pacasmayo (Pavimentos)",
      cargo: "Jefe de Ingeniería de Pavimentos",
      expositor: "Jefe de Ingeniería de Pavimentos",
      descripcion: "Jefe de Ingeniería de Pavimentos",
    },
    {
      id: 7,
      orden: 7,
      dia: 2,
      fecha: "2026-11-24",
      horario: "6–7 PM",
      horaEstimada: "6–7 PM",
      nombre: "Gustavo Loa · Prisma Ingeniería",
      cargo: "Jefe del Área I+D+i y de Revisión de Proyectos de Estructuras · Profesor PUCP",
      expositor: "Jefe del Área I+D+i y de Revisión de Proyectos de Estructuras · Profesor PUCP",
      descripcion: "Jefe del Área I+D+i y de Revisión de Proyectos de Estructuras · Profesor PUCP",
    },
    {
      id: 8,
      orden: 8,
      dia: 2,
      fecha: "2026-11-24",
      horario: "7–8 PM",
      horaEstimada: "7–8 PM",
      nombre: "Ronald Roosvelt y Omar Alfaro · COSAPI",
      cargo: "Ingeniero y Gerente de la Unidad de Proyectos Colaborativos",
      expositor: "Ingeniero y Gerente de la Unidad de Proyectos Colaborativos",
      descripcion: "Ingeniero y Gerente de la Unidad de Proyectos Colaborativos",
    },
  ] as PonenciaConfig[],
};
