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
    maxAsistenciasPorMinutoPorIp: 10,
    maxIntentosLoginStaff: 5,
    minutosBloqueoLoginStaff: 10,
  },

  // Las 8 ponencias oficiales del congreso (4 por día)
  ponencias: [
    {
      orden: 1,
      dia: 1,
      fecha: "2026-11-23",
      horaEstimada: "09:00 - 10:30",
      nombre: "Ponencia 1: Innovación en Estructuras Sismorresistentes y Concreto de Alto Desempeño",
      expositor: "Especialista Nacional en Estructuras",
      descripcion: "Nuevas tendencias en diseño sismorresistente aplicadas a infraestructura nacional.",
    },
    {
      orden: 2,
      dia: 1,
      fecha: "2026-11-23",
      horaEstimada: "11:00 - 12:30",
      nombre: "Ponencia 2: Geotecnia Aplicada y Cimentaciones Especiales en Obras Complejas",
      expositor: "Especialista en Mecánica de Suelos",
      descripcion: "Retos y soluciones en cimentaciones profundas y estabilización de taludes.",
    },
    {
      orden: 3,
      dia: 1,
      fecha: "2026-11-23",
      horaEstimada: "14:30 - 16:00",
      nombre: "Ponencia 3: Transformación Digital y Metodología BIM-VDC en Mega Proyectos",
      expositor: "Consultor Senior BIM / VDC",
      descripcion: "Implementación estratégica de modelos digitales para optimización de plazos y costos.",
    },
    {
      orden: 4,
      dia: 1,
      fecha: "2026-11-23",
      horaEstimada: "16:30 - 18:00",
      nombre: "Ponencia 4: Gestión de Proyectos de Infraestructura y Contratos Colaborativos NEC/FIDIC",
      expositor: "Experto en Gestión de Contratos y Dirección de Obras",
      descripcion: "Mejores prácticas en la resolución de controversias y ejecución eficiente de proyectos públicos.",
    },
    {
      orden: 5,
      dia: 2,
      fecha: "2026-11-24",
      horaEstimada: "09:00 - 10:30",
      nombre: "Ponencia 5: Construcción Sostenible, Certificaciones Verdes y Economía Circular",
      expositor: "Especialista en Edificaciones Sostenibles (LEED / EDGE)",
      descripcion: "Reducción de huella de carbono y materiales ecoamigables en la industria de la construcción.",
    },
    {
      orden: 6,
      dia: 2,
      fecha: "2026-11-24",
      horaEstimada: "11:00 - 12:30",
      nombre: "Ponencia 6: Hidráulica Urbana, Drenaje Sostenible y Resiliencia ante Eventos Climáticos",
      expositor: "Consultor en Recursos Hídricos e Ingeniería Sanitaria",
      descripcion: "Sistemas urbanos de drenaje sostenible (SUDS) y mitigación de desastres.",
    },
    {
      orden: 7,
      dia: 2,
      fecha: "2026-11-24",
      horaEstimada: "14:30 - 16:00",
      nombre: "Ponencia 7: Automatización, Robótica e Inteligencia Artificial en Obra",
      expositor: "Investigador en Construtech e IA Aplicada",
      descripcion: "Uso de drones, sensores IoT e IA predictiva para supervisión y seguridad en faena.",
    },
    {
      orden: 8,
      dia: 2,
      fecha: "2026-11-24",
      horaEstimada: "16:30 - 18:00",
      nombre: "Ponencia 8: Lean Construction y Productividad en la Industria de la Construcción",
      expositor: "Líder de Productividad y Last Planner System",
      descripcion: "Estrategias prácticas de eliminación de pérdidas y mejora continua del flujo de trabajo.",
    },
  ] as PonenciaConfig[],
};
