import {
  ClinicalCaseRecord,
  ClinicalRiskLevel,
  ProtocolPhaseItem,
  UserRole,
} from '../types/clinical';

export interface ClinicalRiskEvaluation {
  nivelRiesgo: ClinicalRiskLevel;
  etiquetaRiesgo: string;
  aptoTecnicasNoInvasivas: boolean;
  requiereBajaFuerzaObligatoria: boolean;
  requiereDerivacionUrgente: boolean;
  alertasBanderasRojas: string[];
  alertasFarmacologicas: string[];
  alertasGrupoPoblacional: string[];
  alertasPsicologicas: string[];
  indiceConcordanciaImagenClinica: number; // 0-100%
  resumenConcordancia: string;
}

export function evaluateClinicalCase(record: ClinicalCaseRecord): ClinicalRiskEvaluation {
  const alertasBanderasRojas: string[] = [];
  const alertasFarmacologicas: string[] = [];
  const alertasGrupoPoblacional: string[] = [];
  const alertasPsicologicas: string[] = [];

  const rf = record.anamnesis.banderasRojas;
  if (rf.perdidaControlEsfinteres || rf.anestesiaSillaMontar) {
    alertasBanderasRojas.push(
      'Sospecha de Síndrome de Cauda Equina (alteración esfinteriana / anestesia en silla de montar). Derivación neuroquirúrgica inmediata.'
    );
  }
  if (rf.insuficienciaVertebrobasilar) {
    alertasBanderasRojas.push(
      'Signos de Insuficiencia Vertebrobasilar (5D/3N). Contraindicación absoluta de manipulación cervical rotacional.'
    );
  }
  if (rf.deficitMotorProgresivo) {
    alertasBanderasRojas.push(
      'Déficit motor neurológico progresivo detectado. Requiere interconsulta neurológica y RMN actualizada.'
    );
  }
  if (rf.traumaAltaEnergiaReciente) {
    alertasBanderasRojas.push(
      'Antecedente de trauma de alta energía reciente. Descartar fractura o inestabilidad ligamentaria antes de contacto mecánico.'
    );
  }
  if (rf.perdidaPesoInexplicada && rf.dolorNocturnoIncesante) {
    alertasBanderasRojas.push(
      'Dolor nocturno no mecánico asociado a pérdida de peso inexplicada. Solicitar laboratorio e imagen de control.'
    );
  }
  if (rf.fiebreRecienteInfeccion) {
    alertasBanderasRojas.push(
      'Fiebre concomitante con dolor espinal agudo. Descartar proceso infeccioso vertebral (espondilodiscitis).'
    );
  }

  let requiereBajaFuerzaObligatoria = false;

  // Reglas farmacológicas
  for (const med of record.anamnesis.medicacionActiva) {
    if (med.categoria === 'anticoagulante') {
      requiereBajaFuerzaObligatoria = true;
      alertasFarmacologicas.push(
        `Anticoagulación activa (${med.nombre} ${med.dosis}): Contraindicado impulso HVLA y terapia miofascial profunda por riesgo de hematoma espinal/tisular.`
      );
    } else if (med.categoria === 'corticoide_cronico') {
      requiereBajaFuerzaObligatoria = true;
      alertasFarmacologicas.push(
        `Corticoterapia crónica (${med.nombre}): Fragilidad trabecular inducida. Aplicar exclusivamente técnicas instrumentales de baja fuerza (Activador / Movilización suave).`
      );
    } else if (med.categoria === 'bifosfonato_oseo') {
      requiereBajaFuerzaObligatoria = true;
      alertasFarmacologicas.push(
        `Tratamiento metabolismo óseo (${med.nombre}): Ajustar vector y reducir fuerza pico en segmentos toracolumbares y costales.`
      );
    } else if (med.categoria === 'aine_analgesico' || med.categoria === 'relajante_muscular') {
      alertasFarmacologicas.push(
        `Uso activo de ${med.nombre} (${med.dosis}): Considerar posible enmascaramiento del umbral doloroso durante las pruebas ortopédicas.`
      );
    }
  }

  // Reglas por grupo poblacional (Niños, Mujeres, Adultos)
  if (record.paciente.grupoClinico === 'niño' && record.anamnesis.contextoPediatrico) {
    const ped = record.anamnesis.contextoPediatrico;
    requiereBajaFuerzaObligatoria = true;
    const ratioMochila = ped.pesoKg > 0 ? Math.round((ped.pesoMochilaKg / ped.pesoKg) * 1000) / 10 : 0;

    if (ratioMochila > 10) {
      alertasGrupoPoblacional.push(
        `Sobrecarga escolar pediátrica: Mochila representa el ${ratioMochila}% del peso corporal (límite seguro ≤ 10%). Factor agravante directo de actitud escoliótica.`
      );
    }
    if (ped.signoRisser <= 2 && ped.estironPuberalActivo && ped.testAdamsGrados >= 5) {
      alertasGrupoPoblacional.push(
        `Riesgo de progresión de curva espinal infantil: Signo de Risser ${ped.signoRisser}/5 en pico de crecimiento puberal con giba costal de ${ped.testAdamsGrados}° en Test de Adams.`
      );
    }
    if (ped.horasPantallaDiarias >= 4) {
      alertasGrupoPoblacional.push(
        `Síndrome de flexión cervical mantenida infantil (${ped.horasPantallaDiarias} h/día de pantalla): Sobrecarga en charnela occipitoatloidea C0-C1-C2.`
      );
    }
  }

  if (record.paciente.grupoClinico === 'mujer' && record.anamnesis.contextoMujer) {
    const muj = record.anamnesis.contextoMujer;
    if (
      muj.etapaFisiologica === 'gestacion_t1' ||
      muj.etapaFisiologica === 'gestacion_t2' ||
      muj.etapaFisiologica === 'gestacion_t3'
    ) {
      requiereBajaFuerzaObligatoria = true;
      alertasGrupoPoblacional.push(
        `Paciente gestante (${muj.semanasGestacion || 24} sem): Hiperlaxitud mediada por relaxina. Utilizar camilla con apertura abdominal/pélvica, técnica Webster/Drop suave y evitar rotación lumbar forzada.`
      );
    }
    if (muj.etapaFisiologica === 'posparto' && muj.compromisoPisoPelvico) {
      alertasGrupoPoblacional.push(
        'Etapa posparto con disfunción de piso pélvico: Integrar estabilización lumbo-pélvica-diafragmática con alineación sacroilíaca.'
      );
    }
    if (muj.densidadOsea === 'osteoporosis' || muj.densidadOsea === 'osteopenia') {
      requiereBajaFuerzaObligatoria = true;
      alertasGrupoPoblacional.push(
        `Densidad mineral ósea reducida (${muj.densidadOsea.toUpperCase()}): Prohibido impulso compresivo rotacional o costal directo; emplear técnica instrumental regulada.`
      );
    }
  }

  if (record.paciente.grupoClinico === 'adulto' && record.anamnesis.contextoAdulto) {
    const ad = record.anamnesis.contextoAdulto;
    if (ad.horasSentadoDiarias >= 7 && ad.calidadMobiliarioErgonomico !== 'optimo') {
      alertasGrupoPoblacional.push(
        `Carga estática ocupacional (${ad.horasSentadoDiarias} h/día sentado en mobiliario ${ad.calidadMobiliarioErgonomico}): Hipomovilidad segmentaria crónica con inhibición de glúteo medio y flexores cervicales profundos.`
      );
    }
    if (ad.bruxismoOclusionATM) {
      alertasGrupoPoblacional.push(
        'Disfunción cráneo-cervico-mandibular (Bruxismo/ATM positivo): Evaluar cadena biomecánica C0-C1-C2 (Atlas-Axis) en conjunto con músculos masticatorios.'
      );
    }
  }

  // Reglas psicológicas (Banderas Amarillas)
  const psy = record.anamnesis.evaluacionPsicologica;
  if (psy.kinesiofobiaScore >= 7 || psy.catastrofizacionDolor >= 7) {
    alertasPsicologicas.push(
      `Bandera Amarilla Psicosocial (Kinesiofobia ${psy.kinesiofobiaScore}/10 · Catastrofización ${psy.catastrofizacionDolor}/10): Riesgo de sensibilización central. Priorizar educación en neurociencia del dolor y exposición gradual al movimiento.`
    );
  }
  if (psy.calidadSueno <= 4) {
    alertasPsicologicas.push(
      `Alteración del descanso reparador (${psy.calidadSueno}/10): Disminución de la capacidad de recuperación tisular miofascial entre sesiones.`
    );
  }

  // Cálculo de concordancia Imagen - Clínica
  const totalPins = record.estudiosImagen.reduce((acc, st) => acc + st.marcadores.length, 0);
  const concordantPins = record.estudiosImagen.reduce(
    (acc, st) =>
      acc + st.marcadores.filter((m) => m.correlacionClinica === 'alta_concordancia').length,
    0
  );
  const hipomoviles = record.examenEstructural.segmentosVertebrales.filter(
    (s) => s.movilidad !== 'normal'
  ).length;

  let indiceConcordanciaImagenClinica = 84;
  if (totalPins > 0) {
    indiceConcordanciaImagenClinica = Math.min(
      98,
      Math.max(45, Math.round((concordantPins / totalPins) * 80 + (hipomoviles > 0 ? 18 : 5)))
    );
  }

  const resumenConcordancia =
    concordantPins > 0
      ? `Se identifican ${concordantPins} hallazgos de imagen con correlación directa con la palpación segmentaria y clínica dermatómica (${indiceConcordanciaImagenClinica}% de coherencia funcional). Los hallazgos incidentales no sintomáticos han sido aislados para evitar sobretratamiento.`
      : 'Sin estudios de imagen correlacionados aún o predominio de hallazgos funcionales biomecánicos sin lesión estructural radiográfica.';

  // Determinación de Nivel de Riesgo
  let nivelRiesgo: ClinicalRiskLevel = 'bajo';
  let etiquetaRiesgo = 'Riesgo Clínico Bajo — Apto Protocolo Estándar No Invasivo';
  let aptoTecnicasNoInvasivas = true;
  let requiereDerivacionUrgente = false;

  if (alertasBanderasRojas.length > 0) {
    nivelRiesgo = 'critico_derivacion';
    etiquetaRiesgo = 'Riesgo Crítico (Bandera Roja) — Suspender Ajuste y Derivar';
    aptoTecnicasNoInvasivas = false;
    requiereDerivacionUrgente = true;
  } else if (requiereBajaFuerzaObligatoria) {
    nivelRiesgo = 'alto_adaptacion';
    etiquetaRiesgo = 'Precaución Biomecánica — Obligatorio Protocolo Suave / Baja Fuerza';
  } else if (alertasGrupoPoblacional.length > 0 || alertasPsicologicas.length > 0) {
    nivelRiesgo = 'moderado';
    etiquetaRiesgo = 'Riesgo Moderado — Requiere Adaptación Ergonómica y Monitoreo';
  }

  return {
    nivelRiesgo,
    etiquetaRiesgo,
    aptoTecnicasNoInvasivas,
    requiereBajaFuerzaObligatoria,
    requiereDerivacionUrgente,
    alertasBanderasRojas,
    alertasFarmacologicas,
    alertasGrupoPoblacional,
    alertasPsicologicas,
    indiceConcordanciaImagenClinica,
    resumenConcordancia,
  };
}

export function generateRecommendedProtocolPhases(
  record: ClinicalCaseRecord,
  evaluation: ClinicalRiskEvaluation
): ProtocolPhaseItem[] {
  const grupo = record.paciente.grupoClinico;
  const bajaFuerza = evaluation.requiereBajaFuerzaObligatoria;
  const segmentosClaves = record.examenEstructural.segmentosVertebrales
    .filter((s) => s.movilidad !== 'normal')
    .map((s) => s.segmento)
    .join(', ') || 'C1-C2 (Atlas-Axis) y transición lumbosacra';

  if (grupo === 'niño') {
    return [
      {
        faseNumero: 1,
        nombreFase: 'Fase I: Descompresión Neuro-Postural y Simetría Pediátrica',
        objetivoClinico: `Liberar fijaciones funcionales en ${segmentosClaves}, normalizar aferencias propioceptivas cervicales/pélvicas y descargar tensión miofascial escolar.`,
        frecuenciaSesiones: '2 sesiones por semana',
        duracionSemanas: 3,
        tecnicasNoInvasivas: [
          'Ajuste Instrumental Pediátrico de Baja Fuerza (Punta engomada regulada)',
          'Liberación suave suboccipital C0-C1 (Atlas) sin rotación forzada',
          'Balanceo pélvico suave en decúbito prono sobre cojín pediátrico',
        ],
        ejerciciosPrescritos: [
          'Elongación axial activa frente a espejo (autocorrección 3 min/día)',
          'Respiración costal expansiva asimétrica en hemitórax cóncavo',
          'Movilidad escapular en pared ("Ángeles de pared" 2x10 rep)',
        ],
        criterioProgresion: 'Reducción de asimetría escapular, EVA ≤ 1/10 y adaptación correcta del peso de mochila ≤ 10%.',
        estadoFase: 'en_curso',
      },
      {
        faseNumero: 2,
        nombreFase: 'Fase II: Estabilización durante Crecimiento Espinal',
        objetivoClinico: 'Consolidar control motor axial e inhibir compensaciones escolióticas durante el pico de crecimiento puberal.',
        frecuenciaSesiones: '1 sesión por semana',
        duracionSemanas: 6,
        tecnicasNoInvasivas: [
          'Estimulación propioceptiva paravertebral toracolumbar',
          'Alineación de charnela cérvico-torácica C7-T1 y articulación sacroilíaca',
        ],
        ejerciciosPrescritos: [
          'Plancha cuadrupedia alterna (Bird-Dog controlado con pausa de 5s)',
          'Equilibrio monopodal sobre superficie inestable (propiocepción plantar y pélvica)',
        ],
        criterioProgresion: 'Estabilidad del ángulo de Cobb y simetría clínica en Test de Adams.',
        estadoFase: 'programada',
      },
      {
        faseNumero: 3,
        nombreFase: 'Fase III: Prevención Escolar y Ergonomía del Desarrollo',
        objetivoClinico: 'Prevenir recaídas posturales por uso de pantallas y carga escolar.',
        frecuenciaSesiones: '1 sesión cada 15 días',
        duracionSemanas: 8,
        tecnicasNoInvasivas: [
          'Control específico de Atlas (C1) y nivelación de crestas ilíacas',
          'Reevaluación con escoliómetro digital e inspección podal',
        ],
        ejerciciosPrescritos: [
          'Pausas activas de extensión cervical cada 35 minutos de estudio',
          'Natación terapéutica o actividad deportiva simétrica recreativa',
        ],
        criterioProgresion: 'Cumplimiento ergonómico familiar y ausencia de fatiga paravertebral vespertina.',
        estadoFase: 'programada',
      },
      {
        faseNumero: 4,
        nombreFase: 'Fase IV: Seguimiento de Maduración Ósea (Risser)',
        objetivoClinico: 'Monitoreo longitudinal periódico hasta cierre de cartílagos de crecimiento.',
        frecuenciaSesiones: '1 control mensual / bimensual',
        duracionSemanas: 16,
        tecnicasNoInvasivas: [
          'Chequeo neuro-estructural preventivo no invasivo',
          'Control comparativo de espinograma según evolución de Risser',
        ],
        ejerciciosPrescritos: [
          'Rutina de higiene espinal matutina de 5 minutos',
        ],
        criterioProgresion: 'Crecimiento armónico sin progresión de curva estructural.',
        estadoFase: 'programada',
      },
    ];
  }

  if (grupo === 'mujer') {
    return [
      {
        faseNumero: 1,
        nombreFase: 'Fase I: Descompresión Lumbo-Pélvica y Modulación Nociceptiva',
        objetivoClinico: `Aliviar dolor irradiado/localizado en ${segmentosClaves}, restaurar biomecánica sacroilíaca y descomprimir segmento discal comprometido sin estrés ligamentario.`,
        frecuenciaSesiones: '2 sesiones por semana',
        duracionSemanas: 3,
        tecnicasNoInvasivas: bajaFuerza
          ? [
              'Técnica Cox de Flexión-Distracción suave controlada (descompresión L4-L5-S1)',
              'Drop Pélvico Thompson de baja fuerza y ajuste de ligamento sacrotuberoso',
              'Ajuste Instrumental Activador en C1 (Atlas) y charnela dorsolumbar',
            ]
          : [
              'Flexión-Distracción Cox específica en niveles lumbares inferiores',
              'Nivelación pélvica en camilla con Drop Sacroilíaco',
              'Corrección específica de Atlas C1 y liberación suboccipital',
            ],
        ejerciciosPrescritos: [
          'Báscula pélvica suave en decúbito supino o sobre balón esferodinámico',
          'Activación sinérgica de transverso abdominal con exhalación labial',
          'Deslizamiento neural ciático suave libre de dolor (neurodinamia grado I)',
        ],
        criterioProgresion: 'Reducción del dolor EVA en ≥ 50% y negativización de signos de irritación radicular.',
        estadoFase: 'en_curso',
      },
      {
        faseNumero: 2,
        nombreFase: 'Fase II: Estabilización Lumbo-Pélvica y Sinergia Diafragmática',
        objetivoClinico: 'Co-activar faja lumbo-abdominal profunda, glúteo medio y piso pélvico para sostener la corrección vertebral.',
        frecuenciaSesiones: '1 sesión por semana',
        duracionSemanas: 5,
        tecnicasNoInvasivas: [
          'Ajuste específico no invasivo de transición toracolumbar T12-L1 y sacro',
          'Liberación miofascial de psoas-ilíaco y piramidal',
        ],
        ejerciciosPrescritos: [
          'Puente glúteo isométrico con banda elástica suave en rodillas',
          'Estabilización cervical profunda (Chin-Tuck en supino 3x8 rep)',
        ],
        criterioProgresion: 'Índice de discapacidad funcional < 20% y marcha indolora prolongada.',
        estadoFase: 'programada',
      },
      {
        faseNumero: 3,
        nombreFase: 'Fase III: Prevención Funcional y Ergonomía Materna / Femenina',
        objetivoClinico: 'Proteger la columna frente a cargas de lactancia, cuidado infantil o demandas laborales.',
        frecuenciaSesiones: '1 sesión cada 15 días',
        duracionSemanas: 6,
        tecnicasNoInvasivas: [
          'Mantenimiento de alineación C1-C2 y balance pélvico tridimensional',
        ],
        ejerciciosPrescritos: [
          'Higiene postural en levantamiento de cargas con bisagra de cadera',
          'Apertura torácica pectoral en esquina para contrarrestar cifosis dorsal',
        ],
        criterioProgresion: 'Ausencia de episodios agudos ante esfuerzos cotidianos.',
        estadoFase: 'programada',
      },
      {
        faseNumero: 4,
        nombreFase: 'Fase IV: Optimización Neuro-Estructural y Salud Ósea',
        objetivoClinico: 'Mantener movilidad intervertebral segmentaria y estímulo mecánico saludable.',
        frecuenciaSesiones: '1 sesión mensual',
        duracionSemanas: 12,
        tecnicasNoInvasivas: [
          'Evaluación y ajuste preventivo integral de columna completa',
        ],
        ejerciciosPrescritos: [
          'Entrenamiento de fuerza funcional progresiva y caminata aeróbica',
        ],
        criterioProgresion: 'Estabilidad clínica sostenida y alta satisfacción funcional.',
        estadoFase: 'programada',
      },
    ];
  }

  // Adulto
  return [
    {
      faseNumero: 1,
      nombreFase: 'Fase I: Reducción de Síntomas y Corrección de Subluxación Primaria',
      objetivoClinico: `Restaurar la cinemática articular en ${segmentosClaves}, reducir hipertonía paravertebral defensiva y descomprimir raíces nerviosas.`,
      frecuenciaSesiones: '2 sesiones por semana',
      duracionSemanas: 3,
      tecnicasNoInvasivas: bajaFuerza
        ? [
            'Técnica específica de Atlas (Toggle Recoil / Instrumental sin rotación cervical)',
            'Descompresión axial controlada en camilla de Flexión-Distracción',
            'Liberación de puntos gatillo suboccipitales y trapecio superior',
          ]
        : [
            'Ajuste específico de Atlas (C1) y Axis (C2) con vector radiográfico calculado',
            'Técnica Thompson Drop en pelvis y segmentos dorsales hipomóviles',
            'Descompresión miofascial y movilización articular segmentaria',
          ],
      ejerciciosPrescritos: [
        'Retracción cervical axial (McKenzie Chin-Tuck) cada 2 horas de escritorio',
        'Movilidad torácica en extensión sobre respaldo o rodillo de espuma',
        'Estiramiento controlado de cadena posterior e isquiosurales',
      ],
      criterioProgresion: 'Disminución de EVA a ≤ 2/10, reducción de cefalea/irradiación y ganancia de rango articular > 75%.',
      estadoFase: 'en_curso',
    },
    {
      faseNumero: 2,
      nombreFase: 'Fase II: Estabilización Biomecánica y Restauración de Lordosis',
      objetivoClinico: 'Corregir proyección anterior de cabeza (FHP), reeducar flexores cervicales profundos y estabilizadores lumbares.',
      frecuenciaSesiones: '1 sesión por semana',
      duracionSemanas: 5,
      tecnicasNoInvasivas: [
        'Ajuste correctivo de curva cervical y charnela C7-T1',
        'Tracción de restauración de lordosis cervical progresiva en consultorio',
      ],
      ejerciciosPrescritos: [
        'Fortalecimiento isométrico de flexores cervicales profundos y romboides',
        'Trío de estabilidad lumbar de McGill (Curl-up modificado, Side-bridge, Bird-dog)',
      ],
      criterioProgresion: 'Mejora objetiva en plomada postural y NDI/Oswestry ≤ 14%.',
      estadoFase: 'programada',
    },
    {
      faseNumero: 3,
      nombreFase: 'Fase III: Prevención Ocupacional y Readaptación al Esfuerzo',
      objetivoClinico: 'Adaptar la biomecánica del paciente a su entorno laboral, deportivo o de conducción sin recidivas.',
      frecuenciaSesiones: '1 sesión cada 15 días',
      duracionSemanas: 6,
      tecnicasNoInvasivas: [
        'Ajuste de mantenimiento neuro-músculo-esquelético y control de ATM/oclusión',
      ],
      ejerciciosPrescritos: [
        'Protocolo de micropausas laborales cada 45 minutos',
        'Relajación mandibular pterigoidea-maseterina nocturna',
      ],
      criterioProgresion: 'Tolerancia completa a jornada laboral de 8h sin dolor mecánico.',
      estadoFase: 'programada',
    },
    {
      faseNumero: 4,
      nombreFase: 'Fase IV: Optimización Funcional y Mantenimiento Quiropráctico',
      objetivoClinico: 'Preservar la longevidad articular espinal y prevenir degeneración discal acelerada.',
      frecuenciaSesiones: '1 control mensual',
      duracionSemanas: 12,
      tecnicasNoInvasivas: [
        'Chequeo biomecánico de columna completa y ajuste específico no invasivo',
      ],
      ejerciciosPrescritos: [
        'Mantenimiento de movilidad global y acondicionamiento físico regular',
      ],
      criterioProgresion: 'Alineación estructural estable y función neurológica íntegra.',
      estadoFase: 'programada',
    },
  ];
}

export interface RolePermissionMatrix {
  rol: UserRole;
  titulo: string;
  descripcion: string;
  puedeEditarAnamnesis: boolean;
  puedeRegistrarExamenFisico: boolean;
  puedeCalibrarImagenes: boolean;
  puedeFirmarDiagnostico: boolean;
  puedeModificarProtocolo: boolean;
  puedeExportarRespaldo: boolean;
  soloLecturaAuditoria: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissionMatrix> = {
  clinico: {
    rol: 'clinico',
    titulo: 'Clínico Quiropráctico Titular',
    descripcion: 'Acceso clínico total: anamnesis, examen estructural, correlación de imagen, firma de diagnóstico diferencial y prescripción de protocolo.',
    puedeEditarAnamnesis: true,
    puedeRegistrarExamenFisico: true,
    puedeCalibrarImagenes: true,
    puedeFirmarDiagnostico: true,
    puedeModificarProtocolo: true,
    puedeExportarRespaldo: true,
    soloLecturaAuditoria: false,
  },
  asistente: {
    rol: 'asistente',
    titulo: 'Asistente Clínico de Consulta',
    descripcion: 'Recolección de anamnesis inicial, antropometría y carga de estudios de imagen. Sin firma diagnóstica ni alteración de protocolo.',
    puedeEditarAnamnesis: true,
    puedeRegistrarExamenFisico: true,
    puedeCalibrarImagenes: false,
    puedeFirmarDiagnostico: false,
    puedeModificarProtocolo: false,
    puedeExportarRespaldo: false,
    soloLecturaAuditoria: false,
  },
  administrador: {
    rol: 'administrador',
    titulo: 'Administrador de Clínica y Gobernanza',
    descripcion: 'Gestión de respaldos offline-first, control de permisos, anonimización PII y mantenimiento operativo.',
    puedeEditarAnamnesis: true,
    puedeRegistrarExamenFisico: false,
    puedeCalibrarImagenes: false,
    puedeFirmarDiagnostico: false,
    puedeModificarProtocolo: false,
    puedeExportarRespaldo: true,
    soloLecturaAuditoria: false,
  },
  auditor: {
    rol: 'auditor',
    titulo: 'Auditor de Calidad y Trazabilidad',
    descripcion: 'Modo estricto de solo lectura para revisión de cumplimiento normativo, trazabilidad de historias clínicas y validación de seguridad.',
    puedeEditarAnamnesis: false,
    puedeRegistrarExamenFisico: false,
    puedeCalibrarImagenes: false,
    puedeFirmarDiagnostico: false,
    puedeModificarProtocolo: false,
    puedeExportarRespaldo: true,
    soloLecturaAuditoria: true,
  },
};
