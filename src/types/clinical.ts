export type PatientGroup = 'niño' | 'mujer' | 'adulto';

export type UserRole = 'clinico' | 'asistente' | 'administrador' | 'auditor';

export type CertaintyLevel = 'confirmado' | 'probable' | 'descartado' | 'no_visible';

export type ClinicalRiskLevel = 'bajo' | 'moderado' | 'alto_adaptacion' | 'critico_derivacion';

export type ImagingModality = 'RX_LATERAL' | 'RX_AP_ESPINOGRAMA' | 'RMN_SAGITAL' | 'DICOM_CT';

export interface MedicationEntry {
  id: string;
  nombre: string;
  categoria:
    | 'anticoagulante'
    | 'corticoide_cronico'
    | 'aine_analgesico'
    | 'relajante_muscular'
    | 'bifosfonato_oseo'
    | 'psicofarmaco'
    | 'otro';
  dosis: string;
  frecuencia: string;
  impactoQuiropractico: string;
  requiereBajaFuerza: boolean;
}

export interface PediatricContext {
  pesoKg: number;
  tallaCm: number;
  pesoMochilaKg: number;
  signoRisser: 0 | 1 | 2 | 3 | 4 | 5;
  estironPuberalActivo: boolean;
  horasPantallaDiarias: number;
  testAdamsGrados: number;
  hitosMotoresNormales: boolean;
  observacionesDesarrollo: string;
}

export interface WomenSpecificContext {
  etapaFisiologica: 'fertil' | 'gestacion_t1' | 'gestacion_t2' | 'gestacion_t3' | 'posparto' | 'perimenopausia' | 'posmenopausia';
  semanasGestacion?: number;
  hiperlaxitudLigamentaria: boolean;
  compromisoPisoPelvico: boolean;
  densidadOsea: 'normal' | 'osteopenia' | 'osteoporosis' | 'no_evaluada';
  dismenorreaRelacionadaLumbar: boolean;
}

export interface AdultOccupationalContext {
  modalidadTrabajo: 'sedentario_oficina' | 'carga_fisica' | 'bipedestacion_prolongada' | 'conduccion_vibracion' | 'mixto';
  horasSentadoDiarias: number;
  bruxismoOclusionATM: boolean;
  actividadDeportivaSemanalHoras: number;
  calidadMobiliarioErgonomico: 'optimo' | 'regular' | 'deficiente';
}

export interface PsychologicalScreening {
  kinesiofobiaScore: number; // 0-10
  catastrofizacionDolor: number; // 0-10
  estresPercibido: number; // 0-10
  calidadSueno: number; // 0-10 (10 = óptimo, 0 = insomnio severo)
  banderasAmarillasActivas: string[];
}

export interface RedFlagsScreening {
  perdidaControlEsfinteres: boolean;
  anestesiaSillaMontar: boolean;
  perdidaPesoInexplicada: boolean;
  dolorNocturnoIncesante: boolean;
  fiebreRecienteInfeccion: boolean;
  traumaAltaEnergiaReciente: boolean;
  deficitMotorProgresivo: boolean;
  insuficienciaVertebrobasilar: boolean;
}

export interface SpineSegmentFinding {
  segmento: string; // e.g., 'C1 (Atlas)', 'C2 (Axis)', 'C5-C6', 'T4-T6', 'L4-L5', 'Sacro-Ilíaca'
  region: 'cervical' | 'toracica' | 'lumbar' | 'pelvis_sacro';
  movilidad: 'normal' | 'hipomovil_fijacion' | 'hipermovil_compensatorio';
  subluxacionDireccion: string; // e.g., 'ASRP (Atlas Lateral Derecha)', 'PLS', 'PI Ilíaco'
  dolorPalpacionEVA: number; // 0-10
  tonoParavertebral: 'normotonico' | 'hipertonia_leve' | 'espasmo_defensivo' | 'atrofia';
  irradiacionDermatomica: string;
}

export interface OrthopedicTestResult {
  id: string;
  nombre: string;
  region: 'cervical' | 'toracica' | 'lumbar' | 'sacroiliaca' | 'neurologica';
  resultado: 'negativo' | 'positivo_izquierdo' | 'positivo_derecho' | 'positivo_bilateral' | 'no_evaluado';
  hallazgoClinico: string;
}

export interface ImagingCaliperMeasurement {
  id: string;
  etiqueta: string;
  valorMedido: string;
  rangoReferencia: string;
  interpretacion: 'normal' | 'rectificado' | 'aumentado' | 'escoliotico' | 'degenerativo';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ImagingPinFinding {
  id: string;
  segmento: string;
  descripcion: string;
  correlacionClinica: 'alta_concordancia' | 'hallazgo_incidental' | 'compensacion_biomecanica';
  xPercent: number;
  yPercent: number;
}

export interface DiagnosticImageStudy {
  id: string;
  titulo: string;
  modalidad: ImagingModality;
  fechaEstudio: string;
  imageUrl: string;
  proyeccion: string;
  calidadTecnica: 'optima' | 'aceptable' | 'limitada';
  mediciones: ImagingCaliperMeasurement[];
  marcadores: ImagingPinFinding[];
  conclusionRadiologicaFuncional: string;
}

export interface DifferentialHypothesis {
  id: string;
  patologia: string;
  codigoCIE10: string;
  certeza: CertaintyLevel;
  evidenciaAnamnesis: string;
  evidenciaEstructural: string;
  evidenciaImagen: string;
  conductaQuiropractica: string;
}

export interface ProtocolPhaseItem {
  faseNumero: 1 | 2 | 3 | 4;
  nombreFase: string;
  objetivoClinico: string;
  frecuenciaSesiones: string;
  duracionSemanas: number;
  tecnicasNoInvasivas: string[];
  ejerciciosPrescritos: string[];
  criterioProgresion: string;
  estadoFase: 'en_curso' | 'completada' | 'programada';
}

export interface FollowUpSession {
  id: string;
  numeroSesion: number;
  fecha: string;
  profesional: string;
  evaPreSesion: number;
  evaPostSesion: number;
  segmentosAjustados: string[];
  tecnicaUtilizada: string;
  respuestaInmediata: 'favorable_liberacion' | 'alivio_parcial' | 'sin_cambios' | 'molestia_reactiva_leve';
  notasSOAP: {
    subjetivo: string;
    objetivo: string;
    analisis: string;
    plan: string;
  };
}

export interface ClinicalCaseRecord {
  id: string;
  codigoExpediente: string;
  fechaApertura: string;
  ultimaActualizacion: string;
  estadoCaso: 'evaluacion_inicial' | 'en_tratamiento' | 'estabilizado' | 'derivado_interconsulta';
  firmadoPorClinico: string | null;

  // Datos del paciente
  paciente: {
    nombreCompleto: string;
    documentoIdentidad: string;
    edad: number;
    sexoBiologico: 'F' | 'M';
    grupoClinico: PatientGroup;
    telefono: string;
    ocupacion: string;
    localidad: string;
  };

  // Fase 2: Anamnesis y Contexto
  anamnesis: {
    motivoConsultaPrincipal: string;
    tiempoEvolucion: string;
    mecanismoInicio: 'insidioso_postural' | 'traumatico' | 'sobrecarga_esfuerzo' | 'gestacional_hormonal' | 'crecimiento_desarrollo';
    evaActual: number;
    evaMaximoUltimaSemana: number;
    indiceDiscapacidadPorcentaje: number; // Oswestry / NDI
    escalaUtilizada: 'Oswestry (Lumbar)' | 'NDI (Cervical)' | 'Funcional Pediátrica';
    factoresAgravantes: string[];
    factoresAliviantes: string[];
    antecedentesPatologicos: string[];
    medicacionActiva: MedicationEntry[];
    evaluacionPsicologica: PsychologicalScreening;
    banderasRojas: RedFlagsScreening;
    contextoPediatrico?: PediatricContext;
    contextoMujer?: WomenSpecificContext;
    contextoAdulto?: AdultOccupationalContext;
  };

  // Fase 2B: Examen Físico y Estructural
  examenEstructural: {
    basculacionPelvicaMm: number;
    discrepanciaMiembrosInferioresMm: number;
    proyeccionAnteriorCabezaMm: number;
    simetriaHombros: 'nivelados' | 'ascenso_derecho' | 'ascenso_izquierdo';
    apoyoPlantar: 'neutro' | 'pronado_bilateral' | 'supinado' | 'asimetrico';
    segmentosVertebrales: SpineSegmentFinding[];
    pruebasOrtopedicas: OrthopedicTestResult[];
  };

  // Fase 3: Imágenes y Diagnóstico Diferencial
  estudiosImagen: DiagnosticImageStudy[];
  diagnosticoDiferencial: DifferentialHypothesis[];
  sintesisCorrelacion: string;

  // Fase 4: Protocolo y Seguimiento
  protocolo: {
    objetivosPaciente: string[];
    precaucionesEspecificas: string[];
    fases: ProtocolPhaseItem[];
    pautasErgonomicas: string[];
  };
  seguimientos: FollowUpSession[];
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  usuario: string;
  rol: UserRole;
  accion: string;
  expedienteCodigo: string;
  detalleClinico: string;
  hashIntegridad: string;
}
