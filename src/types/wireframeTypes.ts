export type MainScreen =
  | 'LOGIN'
  | 'DASHBOARD'
  | 'NUEVA_CONSULTA'
  | 'MIS_PACIENTES'
  | 'MIS_ CONSULTAS'
  | 'REPORTES'
  | 'CONFIGURACION'
  | 'REPORTE_PDF'
  | 'ARQUITECTURA';

export type PatientStatus =
  | 'Mejorando'
  | 'Tratamiento'
  | 'Seguimiento'
  | 'Evaluación Inicial';

export type PatientProfileGroup = 'NIÑO' | 'ADULTO' | 'MUJER_ADULTA';

export interface DailyActivityItem {
  nombre: string;
  duracionDiaria: string;
  posturaInvolucrada: string;
  repeticionesCarga: string;
  equipamiento: string;
}

export interface PatientRecord {
  id: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  fechaNacimiento?: string;
  edad: number;
  genero: 'Masculino' | 'Femenino';
  perfilGrupo?: PatientProfileGroup;
  profesion: string;
  ciudad: string;
  telefono: string;
  email: string;
  ultimaCita: string;
  proximaCita: string;
  estado: PatientStatus;
  horasSedentarioDia: number;
  horasComputadoraDia: number;
  horasSmartphoneDia: number;
  diccionarioCliente?: string[];
}

export interface PhysicalTestRow {
  prueba: string;
  resultado: string;
}

export interface DicomStudyItem {
  id: string;
  etiquetaCorta: string;
  fechaCorta: string;
  estudio: string;
  fechaCompleta: string;
  region: string;
  tecnica: string;
  corteOrientacion?: 'Sagital (Lateral)' | 'Axial (Transversal)' | 'Coronal (Frontal AP)' | 'Oblicua / Dinámica';
  imageUrl: string;
  hallazgos: {
    texto: string;
    activo: boolean;
  }[];
  impresion: string;
  anotacionesMedico: string;
  trazosDibujo: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    tipo: 'lapiz' | 'regla';
    etiqueta?: string;
  }[];
}

export interface FollowUpProgressNote {
  id: string;
  fecha: string;
  dolorEva: number;
  flexionGrados: number;
  fuerzaGluteos: string;
  notaProgreso: string;
}

export interface ConsultationRecord {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteEdad: number;
  pacienteGenero: 'Masculino' | 'Femenino';
  perfilGrupo?: PatientProfileGroup;
  pacienteProfesion: string;
  pacienteCiudad: string;
  fechaConsulta: string;
  estadoConsulta: PatientStatus;
  patologiaFiltro: string;
  diccionarioCliente?: string[];

  // FASE 1 / PASO 2: Anamnesis Profunda (1.1 a 1.5)
  anamnesis: {
    profesion: string;
    ciudad: string;
    horasSedentarioDia: number;
    horasComputadoraDia: number;
    horasSmartphoneDia: number;
    problemaDeHoy: string;
    duracionAudioSegundos: number;
    antecedentes: {
      escoliosis: boolean;
      cifosis: boolean;
      lordosis: boolean;
      asma: boolean;
      tiroides: boolean;
      otrosTexto: string;
      asimetriaPiernas?: string;
      desviacionCadera?: boolean;
      gradoEscoliosis?: string;
    };
    contextoNino?: {
      horasClaseDia: number;
      posturaEscolar: string;
      deportesActuales: string;
      deportesInfancia: string;
      pesoMochilaKg: number;
      posturasHabituales: string;
    };
    contextoMujer?: {
      cantidadHijos: number;
      actividadesAdicionales: string;
      nivelSobrecarga1a10: number;
      actividadPostParto: string;
      pesoActualKg: number;
    };
    contextoAdulto?: {
      tipoTrabajo: 'oficina' | 'campo' | 'mixto';
      distanciaPantallaCm: number;
      deporteActual: string;
      deporteInfancia: string;
      soportesPosturales: string;
    };
    actividadesDiarias?: DailyActivityItem[];
  };

  // FASE 2 / PASO 3: Evaluación Clínica Estructurada (2.1 a 2.4)
  evaluacionClinica: {
    duracionGrabacionSegundos: number;
    notasTiempoReal: string[];
    pruebasRealizadas: {
      posturaEnPie: boolean;
      movilidad: boolean;
      fuerza: boolean;
      neurologico: boolean;
      camillaSupino: boolean;
      cadera: boolean;
      palpacion: boolean;
      especiales: boolean;
    };
    tablaResultadosFisicos: PhysicalTestRow[];
    sintomaEspecifico?: {
      localizacionZona:
        | 'Cervical (C1-C7)'
        | 'Dorsal (T1-T12)'
        | 'Lumbar (L1-L5)'
        | 'Sacro'
        | 'Miembros';
      inicio: 'Agudo' | 'Gradual';
      intensidadEva: number;
      tipoDolor: string;
      irradiacionTerritorio: string;
      impactoFuncional: string;
    };
    pruebaPsicologica?: {
      actitud: 'Colaborador' | 'Defensivo' | 'Ansioso';
      humor: 'Neutral' | 'Ansioso' | 'Deprimido' | 'Eufórico';
      eventosVitales: string;
      medicacionPsicotropa: string;
      implicacionClinica: string;
    };
    maniobrasEjeCadera?: {
      observacionDePie: string;
      evaluacionCamilla: string;
      ejeCaderaCentroGravedad: string;
      relatoNervioCiatico: string;
      tonoMuscular: string;
    };
  };

  // FASE 3 / PASO 4: Análisis de Imágenes y Diagnóstico Diferencial Visual (3.1 a 3.3)
  imagenes: {
    estudioSeleccionadoId: string;
    zoom: number;
    brillo: number;
    contraste: number;
    estudiosHistorial: DicomStudyItem[];
    diagnosticoDiferencialVisual?: {
      confirmada: string;
      probable: string;
      descartada: string;
      noVisible: string;
      impactoFuncionalPronostico: string;
    };
  };

  // FASE 4 y 5 / PASO 5: Protocolo Personalizado y Doble Reporte (4.1 a 5.2)
  protocolo: {
    diagnosticoPrincipal: string;
    diagnosticoSecundario: string;
    etiologia: string;
    fase1: {
      titulo: string;
      ajustes: string;
      complementos: string;
      restriccion: string;
    };
    fase2: {
      titulo: string;
      ajustes: string;
      ejercicios: string;
      ergonomia: string;
    };
    fase3: {
      titulo: string;
      ajustes: string;
      ejerciciosCasa: string;
      educacion: string;
    };
    fase4?: {
      titulo: string;
      optimizacionRendimiento: string;
      integracionNeuromuscular: string;
    };
    objetivosCortoPlazo: string[];
    objetivosMedianoPlazo: string[];
    objetivosLargoPlazo: string[];
    proximaCitaFechaHora: string;
    signosProgresoSemanas?: {
      semana1a2: string;
      semana3a4: string;
      semana5a8: string;
      semana9a12: string;
    };
    razonamientoMedico?: {
      porQuePatologia: string;
      diferencialesDescartados: string;
      riesgosContraindicaciones: string;
      puntosContactoDireccionAjuste: string;
      criteriosAlta: string;
    };
  };

  // Transcripción en vivo de toda la charla con el quiropráctico e Informe Completo generado
  transcripcionCharla?: string;
  informeCompletoCharla?: {
    tituloInforme: string;
    resumenConversacion: string;
    anamnesisNarrativa: string;
    correlacionBiomecanicaEjeCadera: string;
    planTerapeuticoDetallado: string;
  };

  seguimientos: FollowUpProgressNote[];
}

export interface DoctorProfile {
  nombre: string;
  matriculaProfesional?: string;
  email: string;
  clinica: string;
  telefono: string;
  emergencias: string;
  ciudad: string;
  twoFactorEnabled: boolean;
  darkMode?: boolean;
}
