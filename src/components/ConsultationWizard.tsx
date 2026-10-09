import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Edit3,
  Mic,
  Pause,
  Play,
  Ruler,
  Search,
  Square,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import rxCervicalImg from '../assets/images/rx_cervical_lateral_1791388476879.jpg';
import rmnLumbarImg from '../assets/images/rmn_lumbar_sagital_1791388492095.jpg';
import rxEscoliosisImg from '../assets/images/rx_escoliosis_ap_1791388505857.jpg';
import {
  LiveClinicalScribePanel,
  ScribeExtractedPayload,
} from './LiveClinicalScribePanel';
import {
  ConsultationRecord,
  DicomStudyItem,
  PatientProfileGroup,
  PatientRecord,
} from '../types/wireframeTypes';

interface ConsultationWizardProps {
  patients: PatientRecord[];
  initialPatientId?: string;
  initialConsultationToEdit?: ConsultationRecord | null;
  onCreatePatient: (newPatient: PatientRecord) => void;
  onSaveConsultation: (
    consultation: ConsultationRecord,
    openPdfAfterSave: boolean
  ) => void;
  onCancel: () => void;
}

function formatSeconds(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const ConsultationWizard: React.FC<ConsultationWizardProps> = ({
  patients,
  initialPatientId,
  initialConsultationToEdit,
  onCreatePatient,
  onSaveConsultation,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(
    initialConsultationToEdit ? 2 : 1
  );
  const [confirmCancelModal, setConfirmCancelModal] = useState(false);
  const [autoSaveTimestamp, setAutoSaveTimestamp] = useState<string>(
    'Guardado automático'
  );
  const [showLiveScribePanel, setShowLiveScribePanel] = useState<boolean>(true);
  const [liveTranscript, setLiveTranscript] = useState<string>(
    initialConsultationToEdit?.transcripcionCharla ||
      ''
  );
  const [informeCompletoCharla, setInformeCompletoCharla] = useState<
    ConsultationRecord['informeCompletoCharla']
  >(initialConsultationToEdit?.informeCompletoCharla);

  // PASO 1: Seleccionar o Crear Paciente
  const [patientMode, setPatientMode] = useState<'existente' | 'nuevo'>(
    'existente'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialConsultationToEdit?.pacienteId ||
      initialPatientId ||
      patients[0]?.id ||
      'pat-juan'
  );

  // Campos para crear paciente nuevo en Paso 1 (con DOB y cálculo automático de edad)
  const [newPatNombre, setNewPatNombre] = useState('');
  const [newPatDob, setNewPatDob] = useState('');
  const [newPatEdad, setNewPatEdad] = useState(0);
  const [newPatGenero, setNewPatGenero] = useState<
    'Masculino' | 'Femenino' | 'No especificado'
  >(
    'No especificado'
  );
  const [newPatProfesion, setNewPatProfesion] = useState('');
  const [newPatCiudad, setNewPatCiudad] = useState('Salta');
  const [newPatTelefono, setNewPatTelefono] = useState('');
  const [newPatEmail, setNewPatEmail] = useState('');

  const selectedPatient =
    patients.find((p) => p.id === selectedPatientId) || patients[0];

  // PASO 2: Anamnesis (Fase 1: 1.1 a 1.5)
  const [perfilGrupo, setPerfilGrupo] = useState<PatientProfileGroup>(
    initialConsultationToEdit?.perfilGrupo ||
      selectedPatient?.perfilGrupo ||
      (selectedPatient && selectedPatient.edad < 16
        ? 'NIÑO'
        : selectedPatient?.genero === 'Femenino'
        ? 'MUJER_ADULTA'
        : 'ADULTO')
  );
  const [profesion, setProfesion] = useState(
    initialConsultationToEdit?.anamnesis.profesion ||
      selectedPatient?.profesion ||
      'Contador'
  );
  const [ciudad, setCiudad] = useState(
    initialConsultationToEdit?.anamnesis.ciudad ||
      selectedPatient?.ciudad ||
      'Salta'
  );
  const [horasSedentario, setHorasSedentario] = useState(
    initialConsultationToEdit?.anamnesis.horasSedentarioDia ??
      selectedPatient?.horasSedentarioDia ??
      8
  );
  const [horasComputadora, setHorasComputadora] = useState(
    initialConsultationToEdit?.anamnesis.horasComputadoraDia ??
      selectedPatient?.horasComputadoraDia ??
      7
  );
  const [horasSmartphone, setHorasSmartphone] = useState(
    initialConsultationToEdit?.anamnesis.horasSmartphoneDia ??
      selectedPatient?.horasSmartphoneDia ??
      5
  );

  // Campos específicos por perfil (Niño / Mujer Adulta / Adulto)
  const [pesoMochilaNino, setPesoMochilaNino] = useState(
    initialConsultationToEdit?.anamnesis.contextoNino?.pesoMochilaKg ?? 5.5
  );
  const [posturaEscolarNino, setPosturaEscolarNino] = useState(
    initialConsultationToEdit?.anamnesis.contextoNino?.posturaEscolar ||
      'Inclinación en pupitre + uso de celular en cama'
  );
  const [deporteInfancia, setDeporteInfancia] = useState(
    initialConsultationToEdit?.anamnesis.contextoAdulto?.deporteInfancia ||
      initialConsultationToEdit?.anamnesis.contextoNino?.deportesInfancia ||
      'Básquetbol / Natación escolar'
  );
  const [deporteActual, setDeporteActual] = useState(
    initialConsultationToEdit?.anamnesis.contextoAdulto?.deporteActual ||
      initialConsultationToEdit?.anamnesis.contextoNino?.deportesActuales ||
      'Fútbol recreativo 1x/semana'
  );
  const [hijosMujer, setHijosMujer] = useState(
    initialConsultationToEdit?.anamnesis.contextoMujer?.cantidadHijos ?? 2
  );
  const [sobrecargaMujer, setSobrecargaMujer] = useState(
    initialConsultationToEdit?.anamnesis.contextoMujer?.nivelSobrecarga1a10 ?? 8
  );
  const [diccionarioKeywords, setDiccionarioKeywords] = useState(
    (
      initialConsultationToEdit?.diccionarioCliente ||
      selectedPatient?.diccionarioCliente || [
        'Cintura trabada al levantarme de la silla',
        'Pinchazo lumbar derecho al agacharme',
      ]
    ).join(' | ')
  );

  const [problemaHoy, setProblemaHoy] = useState(
    initialConsultationToEdit?.anamnesis.problemaDeHoy ||
      'Dolor en la espalda baja desde hace 3 meses de evolución, originado por sedentarismo y largo tiempo frente a computadora (8h/día). Refiere dolor tipo mecánico que mejora con reposo.'
  );

  // Grabación de audio/video en Paso 2
  const [isRecordingStep2, setIsRecordingStep2] = useState(false);
  const [step2Seconds, setStep2Seconds] = useState(
    initialConsultationToEdit?.anamnesis.duracionAudioSegundos ?? 35
  );
  const [isPlayingStep2, setIsPlayingStep2] = useState(false);
  const [audioSavedMsg, setAudioSavedMsg] = useState<string | null>(null);

  const [antecedentes, setAntecedentes] = useState(
    initialConsultationToEdit?.anamnesis.antecedentes || {
      escoliosis: false,
      cifosis: false,
      lordosis: true,
      asma: false,
      tiroides: false,
      otrosTexto: '',
      asimetriaPiernas: 'Derecha -6 mm funcional',
      desviacionCadera: true,
    }
  );

  // PASO 3: Evaluación Clínica (Fase 2: 2.1 a 2.4 + Eje Cadera + Nervio Ciático + Psicofármacos)
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraStreamError, setCameraStreamError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isMicRecordingStep3, setIsMicRecordingStep3] = useState(false);
  const [isMicPausedStep3, setIsMicPausedStep3] = useState(false);
  const [step3Seconds, setStep3Seconds] = useState(
    initialConsultationToEdit?.evaluacionClinica.duracionGrabacionSegundos ?? 135
  );
  const [micLevel, setMicLevel] = useState(55);

  const [notasClinicasTexto, setNotasClinicasTexto] = useState(
    (
      initialConsultationToEdit?.evaluacionClinica.notasTiempoReal || [
        'Postura: Lordosis lumbar acentuada',
        'Hombros: Asimetría derecha elevada',
        'Cadera: Inclinación anterior',
        'Dolor a la palpación L4-L5',
        'Restricción de flexión: 30°',
        'Fuerza glúteos: 4/5',
      ]
    ).join('\n')
  );
  const [nuevaNotaInput, setNuevaNotaInput] = useState('');

  const [pruebasRealizadas, setPruebasRealizadas] = useState(
    initialConsultationToEdit?.evaluacionClinica.pruebasRealizadas || {
      posturaEnPie: true,
      movilidad: true,
      fuerza: false,
      neurologico: false,
      camillaSupino: true,
      cadera: true,
      palpacion: false,
      especiales: false,
    }
  );

  const [tablaFisica, setTablaFisica] = useState(
    initialConsultationToEdit?.evaluacionClinica.tablaResultadosFisicos || [
      { prueba: 'Flexión anterior', resultado: '30°' },
      { prueba: 'Fuerza glúteos', resultado: '4/5' },
      { prueba: 'Cadera abd.', resultado: 'Normal' },
    ]
  );

  // Fase 2.2 y 2.4: Eje Cadera, Relato Ciático y Psicología/Psicofármacos
  const [ejeCaderaHallazgo, setEjeCaderaHallazgo] = useState(
    initialConsultationToEdit?.evaluacionClinica.maniobrasEjeCadera
      ?.ejeCaderaCentroGravedad ||
      'Aunque el paciente refiera síntoma superior o lumbar, evaluamos el eje principal: CADERA (centro de gravedad). Se detecta anteversión ilíaca derecha que altera toda la cadena cinética ascendente.'
  );
  const [relatoCiatico, setRelatoCiatico] = useState(
    initialConsultationToEdit?.evaluacionClinica.maniobrasEjeCadera
      ?.relatoNervioCiatico ||
      'Mientras se palpa L4-L5 y glúteo, se explica al paciente: "El nervio ciático va de tu cintura a tu pie", correlacionando el bloqueo de cadera con su síntoma en tiempo real.'
  );
  const [medicacionPsicotropa, setMedicacionPsicotropa] = useState(
    initialConsultationToEdit?.evaluacionClinica.pruebaPsicologica
      ?.medicacionPsicotropa || 'Ninguno (Sin psicofármacos activos)'
  );
  const [actitudPsicologica, setActitudPsicologica] = useState<
    'Colaborador' | 'Defensivo' | 'Ansioso' | 'No evaluado'
  >(
    initialConsultationToEdit?.evaluacionClinica.pruebaPsicologica?.actitud ||
      'No evaluado'
  );

  // PASO 4: Visor DICOM y Análisis de Imágenes (Fase 3: 3.1 a 3.3)
  const [dicomStudies, setDicomStudies] = useState<DicomStudyItem[]>(
    initialConsultationToEdit?.imagenes.estudiosHistorial || [
      {
        id: 'rad-1',
        etiquetaCorta: 'Rad1',
        fechaCorta: 'Oct 8',
        estudio: 'Radiografía / RMN',
        fechaCompleta: 'Oct 8, 2024',
        region: 'Lumbar',
        tecnica: 'RP (Frente / Sagital)',
        corteOrientacion: 'Sagital (Lateral)',
        imageUrl: rmnLumbarImg,
        hallazgos: [
          { texto: 'Rectificación L-dorsal', activo: true },
          { texto: 'Listesis L4-L5 (Gr.1)', activo: true },
          { texto: 'Osteofitos L5-S1', activo: true },
        ],
        impresion:
          'Cambios degenerativos moderados. Compatible con antecedentes clínicos.',
        anotacionesMedico:
          'Señalar rectificación, hernias, etc. La anotación se guarda automáticamente en el expediente.',
        trazosDibujo: [
          {
            x1: 38,
            y1: 58,
            x2: 62,
            y2: 60,
            tipo: 'regla',
            etiqueta: 'L4-L5 (Gr.1)',
          },
        ],
      },
      {
        id: 'rad-2',
        etiquetaCorta: 'Rad2',
        fechaCorta: 'Sep20',
        estudio: 'Radiografía',
        fechaCompleta: 'Sep 20, 2024',
        region: 'Cervical',
        tecnica: 'Lateral (Perfil)',
        corteOrientacion: 'Sagital (Lateral)',
        imageUrl: rxCervicalImg,
        hallazgos: [
          { texto: 'Rectificación L-dorsal', activo: true },
          { texto: 'Pinzamiento C5-C6', activo: true },
        ],
        impresion: 'Rectificación cervical postural.',
        anotacionesMedico: 'Control evolutivo cervical.',
        trazosDibujo: [],
      },
      {
        id: 'rad-3',
        etiquetaCorta: 'Rad3',
        fechaCorta: 'Aug15',
        estudio: 'Espinograma',
        fechaCompleta: 'Aug 15, 2024',
        region: 'Toracolumbar',
        tecnica: 'RP (Frente)',
        corteOrientacion: 'Coronal (Frontal AP)',
        imageUrl: rxEscoliosisImg,
        hallazgos: [
          { texto: 'Curva toracolumbar 12°', activo: true },
          { texto: 'Basculación pélvica 4°', activo: true },
        ],
        impresion: 'Actitud escoliótica funcional compensatoria.',
        anotacionesMedico: 'Estudio basal panorámico.',
        trazosDibujo: [],
      },
    ]
  );

  const [activeDicomId, setActiveDicomId] = useState<string>(
    dicomStudies[0]?.id || 'rad-1'
  );
  const [dicomZoom, setDicomZoom] = useState<number>(1.0);
  const [dicomBrightness, setDicomBrightness] = useState<number>(100);
  const [dicomContrast, setDicomContrast] = useState<number>(105);
  const [activeTool, setActiveTool] = useState<'ninguna' | 'lapiz' | 'regla'>(
    'ninguna'
  );
  const [pendingPoint, setPendingPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [newFindingText, setNewFindingText] = useState('');

  // Diagnóstico Diferencial Visual 3.3 (Confirmada, Probable, Descartada, No visible)
  const [ddConfirmada, setDdConfirmada] = useState(
    initialConsultationToEdit?.imagenes.diagnosticoDiferencialVisual
      ?.confirmada ||
      'Síndrome facetario L4-L5 con anterolistesis grado I (Meyerding) y desbalance de eje cadera.'
  );
  const [ddProbable, setDdProbable] = useState(
    initialConsultationToEdit?.imagenes.diagnosticoDiferencialVisual
      ?.probable ||
      'Irritación mecánico-miofascial del nervio ciático proximal por tensión de psoas/piramidal.'
  );
  const [ddDescartada, setDdDescartada] = useState(
    initialConsultationToEdit?.imagenes.diagnosticoDiferencialVisual
      ?.descartada || 'Extrusión discal masiva o fractura vertebral.'
  );
  const [ddNoVisible, setDdNoVisible] = useState(
    initialConsultationToEdit?.imagenes.diagnosticoDiferencialVisual
      ?.noVisible || 'Microinestabilidad ligamentaria en flexión dinámica.'
  );

  // PASO 5: Motor de Protocolo Personalizado (Fase 4)
  const [engineAnalysing, setEngineAnalysing] = useState(false);
  const [engineProgressStep, setEngineProgressStep] = useState(5);
  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);

  const [diagnosticoPrincipal, setDiagnosticoPrincipal] = useState(
    initialConsultationToEdit?.protocolo.diagnosticoPrincipal ||
      'Síndrome facetario lumbar L4-L5'
  );
  const [diagnosticoSecundario, setDiagnosticoSecundario] = useState(
    initialConsultationToEdit?.protocolo.diagnosticoSecundario ||
      'Secundario a rectificación L-dorsal'
  );
  const [etiologia, setEtiologia] = useState(
    initialConsultationToEdit?.protocolo.etiologia ||
      'Sedentarismo laboral prolongado + uso excesivo de pantallas + debilidad muscular de estabilizadores'
  );

  const [fase1, setFase1] = useState(
    initialConsultationToEdit?.protocolo.fase1 || {
      titulo: 'FASE 1: Alivio agudo (4 semanas)',
      ajustes: '2x/semana (L4-L5, cadera)',
      complementos: 'Taping, hielo',
      restriccion: 'Evitar flexión extrema',
    }
  );
  const [fase2, setFase2] = useState(
    initialConsultationToEdit?.protocolo.fase2 || {
      titulo: 'FASE 2: Fortalecimiento (8 semanas)',
      ajustes: '1x/semana',
      ejercicios: '3x/semana (glúteos, core)',
      ergonomia: 'Ajustes en oficina',
    }
  );
  const [fase3, setFase3] = useState(
    initialConsultationToEdit?.protocolo.fase3 || {
      titulo: 'FASE 3: Prevención (mantenimiento)',
      ajustes: '1x/mes',
      ejerciciosCasa: '5x/semana',
      educacion: 'Posturas correctas',
    }
  );
  const [fase4, setFase4] = useState(
    initialConsultationToEdit?.protocolo.fase4 || {
      titulo: 'FASE 4: Optimización y Rendimiento Funcional',
      optimizacionRendimiento:
        'Corrección postural completa y readaptación deportiva',
      integracionNeuromuscular:
        'Integración de patrón neuromuscular de eje cadera-columna',
    }
  );

  const [objetivosCorto, setObjetivosCorto] = useState(
    (
      initialConsultationToEdit?.protocolo.objetivosCortoPlazo || [
        'Dolor: 8→4 (escala)',
        'Flexión: 30→60°',
        'Trabajar sin dolor',
      ]
    ).join('\n')
  );
  const [objetivosLargo, setObjetivosLargo] = useState(
    (
      initialConsultationToEdit?.protocolo.objetivosLargoPlazo || [
        'Mantener sin recaídas',
        'Fuerza: 5/5 (glúteos)',
        'Postura normolordótica',
      ]
    ).join('\n')
  );

  // Sincronizar datos del paciente cuando cambia la selección en Paso 1
  const handleSelectExistingPatient = (pat: PatientRecord) => {
    setSelectedPatientId(pat.id);
    setProfesion(pat.profesion);
    setCiudad(pat.ciudad);
    setHorasSedentario(pat.horasSedentarioDia);
    setHorasComputadora(pat.horasComputadoraDia);
    setHorasSmartphone(pat.horasSmartphoneDia);
    if (pat.perfilGrupo) {
      setPerfilGrupo(pat.perfilGrupo);
    } else {
      setPerfilGrupo(
        pat.edad < 16
          ? 'NIÑO'
          : pat.genero === 'Femenino'
          ? 'MUJER_ADULTA'
          : 'ADULTO'
      );
    }
    if (pat.diccionarioCliente) {
      setDiccionarioKeywords(pat.diccionarioCliente.join(' | '));
    }
    setAutoSaveTimestamp(`Paciente ${pat.nombreCompleto} seleccionado`);
  };

  // Cálculo automático de edad al cambiar Fecha de Nacimiento
  const handleDobChange = (dobStr: string) => {
    setNewPatDob(dobStr);
    if (!dobStr) return;
    const birthDate = new Date(`${dobStr}T00:00:00`);
    const today = new Date();
    if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
      setNewPatEdad(0);
      return;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    if (
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }
    setNewPatEdad(age);
  };

  // Timer de grabación en Paso 2
  useEffect(() => {
    if (!isRecordingStep2) return;
    const interval = setInterval(() => {
      setStep2Seconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecordingStep2]);

  // Timer y nivel de micrófono en Paso 3
  useEffect(() => {
    if (!isMicRecordingStep3 || isMicPausedStep3) return;
    const interval = setInterval(() => {
      setStep3Seconds((prev) => prev + 1);
      setMicLevel(Math.floor(35 + Math.random() * 55));
    }, 1000);
    return () => clearInterval(interval);
  }, [isMicRecordingStep3, isMicPausedStep3]);

  // Limpiar cámara al salir del Paso 3 o desmontar
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleLiveCamera = async () => {
    if (isLiveCameraActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      setIsLiveCameraActive(false);
      return;
    }

    setIsLiveCameraActive(true);
    setCameraStreamError(false);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraStreamError(true);
      }
    } catch {
      setCameraStreamError(true);
    }
  };

  const triggerAutomaticProtocolEngine = () => {
    setEngineAnalysing(true);
    setEngineProgressStep(1);
    const t1 = setTimeout(() => setEngineProgressStep(2), 400);
    const t2 = setTimeout(() => setEngineProgressStep(3), 800);
    const t3 = setTimeout(() => setEngineProgressStep(4), 1200);
    const t4 = setTimeout(() => {
      setEngineProgressStep(5);
      setEngineAnalysing(false);
    }, 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  const activeDicomStudy =
    dicomStudies.find((s) => s.id === activeDicomId) || dicomStudies[0];

  const handleDicomCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'ninguna' || !activeDicomStudy) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (!pendingPoint) {
      setPendingPoint({ x, y });
    } else {
      const dist = Math.round(
        Math.hypot(x - pendingPoint.x, y - pendingPoint.y) * 0.45
      );
      const nuevoTrazo = {
        x1: pendingPoint.x,
        y1: pendingPoint.y,
        x2: x,
        y2: y,
        tipo: activeTool,
        etiqueta:
          activeTool === 'regla'
            ? `${dist} mm / ${Math.round(dist * 1.1)}°`
            : 'Marca',
      };

      setDicomStudies((prev) =>
        prev.map((st) =>
          st.id === activeDicomStudy.id
            ? { ...st, trazosDibujo: [...st.trazosDibujo, nuevoTrazo] }
            : st
        )
      );
      setPendingPoint(null);
      setAutoSaveTimestamp('Anotación guardada en imagen DICOM');
    }
  };

  const handleUploadNewDicom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      const newId = `rad-${Date.now()}`;
      const newStudy: DicomStudyItem = {
        id: newId,
        etiquetaCorta: `Rad${dicomStudies.length + 1}`,
        fechaCorta: 'Hoy',
        estudio: file.name.replace(/\.[^/.]+$/, ''),
        fechaCompleta: 'Oct 10, 2024',
        region: 'Columna Vertebral',
        tecnica: 'DICOM / Digital',
        corteOrientacion: 'Sagital (Lateral)',
        imageUrl: dataUrl,
        hallazgos: [
          { texto: 'Rectificación L-dorsal', activo: true },
          { texto: 'Listesis L4-L5 (Gr.1)', activo: false },
        ],
        impresion: 'Estudio cargado en consulta actual.',
        anotacionesMedico: 'Imagen incorporada para correlación clínica.',
        trazosDibujo: [],
      };
      setDicomStudies((prev) => [newStudy, ...prev]);
      setActiveDicomId(newId);
    };
    reader.readAsDataURL(file);
  };

  const buildFinalConsultationRecord = (): ConsultationRecord => {
    let pat = selectedPatient;
    if (patientMode === 'nuevo' && newPatNombre.trim()) {
      const fullName = newPatNombre.trim();
      const first = fullName.split(' ')[0] || fullName;
      const last = fullName.split(' ').slice(1).join(' ') || '';
      const existingMatch = patients.find(
        (p) => p.nombreCompleto.toLowerCase() === fullName.toLowerCase()
      );
      if (existingMatch) {
        pat = existingMatch;
      } else {
        const created: PatientRecord = {
          id: `pat-${Date.now()}`,
          nombre: first,
          apellidos: last,
          nombreCompleto: fullName,
          fechaNacimiento: newPatDob,
          edad: newPatEdad,
          genero: newPatGenero,
          perfilGrupo,
          profesion: profesion || newPatProfesion || 'Particular',
          ciudad: ciudad || newPatCiudad || 'Salta',
          telefono: newPatTelefono.trim(),
          email: newPatEmail.trim(),
          ultimaCita: 'Hoy',
          proximaCita: 'Oct 17',
          estado: 'Tratamiento',
          horasSedentarioDia: horasSedentario,
          horasComputadoraDia: horasComputadora,
          horasSmartphoneDia: horasSmartphone,
          diccionarioCliente: diccionarioKeywords
            .split('|')
            .map((s) => s.trim())
            .filter(Boolean),
        };
        onCreatePatient(created);
        setSelectedPatientId(created.id);
        pat = created;
      }
    }
    return {
      id: initialConsultationToEdit?.id || `cons-${Date.now()}`,
      pacienteId: pat.id,
      pacienteNombre:
        patientMode === 'nuevo' && newPatNombre.trim()
          ? newPatNombre.trim()
          : pat.nombreCompleto,
      pacienteEdad:
        patientMode === 'nuevo' && newPatNombre.trim() ? newPatEdad : pat.edad,
      pacienteGenero:
        patientMode === 'nuevo' && newPatNombre.trim()
          ? newPatGenero
          : pat.genero,
      perfilGrupo,
      pacienteProfesion: profesion,
      pacienteCiudad: ciudad,
      fechaConsulta: 'Martes, 10 de Octubre de 2024',
      estadoConsulta: 'Tratamiento',
      patologiaFiltro: diagnosticoPrincipal,
      diccionarioCliente: diccionarioKeywords
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean),
      anamnesis: {
        profesion,
        ciudad,
        horasSedentarioDia: horasSedentario,
        horasComputadoraDia: horasComputadora,
        horasSmartphoneDia: horasSmartphone,
        problemaDeHoy: problemaHoy,
        duracionAudioSegundos: step2Seconds,
        antecedentes,
        contextoNino:
          perfilGrupo === 'NIÑO'
            ? {
                horasClaseDia: horasSedentario,
                posturaEscolar: posturaEscolarNino,
                deportesActuales: deporteActual,
                deportesInfancia: deporteInfancia,
                pesoMochilaKg: pesoMochilaNino,
                posturasHabituales: posturaEscolarNino,
              }
            : undefined,
        contextoMujer:
          perfilGrupo === 'MUJER_ADULTA'
            ? {
                cantidadHijos: hijosMujer,
                actividadesAdicionales: profesion,
                nivelSobrecarga1a10: sobrecargaMujer,
                actividadPostParto: deporteActual,
                pesoActualKg: 64,
              }
            : undefined,
        contextoAdulto:
          perfilGrupo === 'ADULTO'
            ? {
                tipoTrabajo: 'oficina',
                distanciaPantallaCm: 65,
                deporteActual,
                deporteInfancia,
                soportesPosturales: 'Sin soporte lumbar previo',
              }
            : undefined,
      },
      evaluacionClinica: {
        duracionGrabacionSegundos: step3Seconds,
        notasTiempoReal: notasClinicasTexto
          .split('\n')
          .map((l) => l.replace(/^•\s*/, '').trim())
          .filter(Boolean),
        pruebasRealizadas,
        tablaResultadosFisicos: tablaFisica,
        pruebaPsicologica: {
          actitud: actitudPsicologica,
          humor: 'Neutral',
          eventosVitales: 'Sobrecarga ocupacional/escolar evaluada',
          medicacionPsicotropa,
          implicacionClinica:
            medicacionPsicotropa !== 'Ninguno (Sin psicofármacos activos)'
              ? 'Atención: Fármaco activo puede modular umbral de dolor y respuesta neuromuscular.'
              : 'Respuesta neuromuscular y propioceptiva sin alteración farmacológica.',
        },
        maniobrasEjeCadera: {
          observacionDePie:
            'Evaluación de plomada frontal, lateral y posterior completada.',
          evaluacionCamilla:
            'Pruebas de Thomas, Ober, Psoas y palpación segmentaria en decúbito.',
          ejeCaderaCentroGravedad: ejeCaderaHallazgo,
          relatoNervioCiatico: relatoCiatico,
          tonoMuscular:
            'Hipertonía paravertebral defensiva en segmento primario.',
        },
      },
      imagenes: {
        estudioSeleccionadoId: activeDicomId,
        zoom: dicomZoom,
        brillo: dicomBrightness,
        contraste: dicomContrast,
        estudiosHistorial: dicomStudies,
        diagnosticoDiferencialVisual: {
          confirmada: ddConfirmada,
          probable: ddProbable,
          descartada: ddDescartada,
          noVisible: ddNoVisible,
          impactoFuncionalPronostico:
            'Reversible con corrección de eje de cadera, ajuste segmentario e higiene postural.',
        },
      },
      protocolo: {
        diagnosticoPrincipal,
        diagnosticoSecundario,
        etiologia,
        fase1,
        fase2,
        fase3,
        fase4,
        objetivosCortoPlazo: objetivosCorto
          .split('\n')
          .map((s) => s.replace(/^•\s*/, '').trim())
          .filter(Boolean),
        objetivosMedianoPlazo: [
          'Eliminar dolor agudo',
          'Recuperar función completa',
          'Fortalecimiento muscular 5/5',
          'Independencia de tratamiento',
        ],
        objetivosLargoPlazo: objetivosLargo
          .split('\n')
          .map((s) => s.replace(/^•\s*/, '').trim())
          .filter(Boolean),
        proximaCitaFechaHora: 'Martes, 17 de Octubre de 2024 - 10:00 AM',
        signosProgresoSemanas: {
          semana1a2:
            'Reducción del dolor agudo inicial y mayor libertad al levantarse.',
          semana3a4:
            'Incremento de amplitud articular (30° → 60°) y menor tensión muscular.',
          semana5a8:
            'Estabilización de cadera y core con fuerza 5/5 sin dolor laboral.',
          semana9a12:
            'Consolidación de hábitos posturales y prevención de recaídas.',
        },
        razonamientoMedico: {
          porQuePatologia: ddConfirmada,
          diferencialesDescartados: ddDescartada,
          riesgosContraindicaciones:
            perfilGrupo === 'NIÑO'
              ? 'Técnicas suaves pediátricas adaptadas a cartílagos de crecimiento.'
              : 'Evitar flexión/rotación extrema en segmento con listesis o dolor agudo.',
          puntosContactoDireccionAjuste:
            'Corrección primaria de eje de cadera/sacroilíaca + ajuste segmentario específico L4-L5 / C1.',
          criteriosAlta:
            'Ausencia de dolor, movilidad simétrica completa y autonomía en ejercicios domiciliarios.',
        },
      },
      transcripcionCharla: liveTranscript,
      informeCompletoCharla,
      seguimientos: initialConsultationToEdit?.seguimientos || [
        {
          id: `seg-${Date.now()}`,
          fecha: '2024-10-10',
          dolorEva: 8,
          flexionGrados: 30,
          fuerzaGluteos: '4/5',
          notaProgreso: 'Consulta inicial completada y protocolo generado.',
        },
      ],
    };
  };

  // Autocompletar todos los campos fundamentales de la consulta desde la charla en vivo
  const handleApplyLiveScribeExtraction = (
    payload: ScribeExtractedPayload,
    fullTranscript: string
  ) => {
    setLiveTranscript(fullTranscript);
    setInformeCompletoCharla(payload.informeCompletoCharla);

    const fullName =
      `${payload.datosPaciente.nombre} ${payload.datosPaciente.apellidos}`.trim();

    // Verificar si coincide con algún paciente existente o autocompletar como paciente nuevo
    const existing = patients.find(
      (p) =>
        p.nombreCompleto.toLowerCase() === fullName.toLowerCase() ||
        p.nombre.toLowerCase() === payload.datosPaciente.nombre.toLowerCase()
    );

    if (existing) {
      setPatientMode('existente');
      setSelectedPatientId(existing.id);
    } else {
      setPatientMode('nuevo');
    }

    setNewPatNombre(fullName);
    if (payload.datosPaciente.fechaNacimientoEstimada) {
      setNewPatDob(payload.datosPaciente.fechaNacimientoEstimada);
    }
    setNewPatEdad(payload.datosPaciente.edad);
    setNewPatGenero(payload.datosPaciente.genero);
    setNewPatProfesion(payload.datosPaciente.profesion);
    setNewPatCiudad(payload.datosPaciente.ciudad);
    if (payload.datosPaciente.telefono) {
      setNewPatTelefono(payload.datosPaciente.telefono);
    }
    if (payload.datosPaciente.email) {
      setNewPatEmail(payload.datosPaciente.email);
    }

    // Paso 2: Anamnesis
    setPerfilGrupo(payload.datosPaciente.perfilGrupo);
    setProfesion(payload.datosPaciente.profesion);
    setCiudad(payload.datosPaciente.ciudad);
    setHorasSedentario(payload.datosPaciente.horasSedentarioDia);
    setHorasComputadora(payload.datosPaciente.horasComputadoraDia);
    setHorasSmartphone(payload.datosPaciente.horasSmartphoneDia);
    if (
      payload.anamnesisExtraida.problemaDeHoy !==
      'Pendiente de completar por el profesional.'
    ) {
      setProblemaHoy(payload.anamnesisExtraida.problemaDeHoy);
    }
    if (payload.anamnesisExtraida.diccionarioCliente?.length) {
      setDiccionarioKeywords(
        payload.anamnesisExtraida.diccionarioCliente.join(' | ')
      );
    }
    setAntecedentes((prev) => ({
      ...prev,
      escoliosis: payload.anamnesisExtraida.escoliosis || prev.escoliosis,
      cifosis: payload.anamnesisExtraida.cifosis || prev.cifosis,
      lordosis: payload.anamnesisExtraida.lordosis || prev.lordosis,
      asma: payload.anamnesisExtraida.asma || prev.asma,
      tiroides: payload.anamnesisExtraida.tiroides || prev.tiroides,
      otrosTexto:
        payload.anamnesisExtraida.otrosAntecedentes || prev.otrosTexto,
      asimetriaPiernas:
        payload.anamnesisExtraida.asimetriaPiernas || prev.asimetriaPiernas,
      desviacionCadera:
        payload.anamnesisExtraida.desviacionCadera ?? prev.desviacionCadera,
    }));

    if (payload.anamnesisExtraida.pesoMochilaKg !== undefined) {
      setPesoMochilaNino(payload.anamnesisExtraida.pesoMochilaKg);
    }
    if (payload.anamnesisExtraida.posturaEscolar) {
      setPosturaEscolarNino(payload.anamnesisExtraida.posturaEscolar);
    }
    if (payload.anamnesisExtraida.cantidadHijos !== undefined) {
      setHijosMujer(payload.anamnesisExtraida.cantidadHijos);
    }
    if (payload.anamnesisExtraida.nivelSobrecarga1a10 !== undefined) {
      setSobrecargaMujer(payload.anamnesisExtraida.nivelSobrecarga1a10);
    }

    // Paso 3: Evaluación Clínica y Eje Cadera
    if (payload.evaluacionExtraida.notasTiempoReal?.length) {
      setNotasClinicasTexto(
        payload.evaluacionExtraida.notasTiempoReal.join('\n')
      );
    }
    if (
      payload.evaluacionExtraida.ejeCaderaCentroGravedad !==
      'Pendiente de revisión clínica.'
    ) {
      setEjeCaderaHallazgo(payload.evaluacionExtraida.ejeCaderaCentroGravedad);
    }
    if (
      payload.evaluacionExtraida.relatoNervioCiatico !==
      'Pendiente de revisión clínica.'
    ) {
      setRelatoCiatico(payload.evaluacionExtraida.relatoNervioCiatico);
    }
    if (payload.evaluacionExtraida.actitudPsicologica) {
      setActitudPsicologica(payload.evaluacionExtraida.actitudPsicologica);
    }
    if (
      payload.evaluacionExtraida.medicacionPsicotropa !== 'No informado.'
    ) {
      setMedicacionPsicotropa(payload.evaluacionExtraida.medicacionPsicotropa);
    }

    // Paso 5: Protocolo
    if (
      payload.protocoloExtraido.diagnosticoPrincipal !==
      'Pendiente de evaluación profesional.'
    ) {
      setDiagnosticoPrincipal(payload.protocoloExtraido.diagnosticoPrincipal);
      setDdConfirmada(payload.protocoloExtraido.diagnosticoPrincipal);
    }
    if (
      payload.protocoloExtraido.diagnosticoSecundario !==
      'Pendiente de revisión clínica.'
    ) {
      setDiagnosticoSecundario(payload.protocoloExtraido.diagnosticoSecundario);
    }
    if (
      payload.protocoloExtraido.etiologia !==
      'Pendiente de revisión clínica.'
    ) {
      setEtiologia(payload.protocoloExtraido.etiologia);
    }

    setFase1((prev) => ({
      ...prev,
      ajustes: payload.protocoloExtraido.fase1Ajustes || prev.ajustes,
      complementos:
        payload.protocoloExtraido.fase1Complementos || prev.complementos,
      restriccion:
        payload.protocoloExtraido.fase1Restriccion || prev.restriccion,
    }));
    setFase2((prev) => ({
      ...prev,
      ajustes: payload.protocoloExtraido.fase2Ajustes || prev.ajustes,
      ejercicios: payload.protocoloExtraido.fase2Ejercicios || prev.ejercicios,
      ergonomia: payload.protocoloExtraido.fase2Ergonomia || prev.ergonomia,
    }));
    setFase3((prev) => ({
      ...prev,
      ajustes: payload.protocoloExtraido.fase3Ajustes || prev.ajustes,
      ejerciciosCasa:
        payload.protocoloExtraido.fase3EjerciciosCasa || prev.ejerciciosCasa,
      educacion: payload.protocoloExtraido.fase3Educacion || prev.educacion,
    }));

    if (payload.protocoloExtraido.objetivosCortoPlazo?.length) {
      setObjetivosCorto(
        payload.protocoloExtraido.objetivosCortoPlazo.join('\n')
      );
    }
    if (payload.protocoloExtraido.objetivosLargoPlazo?.length) {
      setObjetivosLargo(
        payload.protocoloExtraido.objetivosLargoPlazo.join('\n')
      );
    }

    setAutoSaveTimestamp(
      `Autocompletado en vivo: ${fullName} (${payload.datosPaciente.edad} años)`
    );
  };

  const progressPercentage = step * 20;
  const stepTitles: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: 'PASO 1 DE 5: SELECCIONAR PACIENTE',
    2: 'PASO 2 DE 5: ANAMNESIS',
    3: 'PASO 3 DE 5: EVALUACIÓN CLÍNICA',
    4: 'PASO 4 DE 5: ANÁLISIS DE IMÁGENES',
    5: 'PASO 5 DE 5: PROTOCOLO PERSONALIZADO',
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profesion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto bg-white border-2 border-[#E0E0E0] shadow-xs text-[#003366]">
      {/* BARRA SUPERIOR DE LA NUEVA CONSULTA */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-b-2 border-[#E0E0E0] bg-white">
        <div className="font-bold text-base sm:text-lg text-[#003366]">
          🏥 NUEVA CONSULTA — JUAN ANTONIO VILLALBA (MP 542)
          {patientMode === 'nuevo' && newPatNombre.trim()
            ? ` | PACIENTE: ${newPatNombre.toUpperCase()}`
            : step > 1 && selectedPatient
            ? ` | PACIENTE: ${selectedPatient.nombreCompleto.toUpperCase()}`
            : ''}
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#003366]">
          <button
            type="button"
            onClick={() => setShowLiveScribePanel(!showLiveScribePanel)}
            className="px-2.5 py-1 bg-[#27AE60] text-white text-xs font-bold cursor-pointer"
          >
            {showLiveScribePanel
              ? '🎙️ Ocultar Copiloto de Charla en Vivo'
              : '🎙️ Abrir Copiloto de Charla en Vivo (Cámara + Mic)'}
          </button>
          <span className="hidden md:inline text-xs font-normal text-[#27AE60]">
            ✓ {autoSaveTimestamp}
          </span>
          <button
            type="button"
            onClick={() => {
              if (step > 1) {
                setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
              } else {
                setConfirmCancelModal(true);
              }
            }}
            className="hover:text-[#1a5490] cursor-pointer"
          >
            &lt; Atrás
          </button>
          <span className="text-[#E0E0E0]">|</span>
          <button
            type="button"
            onClick={() => setConfirmCancelModal(true)}
            className="text-[#E74C3C] hover:underline cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* MÓDULO PERSISTENTE: PROCESADOR EN VIVO DE TODA LA CHARLA CLÍNICA (CÁMARA + MICRÓFONO + TRANSCRIPCIÓN + AUTOCOMPLETADO + INFORME COMPLETO) */}
      {showLiveScribePanel && (
        <LiveClinicalScribePanel
          transcript={liveTranscript}
          onTranscriptChange={setLiveTranscript}
          informeCharla={informeCompletoCharla}
          onApplyExtractedData={handleApplyLiveScribeExtraction}
          onJumpToFullReport={() => {
            const record = buildFinalConsultationRecord();
            onSaveConsultation(record, true);
          }}
        />
      )}

      {/* BARRA DE PROGRESO (PASO A PASO: 20%, 40%, 60%, 80%, 100%) */}
      <div className="px-6 py-4 border-b-2 border-[#E0E0E0] bg-[#F8FAFC]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[#003366]">
            {stepTitles[step]}
          </span>
          <span className="text-sm font-mono font-bold text-[#003366]">
            {progressPercentage}%
          </span>
        </div>

        <div className="w-full h-4 bg-[#ECEFF1] border border-[#E0E0E0] flex overflow-hidden">
          {[1, 2, 3, 4, 5].map((idx) => {
            const isDone = idx <= step;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setStep(idx as 1 | 2 | 3 | 4 | 5);
                  if (idx === 5) triggerAutomaticProtocolEngine();
                }}
                title={`Ir al Paso ${idx}`}
                className={`flex-1 h-full border-r border-white/50 transition-colors ${
                  isDone ? 'bg-[#27AE60]' : 'bg-[#ECEFF1]'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* ===================================================================
          PANTALLA 3: NUEVA CONSULTA - PASO 1 (Seleccionar Paciente)
         =================================================================== */}
      {step === 1 && (
        <div className="p-6 space-y-6">
          <h2 className="text-base font-bold text-[#003366]">
            ¿Paciente existente o nuevo?
          </h2>

          {/* Opción 1: Seleccionar paciente existente */}
          <div className="space-y-4">
            <label className="flex items-center gap-2.5 text-sm font-bold text-[#003366] cursor-pointer">
              <input
                type="radio"
                name="patientMode"
                checked={patientMode === 'existente'}
                onChange={() => setPatientMode('existente')}
                className="w-4 h-4 accent-[#1a5490]"
              />
              <span>🔘 Seleccionar paciente existente</span>
            </label>

            {patientMode === 'existente' && (
              <div className="pl-6 space-y-4">
                <div className="flex items-center gap-2 max-w-md">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar paciente..."
                      className="w-full border-2 border-[#E0E0E0] px-3.5 py-2 text-sm text-[#003366] focus:border-[#1a5490] focus:outline-none"
                    />
                  </div>
                  <div className="px-3 py-2 bg-[#ECEFF1] border-2 border-[#E0E0E0] text-[#003366]">
                    <Search className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-[#003366]">
                    Resultados:
                  </div>
                  {filteredPatients.map((pat) => {
                    const isSelected = pat.id === selectedPatientId;
                    return (
                      <div
                        key={pat.id}
                        onClick={() => handleSelectExistingPatient(pat)}
                        className={`flex items-center justify-between p-3.5 border-2 cursor-pointer transition-colors max-w-xl ${
                          isSelected
                            ? 'border-[#1a5490] bg-[#1a5490] text-white'
                            : 'border-[#E0E0E0] bg-white text-[#003366] hover:border-[#1a5490]'
                        }`}
                      >
                        <div className="font-semibold text-sm">
                          {pat.nombreCompleto}{' '}
                          <span
                            className={
                              isSelected ? 'text-slate-200' : 'text-slate-500'
                            }
                          >
                            ({pat.edad} años, {pat.profesion})
                          </span>
                        </div>
                        <span className="text-xs font-bold whitespace-nowrap">
                          {isSelected ? '✓ Seleccionado' : '◀ Seleccionar'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Opción 2: Crear paciente nuevo */}
          <div className="space-y-3 pt-2 border-t border-[#E0E0E0]">
            <label className="flex items-center gap-2.5 text-sm font-bold text-[#003366] cursor-pointer">
              <input
                type="radio"
                name="patientMode"
                checked={patientMode === 'nuevo'}
                onChange={() => setPatientMode('nuevo')}
                className="w-4 h-4 accent-[#1a5490]"
              />
              <span>◯ Crear paciente nuevo</span>
            </label>
            <p className="text-xs text-slate-500 pl-6">
              └─ Haz click para crear un nuevo paciente (con cálculo automático de edad desde fecha de nacimiento)
            </p>

            {patientMode === 'nuevo' && (
              <div className="pl-6 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#003366] mb-1">
                    Nombre y Apellido:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Roberto Sánchez"
                    value={newPatNombre}
                    onChange={(e) => setNewPatNombre(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#003366] mb-1">
                    Fecha de Nacimiento (Cálculo auto):
                  </label>
                  <input
                    type="date"
                    value={newPatDob}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#003366] mb-1">
                    Edad Calculada (años):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={105}
                    value={newPatEdad}
                    onChange={(e) => setNewPatEdad(Number(e.target.value) || 1)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#003366] mb-1">
                    Género:
                  </label>
                  <select
                    value={newPatGenero}
                    onChange={(e) =>
                      setNewPatGenero(
                        e.target.value as
                          | 'Masculino'
                          | 'Femenino'
                          | 'No especificado'
                      )
                    }
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366] bg-white"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="No especificado">No especificado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#003366] mb-1">
                    Profesión / Ocupación:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Arquitecto / Estudiante"
                    value={newPatProfesion}
                    onChange={(e) => setNewPatProfesion(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#003366] mb-1">
                    Ciudad / Barrio:
                  </label>
                  <input
                    type="text"
                    value={newPatCiudad}
                    onChange={(e) => setNewPatCiudad(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#003366] mb-1">
                    Teléfono (opcional):
                  </label>
                  <input
                    type="tel"
                    value={newPatTelefono}
                    onChange={(e) => setNewPatTelefono(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#003366] mb-1">
                    Email (opcional):
                  </label>
                  <input
                    type="email"
                    value={newPatEmail}
                    onChange={(e) => setNewPatEmail(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t-2 border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => {
                if (
                  patientMode === 'nuevo' &&
                  (!newPatNombre.trim() || newPatEdad < 1)
                ) {
                  return;
                }
                if (patientMode === 'nuevo' && newPatNombre.trim()) {
                  const newId = `pat-${Date.now()}`;
                  const grupoAuto: PatientProfileGroup =
                    newPatEdad < 16
                      ? 'NIÑO'
                      : newPatGenero === 'Femenino'
                      ? 'MUJER_ADULTA'
                      : 'ADULTO';
                  const created: PatientRecord = {
                    id: newId,
                    nombre:
                      newPatNombre.trim().split(' ')[0] || newPatNombre.trim(),
                    apellidos:
                      newPatNombre.trim().split(' ').slice(1).join(' ') || '',
                    nombreCompleto: newPatNombre.trim(),
                    fechaNacimiento: newPatDob,
                    edad: newPatEdad,
                    genero: newPatGenero,
                    perfilGrupo: grupoAuto,
                    profesion: newPatProfesion.trim() || 'Particular',
                    ciudad: newPatCiudad.trim() || 'Salta',
                    telefono: newPatTelefono.trim(),
                    email: newPatEmail.trim(),
                    ultimaCita: 'Hoy',
                    proximaCita: 'Oct 17',
                    estado: 'Evaluación Inicial',
                    horasSedentarioDia: 8,
                    horasComputadoraDia: 6,
                    horasSmartphoneDia: 4,
                  };
                  onCreatePatient(created);
                  setSelectedPatientId(created.id);
                  setPerfilGrupo(grupoAuto);
                  setProfesion(created.profesion);
                  setCiudad(created.ciudad);
                }
                setStep(2);
              }}
              disabled={
                patientMode === 'nuevo' &&
                (!newPatNombre.trim() || newPatEdad < 1)
              }
              className="px-6 py-2.5 bg-[#1a5490] hover:bg-[#003366] text-white font-bold text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              [SIGUIENTE &gt;&gt;&gt;]
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          PANTALLA 4: NUEVA CONSULTA - PASO 2 (Anamnesis Completa Fase 1)
         =================================================================== */}
      {step === 2 && (
        <div className="p-6 space-y-6">
          {/* INFORMACIÓN GENERAL */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#003366]">
                INFORMACIÓN GENERAL
              </h3>
              <div className="flex items-center gap-1 text-xs">
                <span className="font-bold">Perfil Clínico:</span>
                {(
                  [
                    ['ADULTO', 'Adulto'],
                    ['NIÑO', 'Niño (Crecimiento)'],
                    ['MUJER_ADULTA', 'Mujer Adulta'],
                  ] as [PatientProfileGroup, string][]
                ).map(([grp, label]) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setPerfilGrupo(grp)}
                    className={`px-2.5 py-1 border font-bold ${
                      perfilGrupo === grp
                        ? 'bg-[#1a5490] text-white border-[#1a5490]'
                        : 'bg-white text-[#003366] border-[#E0E0E0]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div className="border-2 border-[#E0E0E0] px-3.5 py-2 bg-white flex items-center gap-2">
                <span className="text-xs font-bold text-[#003366] whitespace-nowrap">
                  Profesión:
                </span>
                <input
                  type="text"
                  value={profesion}
                  onChange={(e) => setProfesion(e.target.value)}
                  className="w-full text-sm text-[#003366] focus:outline-none"
                />
              </div>
              <div className="border-2 border-[#E0E0E0] px-3.5 py-2 bg-white flex items-center gap-2">
                <span className="text-xs font-bold text-[#003366] whitespace-nowrap">
                  Ciudad:
                </span>
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full text-sm text-[#003366] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* CONTEXTO DE VIDA (Varía según NIÑO / ADULTO / MUJER ADULTA) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#003366]">
              CONTEXTO DE VIDA ({perfilGrupo.replace('_', ' ')})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <div className="border-2 border-[#E0E0E0] px-3.5 py-2 bg-white flex items-center justify-between">
                  <span className="text-sm text-[#003366]">
                    {perfilGrupo === 'NIÑO'
                      ? 'Horas en clase escolar/día:'
                      : 'Horas trabajo sedentario/día:'}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={horasSedentario}
                    onChange={(e) => setHorasSedentario(Number(e.target.value))}
                    className="w-20 text-right font-mono font-bold text-sm text-[#003366] border border-[#E0E0E0] px-2 py-0.5"
                  />
                </div>
                <div className="border-2 border-[#E0E0E0] px-3.5 py-2 bg-white flex items-center justify-between">
                  <span className="text-sm text-[#003366]">
                    Horas computadora/tablet/día:
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={horasComputadora}
                    onChange={(e) =>
                      setHorasComputadora(Number(e.target.value))
                    }
                    className="w-20 text-right font-mono font-bold text-sm text-[#003366] border border-[#E0E0E0] px-2 py-0.5"
                  />
                </div>
                <div className="border-2 border-[#E0E0E0] px-3.5 py-2 bg-white flex items-center justify-between">
                  <span className="text-sm text-[#003366]">
                    Horas smartphone/día:
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={horasSmartphone}
                    onChange={(e) => setHorasSmartphone(Number(e.target.value))}
                    className="w-20 text-right font-mono font-bold text-sm text-[#003366] border border-[#E0E0E0] px-2 py-0.5"
                  />
                </div>
              </div>

              {/* Parámetros específicos según especificación técnica 1.1 y 1.4 */}
              <div className="border-2 border-[#E0E0E0] p-3.5 bg-[#F8FAFC] space-y-2.5 text-xs">
                {perfilGrupo === 'NIÑO' && (
                  <>
                    <div className="font-bold text-[#1a5490]">
                      Evaluación Preventiva de Crecimiento en NIÑOS:
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Peso mochila escolar (kg):</span>
                      <input
                        type="number"
                        step="0.5"
                        value={pesoMochilaNino}
                        onChange={(e) =>
                          setPesoMochilaNino(Number(e.target.value))
                        }
                        className="w-20 border border-[#E0E0E0] bg-white px-2 py-1 font-mono font-bold text-right"
                      />
                    </div>
                    <div>
                      <span className="block mb-1">
                        Posturas habituales (escritorio, cama, celular):
                      </span>
                      <input
                        type="text"
                        value={posturaEscolarNino}
                        onChange={(e) => setPosturaEscolarNino(e.target.value)}
                        className="w-full border border-[#E0E0E0] bg-white px-2 py-1"
                      />
                    </div>
                  </>
                )}

                {perfilGrupo === 'MUJER_ADULTA' && (
                  <>
                    <div className="font-bold text-[#1a5490]">
                      Contexto Específico Mujer Adulta:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block mb-1">Cantidad de hijos:</span>
                        <input
                          type="number"
                          min={0}
                          value={hijosMujer}
                          onChange={(e) =>
                            setHijosMujer(Number(e.target.value))
                          }
                          className="w-full border border-[#E0E0E0] bg-white px-2 py-1 font-mono"
                        />
                      </div>
                      <div>
                        <span className="block mb-1">
                          Nivel sobrecarga (1-10):
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={sobrecargaMujer}
                          onChange={(e) =>
                            setSobrecargaMujer(Number(e.target.value))
                          }
                          className="w-full border border-[#E0E0E0] bg-white px-2 py-1 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="block font-semibold mb-0.5">
                      Deporte actual:
                    </span>
                    <input
                      type="text"
                      value={deporteActual}
                      onChange={(e) => setDeporteActual(e.target.value)}
                      className="w-full border border-[#E0E0E0] bg-white px-2 py-1"
                    />
                  </div>
                  <div>
                    <span className="block font-semibold mb-0.5">
                      Deporte en infancia:
                    </span>
                    <input
                      type="text"
                      value={deporteInfancia}
                      onChange={(e) => setDeporteInfancia(e.target.value)}
                      className="w-full border border-[#E0E0E0] bg-white px-2 py-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PROBLEMA DE HOY + MODAL DE GRABACIÓN INTEGRADO */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#003366]">
              PROBLEMA DE HOY (Narrativa en Vivo + Diccionario del Cliente)
            </h3>
            <div className="flex flex-col md:flex-row items-stretch gap-4">
              <div className="flex-1 border-2 border-[#E0E0E0] p-3 bg-white space-y-2">
                <div className="text-xs text-slate-500">
                  ¿Qué duele? Escribe o presiona REC (Dejar hablar 2-3 min):
                </div>
                <textarea
                  rows={4}
                  value={problemaHoy}
                  onChange={(e) => setProblemaHoy(e.target.value)}
                  className="w-full text-sm text-[#003366] focus:outline-none"
                />
                <div className="pt-2 border-t border-[#E0E0E0]">
                  <label className="block text-xs font-bold text-[#1a5490] mb-1">
                    Diccionario del Cliente (Palabras clave de su relato separadas por |):
                  </label>
                  <input
                    type="text"
                    value={diccionarioKeywords}
                    onChange={(e) => setDiccionarioKeywords(e.target.value)}
                    className="w-full border border-[#E0E0E0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#003366]"
                  />
                </div>
              </div>

              <div className="w-full md:w-64 border-2 border-[#E0E0E0] p-4 bg-[#F8FAFC] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#003366] font-bold text-sm">
                    <Mic
                      className={`w-4 h-4 ${
                        isRecordingStep2 ? 'text-[#E74C3C] animate-pulse' : ''
                      }`}
                    />
                    <Video className="w-4 h-4 text-[#1a5490]" />
                    <span>
                      {isRecordingStep2
                        ? '(Grabando)'
                        : isPlayingStep2
                        ? '(Reproduciendo)'
                        : '(Listo)'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-[#003366]">
                    {formatSeconds(step2Seconds)}
                  </span>
                </div>

                <div className="my-3">
                  <div className="text-xs text-slate-500 mb-1">
                    Nivel de audio:
                  </div>
                  <div className="h-2.5 w-full bg-[#ECEFF1] border border-[#E0E0E0] overflow-hidden">
                    <div
                      style={{
                        width: isRecordingStep2
                          ? '75%'
                          : isPlayingStep2
                          ? '60%'
                          : '20%',
                      }}
                      className={`h-full transition-all ${
                        isRecordingStep2 ? 'bg-[#E74C3C]' : 'bg-[#27AE60]'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsRecordingStep2(!isRecordingStep2);
                    setIsPlayingStep2(false);
                  }}
                  className={`w-full py-1.5 text-xs font-bold text-white ${
                    isRecordingStep2 ? 'bg-[#E74C3C]' : 'bg-[#1a5490]'
                  }`}
                >
                  {isRecordingStep2 ? 'DETENER REC' : '🎤 INICIAR REC'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsRecordingStep2(false);
                  setIsPlayingStep2(!isPlayingStep2);
                }}
                className="px-3.5 py-1.5 border-2 border-[#E0E0E0] bg-white hover:border-[#1a5490] text-xs font-bold text-[#003366]"
              >
                [{isPlayingStep2 ? 'PAUSAR AUDIO' : 'REPRODUCIR'}]
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRecordingStep2(false);
                  setIsPlayingStep2(false);
                  setStep2Seconds(0);
                  setAudioSavedMsg('Grabación reiniciada a 00:00');
                }}
                className="px-3.5 py-1.5 border-2 border-[#E0E0E0] bg-white hover:border-[#E74C3C] text-xs font-bold text-[#E74C3C]"
              >
                [BORRAR]
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRecordingStep2(false);
                  setAudioSavedMsg(
                    `Nota de voz (${formatSeconds(step2Seconds)}) y relato guardados en la anamnesis.`
                  );
                }}
                className="px-3.5 py-1.5 border-2 border-[#27AE60] bg-[#27AE60] text-xs font-bold text-white"
              >
                [GUARDAR]
              </button>
              {audioSavedMsg && (
                <span className="text-xs text-[#27AE60] font-semibold">
                  ✓ {audioSavedMsg}
                </span>
              )}
            </div>
          </div>

          {/* ANTECEDENTES DE RELEVANCIA */}
          <div className="space-y-3 pt-2 border-t border-[#E0E0E0]">
            <h3 className="text-sm font-bold text-[#003366]">
              ANTECEDENTES DE RELEVANCIA
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-[#003366]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={antecedentes.escoliosis}
                  onChange={(e) =>
                    setAntecedentes({
                      ...antecedentes,
                      escoliosis: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#1a5490]"
                />
                <span>Escoliosis</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={antecedentes.cifosis}
                  onChange={(e) =>
                    setAntecedentes({
                      ...antecedentes,
                      cifosis: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#1a5490]"
                />
                <span>Cifosis</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={antecedentes.lordosis}
                  onChange={(e) =>
                    setAntecedentes({
                      ...antecedentes,
                      lordosis: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#1a5490]"
                />
                <span>Lordosis</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={antecedentes.asma}
                  onChange={(e) =>
                    setAntecedentes({
                      ...antecedentes,
                      asma: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#1a5490]"
                />
                <span>Asmas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={antecedentes.tiroides}
                  onChange={(e) =>
                    setAntecedentes({
                      ...antecedentes,
                      tiroides: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#1a5490]"
                />
                <span>Tiroides</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(antecedentes.desviacionCadera)}
                  onChange={(e) =>
                    setAntecedentes({
                      ...antecedentes,
                      desviacionCadera: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#1a5490]"
                />
                <span>Desviación cadera</span>
              </label>
              <div className="col-span-2 flex items-center gap-2">
                <span className="whitespace-nowrap">Otros / Pierna corta:</span>
                <input
                  type="text"
                  value={antecedentes.otrosTexto}
                  onChange={(e) =>
                    setAntecedentes({
                      ...antecedentes,
                      otrosTexto: e.target.value,
                    })
                  }
                  placeholder="Asimetría de piernas u otros..."
                  className="flex-1 border-b-2 border-[#E0E0E0] px-2 py-1 text-sm text-[#003366] focus:border-[#1a5490] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t-2 border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2.5 bg-[#1a5490] hover:bg-[#003366] text-white font-bold text-sm cursor-pointer"
            >
              [SIGUIENTE &gt;&gt;&gt;]
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          PANTALLA 5: NUEVA CONSULTA - PASO 3 (Evaluación Clínica Fase 2)
         =================================================================== */}
      {step === 3 && (
        <div className="p-6 space-y-6">
          <h3 className="text-sm font-bold text-[#003366]">
            CAPTURA MULTIMEDIA EN TIEMPO REAL
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-[#E0E0E0] p-4 bg-[#F8FAFC] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#003366] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#1a5490]" />
                  📹 CÁMARA
                </span>
                <button
                  type="button"
                  onClick={toggleLiveCamera}
                  className={`px-3 py-1 text-xs font-bold text-white ${
                    isLiveCameraActive ? 'bg-[#E74C3C]' : 'bg-[#1a5490]'
                  }`}
                >
                  {isLiveCameraActive ? 'DETENER CÁMARA' : 'ACTIVAR EN VIVO'}
                </button>
              </div>

              <div className="relative h-48 bg-slate-900 border-2 border-[#003366] flex flex-col items-center justify-center overflow-hidden text-white">
                {isLiveCameraActive && !cameraStreamError ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 space-y-1">
                    <span className="inline-block px-2 py-0.5 bg-[#E74C3C] text-white text-xs font-bold">
                      [EN VIVO]
                    </span>
                    <div className="text-sm font-semibold mt-1">
                      Paciente en cámara ({selectedPatient?.nombreCompleto})
                    </div>
                    <div className="text-xs text-slate-300">
                      Plomada Cabeza-Hombros-Caderas-Rodillas-Tobillos
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-px h-full bg-emerald-400/50" />
                  <div className="h-px w-full bg-emerald-400/50 absolute" />
                </div>
              </div>
            </div>

            <div className="border-2 border-[#E0E0E0] p-4 bg-[#F8FAFC] flex flex-col justify-between">
              <div className="space-y-3">
                <div className="font-bold text-sm text-[#003366] flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-[#1a5490]" />
                  🎤 MICRÓFONO
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[#003366]">
                    Nivel: ░░░░░ ({micLevel}%)
                  </div>
                  <div className="w-full h-4 bg-[#ECEFF1] border border-[#E0E0E0]">
                    <div
                      style={{ width: `${micLevel}%` }}
                      className="h-full bg-[#27AE60] transition-all"
                    />
                  </div>
                </div>

                <div className="text-base font-mono font-bold text-[#003366]">
                  Grabando: {formatSeconds(step3Seconds)}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!isMicRecordingStep3) {
                      setIsMicRecordingStep3(true);
                      setIsMicPausedStep3(false);
                    } else {
                      setIsMicPausedStep3(!isMicPausedStep3);
                    }
                  }}
                  className="flex-1 py-2 bg-[#1a5490] text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  {isMicRecordingStep3 && !isMicPausedStep3 ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> [PAUSAR]
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> [GRABAR / REANUDAR]
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMicRecordingStep3(false);
                    setIsMicPausedStep3(false);
                  }}
                  className="flex-1 py-2 bg-[#E74C3C] text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Square className="w-3.5 h-3.5" /> [STOP]
                </button>
              </div>
            </div>
          </div>

          {/* NOTAS CLÍNICAS EN TIEMPO REAL + TABLA DE RESULTADOS FÍSICOS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-2">
              <h3 className="text-sm font-bold text-[#003366]">
                NOTAS CLÍNICAS EN TIEMPO REAL
              </h3>
              <div className="border-2 border-[#E0E0E0] p-3 bg-white space-y-2">
                <textarea
                  rows={6}
                  value={notasClinicasTexto}
                  onChange={(e) => setNotasClinicasTexto(e.target.value)}
                  className="w-full text-sm text-[#003366] font-mono leading-relaxed focus:outline-none"
                />
                <div className="flex gap-2 pt-2 border-t border-[#E0E0E0]">
                  <input
                    type="text"
                    value={nuevaNotaInput}
                    onChange={(e) => setNuevaNotaInput(e.target.value)}
                    placeholder="Escribir notas adicionales..."
                    className="flex-1 text-xs border border-[#E0E0E0] px-2.5 py-1.5 text-[#003366]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!nuevaNotaInput.trim()) return;
                      setNotasClinicasTexto(
                        (prev) => `${prev}\n• ${nuevaNotaInput.trim()}`
                      );
                      setNuevaNotaInput('');
                    }}
                    className="px-3 py-1.5 bg-[#1a5490] text-white text-xs font-bold"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 space-y-2">
              <h3 className="text-sm font-bold text-[#003366]">
                TABLA DE RESULTADOS FÍSICOS
              </h3>
              <div className="border-2 border-[#E0E0E0] bg-white overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#E0E0E0] bg-[#F8FAFC] text-[#003366]">
                      <th className="py-2 px-3 font-bold border-r border-[#E0E0E0]">
                        Prueba
                      </th>
                      <th className="py-2 px-3 font-bold">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E0E0] text-[#003366]">
                    {tablaFisica.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 border-r border-[#E0E0E0] font-medium">
                          {row.prueba}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold">
                          <input
                            type="text"
                            value={row.resultado}
                            onChange={(e) => {
                              const next = [...tablaFisica];
                              next[idx] = {
                                ...next[idx],
                                resultado: e.target.value,
                              };
                              setTablaFisica(next);
                            }}
                            className="w-full bg-transparent focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ÉNFASIS EN EJE CADERA + RECORRIDO NERVIO CIÁTICO + PSICOLOGÍA (2.2 y 2.4) */}
          <div className="border-2 border-[#1a5490] bg-[#F8FAFC] p-4 space-y-3">
            <div className="text-xs font-bold text-[#1a5490]">
              2.4 ÉNFASIS BIOMECÁNICO EN EJE CADERA (CENTRO DE GRAVEDAD) Y RECORRIDO CIÁTICO EN TIEMPO REAL
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#003366] mb-1">
                  Evaluación del Eje Principal (Cadera / Pelvis / Thomas / Ober):
                </label>
                <textarea
                  rows={3}
                  value={ejeCaderaHallazgo}
                  onChange={(e) => setEjeCaderaHallazgo(e.target.value)}
                  className="w-full border border-[#E0E0E0] bg-white p-2 text-[#003366]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#003366] mb-1">
                  Relato Simultáneo del Nervio Ciático ("De la cintura al pie"):
                </label>
                <textarea
                  rows={3}
                  value={relatoCiatico}
                  onChange={(e) => setRelatoCiatico(e.target.value)}
                  className="w-full border border-[#E0E0E0] bg-white p-2 text-[#003366]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E0E0E0] text-xs">
              <div>
                <label className="block font-bold text-[#003366] mb-1">
                  2.2 Observación Psicológica en Consulta:
                </label>
                <select
                  value={actitudPsicologica}
                  onChange={(e) =>
                    setActitudPsicologica(
                      e.target.value as 'Colaborador' | 'Defensivo' | 'Ansioso'
                    )
                  }
                  className="w-full border border-[#E0E0E0] bg-white px-2.5 py-1.5 text-[#003366]"
                >
                  <option value="Colaborador">
                    Actitud: Colaborador / Coherente
                  </option>
                  <option value="Ansioso">
                    Actitud: Ansioso / Preocupación manifiesta
                  </option>
                  <option value="Defensivo">
                    Actitud: Defensivo / Kinesiofobia
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#003366] mb-1">
                  Medicación Psicótropa / Neuromoduladora:
                </label>
                <select
                  value={medicacionPsicotropa}
                  onChange={(e) => setMedicacionPsicotropa(e.target.value)}
                  className="w-full border border-[#E0E0E0] bg-white px-2.5 py-1.5 text-[#003366]"
                >
                  <option value="Ninguno (Sin psicofármacos activos)">
                    Ninguno (Sin psicofármacos activos)
                  </option>
                  <option value="Ansiolíticos (Diazepam / Lorazepam) — Modifica tono muscular">
                    Ansiolíticos (Diazepam / Lorazepam) — Modifica tono muscular
                  </option>
                  <option value="Pregabalina (Gabapentinoide) — Altera percepción de dolor">
                    Pregabalina (Gabapentinoide) — Altera percepción de dolor
                  </option>
                  <option value="Antidepresivos — Considerar en respuesta central">
                    Antidepresivos — Considerar en respuesta central
                  </option>
                  <option value="Opioides — Enmascara umbral doloroso agudo">
                    Opioides — Enmascara umbral doloroso agudo
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* PRUEBAS FÍSICAS REALIZADAS */}
          <div className="space-y-3 pt-2 border-t border-[#E0E0E0]">
            <h3 className="text-sm font-bold text-[#003366]">
              PRUEBAS FÍSICAS REALIZADAS
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-[#003366]">
              {(
                [
                  ['posturaEnPie', 'Postura en pie'],
                  ['movilidad', 'Movilidad'],
                  ['fuerza', 'Fuerza'],
                  ['neurologico', 'Neurológico'],
                  ['camillaSupino', 'Camilla (supino)'],
                  ['cadera', 'Cadera'],
                  ['palpacion', 'Palpación'],
                  ['especiales', 'Especiales'],
                ] as [keyof typeof pruebasRealizadas, string][]
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={pruebasRealizadas[key]}
                    onChange={(e) =>
                      setPruebasRealizadas({
                        ...pruebasRealizadas,
                        [key]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#27AE60]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t-2 border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-6 py-2.5 bg-[#1a5490] hover:bg-[#003366] text-white font-bold text-sm cursor-pointer"
            >
              [SIGUIENTE &gt;&gt;&gt;]
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          PANTALLA 6: NUEVA CONSULTA - PASO 4 (Imágenes Médicas Fase 3)
         =================================================================== */}
      {step === 4 && activeDicomStudy && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#003366]">
              VISOR DE IMÁGENES DICOM
            </h3>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a5490] text-white text-xs font-bold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>+ Subir Imagen / DICOM</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadNewDicom}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-4">
              <div className="border-2 border-[#003366] bg-slate-950 p-3 text-white space-y-3">
                <div
                  onClick={handleDicomCanvasClick}
                  className={`relative h-72 bg-black overflow-hidden flex items-center justify-center border border-slate-700 ${
                    activeTool !== 'ninguna'
                      ? 'cursor-crosshair'
                      : 'cursor-default'
                  }`}
                >
                  <img
                    src={activeDicomStudy.imageUrl}
                    alt={activeDicomStudy.estudio}
                    referrerPolicy="no-referrer"
                    style={{
                      transform: `scale(${dicomZoom})`,
                      filter: `brightness(${dicomBrightness}%) contrast(${dicomContrast}%)`,
                    }}
                    className="max-h-full max-w-full object-contain transition-transform"
                  />

                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    {activeDicomStudy.trazosDibujo.map((t, i) => (
                      <g key={i}>
                        <line
                          x1={t.x1}
                          y1={t.y1}
                          x2={t.x2}
                          y2={t.y2}
                          stroke={t.tipo === 'regla' ? '#3498DB' : '#E74C3C'}
                          strokeWidth="1.2"
                        />
                        <circle
                          cx={t.x1}
                          cy={t.y1}
                          r="1.5"
                          fill={t.tipo === 'regla' ? '#3498DB' : '#E74C3C'}
                        />
                        <circle
                          cx={t.x2}
                          cy={t.y2}
                          r="1.5"
                          fill={t.tipo === 'regla' ? '#3498DB' : '#E74C3C'}
                        />
                        {t.etiqueta && (
                          <text
                            x={(t.x1 + t.x2) / 2}
                            y={(t.y1 + t.y2) / 2 - 2}
                            fill="#FFFFFF"
                            fontSize="4"
                            fontWeight="bold"
                          >
                            {t.etiqueta}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>

                  {pendingPoint && (
                    <div
                      style={{
                        left: `${pendingPoint.x}%`,
                        top: `${pendingPoint.y}%`,
                      }}
                      className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 animate-ping"
                    />
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>- Zoom:</span>
                      <select
                        value={dicomZoom}
                        onChange={(e) => setDicomZoom(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-600 px-2 py-1 text-white font-mono"
                      >
                        <option value={1.0}>1.0x ▼</option>
                        <option value={1.25}>1.25x ▼</option>
                        <option value={1.5}>1.5x ▼</option>
                        <option value={2.0}>2.0x ▼</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span>- Herramientas:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTool(
                            activeTool === 'lapiz' ? 'ninguna' : 'lapiz'
                          );
                          setPendingPoint(null);
                        }}
                        className={`px-2 py-1 border flex items-center gap-1 ${
                          activeTool === 'lapiz'
                            ? 'bg-[#E74C3C] border-white text-white font-bold'
                            : 'bg-slate-800 border-slate-600 text-slate-200'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" /> ✏️ Anotar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTool(
                            activeTool === 'regla' ? 'ninguna' : 'regla'
                          );
                          setPendingPoint(null);
                        }}
                        className={`px-2 py-1 border flex items-center gap-1 ${
                          activeTool === 'regla'
                            ? 'bg-[#3498DB] border-white text-white font-bold'
                            : 'bg-slate-800 border-slate-600 text-slate-200'
                        }`}
                      >
                        <Ruler className="w-3 h-3" /> 📏 Medir
                      </button>
                      {activeDicomStudy.trazosDibujo.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDicomStudies((prev) =>
                              prev.map((st) =>
                                st.id === activeDicomStudy.id
                                  ? { ...st, trazosDibujo: [] }
                                  : st
                              )
                            )
                          }
                          className="px-2 py-1 bg-slate-800 border border-slate-600 text-slate-300 hover:text-white"
                          title="Limpiar trazos"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="w-20">- Brillo:</span>
                      <input
                        type="range"
                        min={60}
                        max={140}
                        value={dicomBrightness}
                        onChange={(e) =>
                          setDicomBrightness(Number(e.target.value))
                        }
                        className="flex-1 accent-[#3498DB]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20">- Contraste:</span>
                      <input
                        type="range"
                        min={70}
                        max={160}
                        value={dicomContrast}
                        onChange={(e) =>
                          setDicomContrast(Number(e.target.value))
                        }
                        className="flex-1 accent-[#3498DB]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* IMÁGENES EN HISTORIAL */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#003366]">
                  IMÁGENES EN HISTORIAL
                </div>
                <div className="flex flex-wrap gap-3">
                  {dicomStudies.map((st) => {
                    const isCurrent = st.id === activeDicomStudy.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setActiveDicomId(st.id)}
                        className={`w-20 p-2 border-2 text-center transition-colors cursor-pointer ${
                          isCurrent
                            ? 'border-[#1a5490] bg-[#1a5490] text-white font-bold'
                            : 'border-[#E0E0E0] bg-white text-[#003366] hover:border-[#1a5490]'
                        }`}
                      >
                        <div className="text-xs">{st.etiquetaCorta}</div>
                        <div className="text-[11px] font-mono opacity-85">
                          {st.fechaCorta}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ANOTACIONES DEL MÉDICO */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-[#003366]">
                  ANOTACIONES DEL MÉDICO
                </div>
                <div className="border-2 border-[#E0E0E0] p-3 bg-white">
                  <div className="text-xs font-semibold text-[#1a5490] mb-1">
                    [✏️ Dibujar arriba sobre la imagen o escribir anotación técnica]
                  </div>
                  <textarea
                    rows={3}
                    value={activeDicomStudy.anotacionesMedico}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDicomStudies((prev) =>
                        prev.map((st) =>
                          st.id === activeDicomStudy.id
                            ? { ...st, anotacionesMedico: val }
                            : st
                        )
                      );
                    }}
                    className="w-full text-xs text-[#003366] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Ficha del Estudio + HALLAZGOS OBSERVADOS + 3.3 DIFERENCIAL VISUAL */}
            <div className="md:col-span-5 space-y-4">
              <div className="border-2 border-[#E0E0E0] p-4 bg-[#F8FAFC] space-y-1.5 text-sm text-[#003366]">
                <div>
                  <strong>Estudio:</strong> {activeDicomStudy.estudio}
                </div>
                <div>
                  <strong>Fecha:</strong> {activeDicomStudy.fechaCompleta}
                </div>
                <div>
                  <strong>Región:</strong> {activeDicomStudy.region}
                </div>
                <div>
                  <strong>Técnica / Corte:</strong> {activeDicomStudy.tecnica} (
                  {activeDicomStudy.corteOrientacion || 'Sagital'})
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-[#003366]">
                  HALLAZGOS OBSERVADOS
                </div>
                <div className="border-2 border-[#E0E0E0] p-4 bg-white space-y-4">
                  <div className="space-y-2">
                    {activeDicomStudy.hallazgos.map((h, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-2 text-sm text-[#003366] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={h.activo}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDicomStudies((prev) =>
                              prev.map((st) =>
                                st.id === activeDicomStudy.id
                                  ? {
                                      ...st,
                                      hallazgos: st.hallazgos.map((item, i) =>
                                        i === idx
                                          ? { ...item, activo: checked }
                                          : item
                                      ),
                                    }
                                  : st
                              )
                            );
                          }}
                          className="w-4 h-4 accent-[#27AE60]"
                        />
                        <span className="font-medium">✓ {h.texto}</span>
                      </label>
                    ))}

                    <div className="flex gap-1.5 pt-2">
                      <input
                        type="text"
                        value={newFindingText}
                        onChange={(e) => setNewFindingText(e.target.value)}
                        placeholder="Agregar hallazgo (ej. Pfirrmann, Cobb)..."
                        className="flex-1 border border-[#E0E0E0] px-2 py-1 text-xs text-[#003366]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newFindingText.trim()) return;
                          setDicomStudies((prev) =>
                            prev.map((st) =>
                              st.id === activeDicomStudy.id
                                ? {
                                    ...st,
                                    hallazgos: [
                                      ...st.hallazgos,
                                      {
                                        texto: newFindingText.trim(),
                                        activo: true,
                                      },
                                    ],
                                  }
                                : st
                            )
                          );
                          setNewFindingText('');
                        }}
                        className="px-2.5 py-1 bg-[#1a5490] text-white text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E0E0E0]">
                    <div className="text-xs font-bold text-[#003366] mb-1">
                      IMPRESIÓN:
                    </div>
                    <textarea
                      rows={2}
                      value={activeDicomStudy.impresion}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDicomStudies((prev) =>
                          prev.map((st) =>
                            st.id === activeDicomStudy.id
                              ? { ...st, impresion: val }
                              : st
                          )
                        );
                      }}
                      className="w-full text-xs text-[#003366] bg-[#F8FAFC] p-2 border border-[#E0E0E0]"
                    />
                  </div>
                </div>
              </div>

              {/* 3.3 DIAGNÓSTICO DIFERENCIAL VISUAL (Confirmada, Probable, Descartada, No visible) */}
              <div className="border-2 border-[#E0E0E0] p-3.5 bg-[#F8FAFC] space-y-2 text-xs">
                <div className="font-bold text-[#003366]">
                  3.3 CORRELACIÓN IMAGEN-PACIENTE Y CERTEZA DIAGNÓSTICA
                </div>
                <div>
                  <span className="font-bold text-[#27AE60] block">
                    ✓ Patología Confirmada:
                  </span>
                  <input
                    type="text"
                    value={ddConfirmada}
                    onChange={(e) => setDdConfirmada(e.target.value)}
                    className="w-full border border-[#E0E0E0] bg-white px-2 py-1 mt-0.5"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#1a5490] block">
                    • Patología Probable:
                  </span>
                  <input
                    type="text"
                    value={ddProbable}
                    onChange={(e) => setDdProbable(e.target.value)}
                    className="w-full border border-[#E0E0E0] bg-white px-2 py-1 mt-0.5"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#E74C3C] block">
                    ✕ Patología Descartada:
                  </span>
                  <input
                    type="text"
                    value={ddDescartada}
                    onChange={(e) => setDdDescartada(e.target.value)}
                    className="w-full border border-[#E0E0E0] bg-white px-2 py-1 mt-0.5"
                  />
                </div>
                <div>
                  <span className="font-bold text-slate-600 block">
                    ◌ Patología No Visible en esta imagen:
                  </span>
                  <input
                    type="text"
                    value={ddNoVisible}
                    onChange={(e) => setDdNoVisible(e.target.value)}
                    className="w-full border border-[#E0E0E0] bg-white px-2 py-1 mt-0.5"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t-2 border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => {
                setStep(5);
                triggerAutomaticProtocolEngine();
              }}
              className="px-6 py-2.5 bg-[#1a5490] hover:bg-[#003366] text-white font-bold text-sm cursor-pointer"
            >
              [SIGUIENTE &gt;&gt;&gt;]
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          PANTALLA 7: NUEVA CONSULTA - PASO 5 (Generar Protocolo Fase 4)
         =================================================================== */}
      {step === 5 && (
        <div className="p-6 space-y-6">
          <div className="border-2 border-[#E0E0E0] p-4 bg-[#F8FAFC] space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-[#003366]">
                🤖 MOTOR DE PROTOCOLO AUTOMÁTICO ({perfilGrupo.replace('_', ' ')})
              </div>
              <button
                type="button"
                onClick={triggerAutomaticProtocolEngine}
                className="text-xs font-semibold text-[#1a5490] hover:underline"
              >
                ↻ Re-analizar correlación clínica
              </button>
            </div>
            <div className="text-xs text-slate-600">
              {engineAnalysing
                ? 'Analizando datos... ⏳ (30 segundos)'
                : 'Análisis completado ✓ (Correlación Cuadro Clínico + Imagen + Contexto de Vida)'}
            </div>
            <div className="space-y-1 text-xs font-medium text-[#003366] pt-1">
              <div
                className={
                  engineProgressStep >= 1 ? 'text-[#27AE60]' : 'text-slate-400'
                }
              >
                ✓ Anamnesis procesada
              </div>
              <div
                className={
                  engineProgressStep >= 2 ? 'text-[#27AE60]' : 'text-slate-400'
                }
              >
                ✓ Evaluación física correlacionada (Eje Cadera + Columna)
              </div>
              <div
                className={
                  engineProgressStep >= 3 ? 'text-[#27AE60]' : 'text-slate-400'
                }
              >
                ✓ Imágenes analizadas
              </div>
              <div
                className={
                  engineProgressStep >= 4 ? 'text-[#27AE60]' : 'text-slate-400'
                }
              >
                ✓ Diagnóstico diferencial generado
              </div>
              <div className="text-[#1a5490] font-bold">
                ▶{' '}
                {engineAnalysing
                  ? 'Generando protocolo personalizado...'
                  : 'Protocolo personalizado listo'}
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-[#003366]">
            PROTOCOLO SUGERIDO
          </h3>

          {/* 📋 DIAGNÓSTICO PRINCIPAL */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#003366]">
              📋 DIAGNÓSTICO PRINCIPAL
            </div>
            <div className="border-2 border-[#E0E0E0] p-4 bg-white space-y-3 max-w-2xl">
              {isEditingDiagnosis ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={diagnosticoPrincipal}
                    onChange={(e) => setDiagnosticoPrincipal(e.target.value)}
                    className="w-full border border-[#1a5490] px-3 py-1.5 text-sm font-bold text-[#003366]"
                  />
                  <input
                    type="text"
                    value={diagnosticoSecundario}
                    onChange={(e) => setDiagnosticoSecundario(e.target.value)}
                    className="w-full border border-[#E0E0E0] px-3 py-1.5 text-xs text-[#003366]"
                  />
                  <input
                    type="text"
                    value={etiologia}
                    onChange={(e) => setEtiologia(e.target.value)}
                    className="w-full border border-[#E0E0E0] px-3 py-1.5 text-xs text-[#003366]"
                  />
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-[#003366]">
                    {diagnosticoPrincipal}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {diagnosticoSecundario}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsEditingDiagnosis(!isEditingDiagnosis)}
                className="px-3 py-1.5 border-2 border-[#1a5490] text-xs font-bold text-[#1a5490] hover:bg-[#1a5490] hover:text-white transition-colors"
              >
                [
                {isEditingDiagnosis
                  ? 'GUARDAR DIAGNÓSTICO'
                  : 'EDITAR DIAGNÓSTICO'}
                ]
              </button>
            </div>
          </div>

          {/* 📊 FASES DEL TRATAMIENTO (Fases 1, 2, 3 y 4) */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#003366]">
              📊 FASES DEL TRATAMIENTO
            </div>
            <div className="border-2 border-[#E0E0E0] p-5 bg-white space-y-5 max-w-2xl">
              {isEditingProtocol ? (
                <div className="space-y-4 text-xs text-[#003366]">
                  <div className="space-y-1.5 border-b border-[#E0E0E0] pb-3">
                    <div className="font-bold">{fase1.titulo}</div>
                    <input
                      type="text"
                      value={fase1.ajustes}
                      onChange={(e) =>
                        setFase1({ ...fase1, ajustes: e.target.value })
                      }
                      className="w-full border border-[#E0E0E0] px-2 py-1"
                    />
                    <input
                      type="text"
                      value={fase1.complementos}
                      onChange={(e) =>
                        setFase1({ ...fase1, complementos: e.target.value })
                      }
                      className="w-full border border-[#E0E0E0] px-2 py-1"
                    />
                    <input
                      type="text"
                      value={fase1.restriccion}
                      onChange={(e) =>
                        setFase1({ ...fase1, restriccion: e.target.value })
                      }
                      className="w-full border border-[#E0E0E0] px-2 py-1"
                    />
                  </div>

                  <div className="space-y-1.5 border-b border-[#E0E0E0] pb-3">
                    <div className="font-bold">{fase2.titulo}</div>
                    <input
                      type="text"
                      value={fase2.ajustes}
                      onChange={(e) =>
                        setFase2({ ...fase2, ajustes: e.target.value })
                      }
                      className="w-full border border-[#E0E0E0] px-2 py-1"
                    />
                    <input
                      type="text"
                      value={fase2.ejercicios}
                      onChange={(e) =>
                        setFase2({ ...fase2, ejercicios: e.target.value })
                      }
                      className="w-full border border-[#E0E0E0] px-2 py-1"
                    />
                    <input
                      type="text"
                      value={fase2.ergonomia}
                      onChange={(e) =>
                        setFase2({ ...fase2, ergonomia: e.target.value })
                      }
                      className="w-full border border-[#E0E0E0] px-2 py-1"
                    />
                  </div>

                  <div className="space-y-1.5 border-b border-[#E0E0E0] pb-3">
                    <div className="font-bold">{fase3.titulo}</div>
                    <input
                      type="text"
                      value={fase3.ajustes}
                      onChange={(e) =>
                        setFase3({ ...fase3, ajustes: e.target.value })
                      }
                      className="w-full border border-[#E0E0E0] px-2 py-1"
                    />
                    <input
                      type="text"
                      value={fase3.ejerciciosCasa}
                      onChange={(e) =>
                        setFase3({ ...fase3, ejerciciosCasa: e.target.value })
                      }
                      className="w-full border border-[#E0E0E0] px-2 py-1"
                    />
                    <input
                      type="text"
                      value={fase3.educacion}
                      onChange={(e) =>
                        setFase3({ ...fase3, educacion: e.target.value })
                      }
                      className="w-full border border-[#E0E0E0] px-2 py-1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold">{fase4.titulo}</div>
                    <input
                      type="text"
                      value={fase4.optimizacionRendimiento}
                      onChange={(e) =>
                        setFase4({
                          ...fase4,
                          optimizacionRendimiento: e.target.value,
                        })
                      }
                      className="w-full border border-[#E0E0E0] px-2 py-1"
                    />
                    <input
                      type="text"
                      value={fase4.integracionNeuromuscular}
                      onChange={(e) =>
                        setFase4({
                          ...fase4,
                          integracionNeuromuscular: e.target.value,
                        })
                      }
                      className="w-full border border-[#E0E0E0] px-2 py-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-sm text-[#003366] font-mono">
                  <div>
                    <div className="font-bold">{fase1.titulo}</div>
                    <div>├─ Ajustes: {fase1.ajustes}</div>
                    <div>├─ Complementos: {fase1.complementos}</div>
                    <div>└─ Restricción: {fase1.restriccion}</div>
                  </div>

                  <div>
                    <div className="font-bold">{fase2.titulo}</div>
                    <div>├─ Ajustes: {fase2.ajustes}</div>
                    <div>├─ Ejercicios: {fase2.ejercicios}</div>
                    <div>└─ Ergonomía: {fase2.ergonomia}</div>
                  </div>

                  <div>
                    <div className="font-bold">{fase3.titulo}</div>
                    <div>├─ Ajustes: {fase3.ajustes}</div>
                    <div>├─ Ejercicios en casa: {fase3.ejerciciosCasa}</div>
                    <div>└─ Educación: {fase3.educacion}</div>
                  </div>

                  <div>
                    <div className="font-bold">{fase4.titulo}</div>
                    <div>├─ Rendimiento: {fase4.optimizacionRendimiento}</div>
                    <div>└─ Control motor: {fase4.integracionNeuromuscular}</div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsEditingProtocol(!isEditingProtocol)}
                className="px-3 py-1.5 border-2 border-[#1a5490] text-xs font-bold text-[#1a5490] hover:bg-[#1a5490] hover:text-white transition-colors"
              >
                [
                {isEditingProtocol
                  ? 'CONFIRMAR CAMBIOS'
                  : 'PERSONALIZAR PROTOCOLO'}
                ]
              </button>
            </div>
          </div>

          {/* 🎯 OBJETIVOS ESPECÍFICOS */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#003366]">
              🎯 OBJETIVOS ESPECÍFICOS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="border-2 border-[#E0E0E0] p-4 bg-white space-y-2">
                <div className="text-xs font-bold text-[#003366]">
                  CORTO PLAZO (6 sem):
                </div>
                <textarea
                  rows={3}
                  value={objetivosCorto}
                  onChange={(e) => setObjetivosCorto(e.target.value)}
                  className="w-full text-xs text-[#003366] font-mono focus:outline-none"
                />
              </div>

              <div className="border-2 border-[#E0E0E0] p-4 bg-white space-y-2">
                <div className="text-xs font-bold text-[#003366]">
                  LARGO PLAZO (6 meses):
                </div>
                <textarea
                  rows={3}
                  value={objetivosLargo}
                  onChange={(e) => setObjetivosLargo(e.target.value)}
                  className="w-full text-xs text-[#003366] font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Botones finales: [GENERAR REPORTE PDF] [GUARDAR Y COMPLETAR] */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t-2 border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => {
                const record = buildFinalConsultationRecord();
                onSaveConsultation(record, true);
              }}
              className="px-5 py-3 bg-[#1a5490] hover:bg-[#003366] text-white font-bold text-sm cursor-pointer"
            >
              [GENERAR REPORTE PDF]
            </button>
            <button
              type="button"
              onClick={() => {
                const record = buildFinalConsultationRecord();
                onSaveConsultation(record, false);
              }}
              className="px-5 py-3 bg-[#27AE60] hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>[GUARDAR Y COMPLETAR]</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación al Cancelar */}
      {confirmCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#003366] max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#003366]">
              ¿Cancelar la consulta en curso?
            </h3>
            <p className="text-xs text-slate-600">
              Se ha guardado un borrador automático. ¿Deseas volver al Dashboard Principal?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelModal(false)}
                className="px-3.5 py-1.5 border border-[#E0E0E0] text-xs font-bold text-[#003366]"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-1.5 bg-[#E74C3C] text-white text-xs font-bold"
              >
                Sí, salir al Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
