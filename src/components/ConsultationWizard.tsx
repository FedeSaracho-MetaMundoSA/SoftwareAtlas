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

function formatClinicalDate(date: Date = new Date()): string {
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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
    'Los cambios se guardan al finalizar la consulta.'
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
  const [newPatCiudad, setNewPatCiudad] = useState('');
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
      ''
  );
  const [ciudad, setCiudad] = useState(
    initialConsultationToEdit?.anamnesis.ciudad ||
      selectedPatient?.ciudad ||
      ''
  );
  const [horasSedentario, setHorasSedentario] = useState(
    initialConsultationToEdit?.anamnesis.horasSedentarioDia ??
      selectedPatient?.horasSedentarioDia ??
      undefined
  );
  const [horasComputadora, setHorasComputadora] = useState(
    initialConsultationToEdit?.anamnesis.horasComputadoraDia ??
      selectedPatient?.horasComputadoraDia ??
      undefined
  );
  const [horasSmartphone, setHorasSmartphone] = useState(
    initialConsultationToEdit?.anamnesis.horasSmartphoneDia ??
      selectedPatient?.horasSmartphoneDia ??
      undefined
  );

  // Campos específicos por perfil (Niño / Mujer Adulta / Adulto)
  const [pesoMochilaNino, setPesoMochilaNino] = useState(
    initialConsultationToEdit?.anamnesis.contextoNino?.pesoMochilaKg ??
    undefined
  );
  const [posturaEscolarNino, setPosturaEscolarNino] = useState(
    initialConsultationToEdit?.anamnesis.contextoNino?.posturaEscolar || ''
  );
  const [deporteInfancia, setDeporteInfancia] = useState(
    initialConsultationToEdit?.anamnesis.contextoAdulto?.deporteInfancia ||
      initialConsultationToEdit?.anamnesis.contextoNino?.deportesInfancia ||
      ''
  );
  const [deporteActual, setDeporteActual] = useState(
    initialConsultationToEdit?.anamnesis.contextoAdulto?.deporteActual ||
      initialConsultationToEdit?.anamnesis.contextoNino?.deportesActuales ||
      ''
  );
  const [hijosMujer, setHijosMujer] = useState(
    initialConsultationToEdit?.anamnesis.contextoMujer?.cantidadHijos ??
    undefined
  );
  const [sobrecargaMujer, setSobrecargaMujer] = useState(
    initialConsultationToEdit?.anamnesis.contextoMujer?.nivelSobrecarga1a10 ??
    undefined
  );
  const [diccionarioKeywords, setDiccionarioKeywords] = useState(
    (
      initialConsultationToEdit?.diccionarioCliente ||
      selectedPatient?.diccionarioCliente || []
    ).join(' | ')
  );

  const [problemaHoy, setProblemaHoy] = useState(
    initialConsultationToEdit?.anamnesis.problemaDeHoy || ''
  );

  // Grabación de audio/video en Paso 2
  const [antecedentes, setAntecedentes] = useState(
    initialConsultationToEdit?.anamnesis.antecedentes || {
      escoliosis: undefined,
      cifosis: undefined,
      lordosis: undefined,
      asma: undefined,
      tiroides: undefined,
      otrosTexto: '',
      asimetriaPiernas: '',
      desviacionCadera: undefined,
    }
  );

  // PASO 3: Evaluación Clínica (Fase 2: 2.1 a 2.4 + Eje Cadera + Nervio Ciático + Psicofármacos)
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraStreamError, setCameraStreamError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [notasClinicasTexto, setNotasClinicasTexto] = useState(
    (
      initialConsultationToEdit?.evaluacionClinica.notasTiempoReal || [
      ]
    ).join('\n')
  );
  const [nuevaNotaInput, setNuevaNotaInput] = useState('');

  const [pruebasRealizadas, setPruebasRealizadas] = useState(
    initialConsultationToEdit?.evaluacionClinica.pruebasRealizadas || {
      posturaEnPie: false,
      movilidad: false,
      fuerza: false,
      neurologico: false,
      camillaSupino: false,
      cadera: false,
      palpacion: false,
      especiales: false,
    }
  );

  const [tablaFisica, setTablaFisica] = useState(
    initialConsultationToEdit?.evaluacionClinica.tablaResultadosFisicos || []
  );

  // Fase 2.2 y 2.4: Eje Cadera, Relato Ciático y Psicología/Psicofármacos
  const [ejeCaderaHallazgo, setEjeCaderaHallazgo] = useState(
    initialConsultationToEdit?.evaluacionClinica.maniobrasEjeCadera
      ?.ejeCaderaCentroGravedad ||
      ''
  );
  const [relatoCiatico, setRelatoCiatico] = useState(
    initialConsultationToEdit?.evaluacionClinica.maniobrasEjeCadera
      ?.relatoNervioCiatico ||
      ''
  );
  const [medicacionPsicotropa, setMedicacionPsicotropa] = useState(
    initialConsultationToEdit?.evaluacionClinica.pruebaPsicologica
      ?.medicacionPsicotropa || ''
  );
  const [actitudPsicologica, setActitudPsicologica] = useState<
    'Colaborador' | 'Defensivo' | 'Ansioso' | 'No evaluado'
  >(
    initialConsultationToEdit?.evaluacionClinica.pruebaPsicologica?.actitud ||
      'No evaluado'
  );

  // PASO 4: Visor DICOM y Análisis de Imágenes (Fase 3: 3.1 a 3.3)
  const [dicomStudies, setDicomStudies] = useState<DicomStudyItem[]>(
    initialConsultationToEdit?.imagenes.estudiosHistorial || []
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
      ''
  );
  const [ddProbable, setDdProbable] = useState(
    initialConsultationToEdit?.imagenes.diagnosticoDiferencialVisual
      ?.probable ||
      ''
  );
  const [ddDescartada, setDdDescartada] = useState(
    initialConsultationToEdit?.imagenes.diagnosticoDiferencialVisual
      ?.descartada || ''
  );
  const [ddNoVisible, setDdNoVisible] = useState(
    initialConsultationToEdit?.imagenes.diagnosticoDiferencialVisual
      ?.noVisible || ''
  );

  // PASO 5: Motor de Protocolo Personalizado (Fase 4)
  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);

  const [diagnosticoPrincipal, setDiagnosticoPrincipal] = useState(
    initialConsultationToEdit?.protocolo.diagnosticoPrincipal ||
      ''
  );
  const [diagnosticoSecundario, setDiagnosticoSecundario] = useState(
    initialConsultationToEdit?.protocolo.diagnosticoSecundario ||
      ''
  );
  const [etiologia, setEtiologia] = useState(
    initialConsultationToEdit?.protocolo.etiologia ||
      ''
  );

  const [fase1, setFase1] = useState(
    initialConsultationToEdit?.protocolo.fase1 || {
      titulo: 'FASE 1: Alivio agudo (4 semanas)',
      ajustes: '',
      complementos: '',
      restriccion: '',
    }
  );
  const [fase2, setFase2] = useState(
    initialConsultationToEdit?.protocolo.fase2 || {
      titulo: 'FASE 2: Fortalecimiento (8 semanas)',
      ajustes: '',
      ejercicios: '',
      ergonomia: '',
    }
  );
  const [fase3, setFase3] = useState(
    initialConsultationToEdit?.protocolo.fase3 || {
      titulo: 'FASE 3: Prevención (mantenimiento)',
      ajustes: '',
      ejerciciosCasa: '',
      educacion: '',
    }
  );
  const [fase4, setFase4] = useState(
    initialConsultationToEdit?.protocolo.fase4 || {
      titulo: 'FASE 4: Optimización y Rendimiento Funcional',
      optimizacionRendimiento: '',
      integracionNeuromuscular: '',
    }
  );

  const [objetivosCorto, setObjetivosCorto] = useState(
    (
      initialConsultationToEdit?.protocolo.objetivosCortoPlazo || []
    ).join('\n')
  );
  const [objetivosLargo, setObjetivosLargo] = useState(
    (
      initialConsultationToEdit?.protocolo.objetivosLargoPlazo || []
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

  const handleStartNewPatient = () => {
    setPatientMode('nuevo');
    setNewPatNombre('');
    setNewPatDob('');
    setNewPatEdad(0);
    setNewPatGenero('No especificado');
    setNewPatProfesion('');
    setNewPatCiudad('');
    setNewPatTelefono('');
    setNewPatEmail('');
    setPerfilGrupo('ADULTO');
    setProfesion('');
    setCiudad('');
    setHorasSedentario(undefined);
    setHorasComputadora(undefined);
    setHorasSmartphone(undefined);
    setPesoMochilaNino(undefined);
    setPosturaEscolarNino('');
    setDeporteInfancia('');
    setDeporteActual('');
    setHijosMujer(undefined);
    setSobrecargaMujer(undefined);
    setDiccionarioKeywords('');
    setProblemaHoy('');
    setAntecedentes({
      escoliosis: undefined,
      cifosis: undefined,
      lordosis: undefined,
      asma: undefined,
      tiroides: undefined,
      otrosTexto: '',
      asimetriaPiernas: '',
      desviacionCadera: undefined,
    });
    setNotasClinicasTexto('');
    setPruebasRealizadas({
      posturaEnPie: false,
      movilidad: false,
      fuerza: false,
      neurologico: false,
      camillaSupino: false,
      cadera: false,
      palpacion: false,
      especiales: false,
    });
    setTablaFisica([]);
    setEjeCaderaHallazgo('');
    setRelatoCiatico('');
    setMedicacionPsicotropa('');
    setActitudPsicologica('No evaluado');
    setDicomStudies([]);
    setActiveDicomId('');
    setDdConfirmada('');
    setDdProbable('');
    setDdDescartada('');
    setDdNoVisible('');
    setDiagnosticoPrincipal('');
    setDiagnosticoSecundario('');
    setEtiologia('');
    setFase1({
      titulo: 'FASE 1',
      ajustes: '',
      complementos: '',
      restriccion: '',
    });
    setFase2({
      titulo: 'FASE 2',
      ajustes: '',
      ejercicios: '',
      ergonomia: '',
    });
    setFase3({
      titulo: 'FASE 3',
      ajustes: '',
      ejerciciosCasa: '',
      educacion: '',
    });
    setFase4({
      titulo: 'FASE 4',
      optimizacionRendimiento: '',
      integracionNeuromuscular: '',
    });
    setObjetivosCorto('');
    setObjetivosLargo('');
    setLiveTranscript('');
    setInformeCompletoCharla(undefined);
  };

  // Cálculo automático de edad al cambiar Fecha de Nacimiento
  const handleDobChange = (dobStr: string) => {
    setNewPatDob(dobStr);
    if (!dobStr) {
      setNewPatEdad(0);
      return;
    }
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
      const relativeDistance = Math.round(
        Math.hypot(x - pendingPoint.x, y - pendingPoint.y)
      );
      const nuevoTrazo = {
        x1: pendingPoint.x,
        y1: pendingPoint.y,
        x2: x,
        y2: y,
        tipo: activeTool,
        etiqueta:
          activeTool === 'regla'
            ? `Distancia visual relativa: ${relativeDistance}% (sin calibrar)`
            : 'Marca visual (sin interpretación clínica)',
      };

      setDicomStudies((prev) =>
        prev.map((st) =>
          st.id === activeDicomStudy.id
            ? { ...st, trazosDibujo: [...st.trazosDibujo, nuevoTrazo] }
            : st
        )
      );
      setPendingPoint(null);
      setAutoSaveTimestamp('Anotación añadida; se guardará al finalizar.');
    }
  };

  const handleUploadNewDicom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAutoSaveTimestamp(
        'Formato no compatible: la vista previa admite JPEG, PNG y WebP; DICOM y PDF requieren un visor especializado.'
      );
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAutoSaveTimestamp('La imagen supera el límite de 2 MB para la vista previa local.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        setAutoSaveTimestamp('No se pudo leer el archivo de imagen.');
        return;
      }
      const newId = `rad-${Date.now()}`;
      const newStudy: DicomStudyItem = {
        id: newId,
        etiquetaCorta: `Rad${dicomStudies.length + 1}`,
        fechaCorta: 'Sin fecha',
        estudio: file.name.replace(/\.[^/.]+$/, ''),
        fechaCompleta: 'Fecha del estudio no informada',
        region: '',
        tecnica: file.type,
        imageUrl: dataUrl,
        hallazgos: [],
        impresion: '',
        anotacionesMedico: '',
        trazosDibujo: [],
      };
      setDicomStudies((prev) => [newStudy, ...prev]);
      setActiveDicomId(newId);
      setAutoSaveTimestamp(
        'Imagen cargada para revisión profesional; no se generaron hallazgos automáticos.'
      );
    };
    reader.onerror = () => {
      setAutoSaveTimestamp('No se pudo leer el archivo de imagen.');
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
          profesion: profesion || newPatProfesion,
          ciudad: ciudad || newPatCiudad,
          telefono: newPatTelefono.trim(),
          email: newPatEmail.trim(),
          ultimaCita: formatClinicalDate(),
          proximaCita: '',
          estado: 'Evaluación Inicial',
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
      fechaConsulta: formatClinicalDate(),
      estadoConsulta: 'Evaluación Inicial',
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
        duracionAudioSegundos:
          initialConsultationToEdit?.anamnesis.duracionAudioSegundos ?? 0,
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
                actividadPostParto: '',
              }
            : undefined,
        contextoAdulto:
          perfilGrupo === 'ADULTO'
            ? {
                deporteActual,
                deporteInfancia,
                soportesPosturales: '',
              }
            : undefined,
      },
      evaluacionClinica: {
        duracionGrabacionSegundos:
          initialConsultationToEdit?.evaluacionClinica
            .duracionGrabacionSegundos ?? 0,
        notasTiempoReal: notasClinicasTexto
          .split('\n')
          .map((l) => l.replace(/^•\s*/, '').trim())
          .filter(Boolean),
        pruebasRealizadas,
        tablaResultadosFisicos: tablaFisica,
        pruebaPsicologica: {
          actitud: actitudPsicologica,
          humor: 'No evaluado',
          eventosVitales: '',
          medicacionPsicotropa,
          implicacionClinica: '',
        },
        maniobrasEjeCadera: {
          observacionDePie: '',
          evaluacionCamilla: '',
          ejeCaderaCentroGravedad: ejeCaderaHallazgo,
          relatoNervioCiatico: relatoCiatico,
          tonoMuscular: '',
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
          impactoFuncionalPronostico: '',
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
        objetivosMedianoPlazo: [],
        objetivosLargoPlazo: objetivosLargo
          .split('\n')
          .map((s) => s.replace(/^•\s*/, '').trim())
          .filter(Boolean),
        proximaCitaFechaHora: '',
        razonamientoMedico: {
          porQuePatologia: ddConfirmada,
          diferencialesDescartados: ddDescartada,
          riesgosContraindicaciones: '',
          puntosContactoDireccionAjuste: '',
          criteriosAlta: '',
        },
      },
      transcripcionCharla: liveTranscript,
      informeCompletoCharla,
      seguimientos: initialConsultationToEdit?.seguimientos || [],
    };
  };

  // Autocompletar todos los campos fundamentales de la consulta desde la charla en vivo
  const handleApplyLiveScribeExtraction = (
    payload: ScribeExtractedPayload,
    fullTranscript: string
  ) => {
    const fullName =
      `${payload.datosPaciente.nombre} ${payload.datosPaciente.apellidos}`.trim();
    const existing = fullName
      ? patients.find(
          (p) => p.nombreCompleto.toLowerCase() === fullName.toLowerCase()
        )
      : undefined;

    if (existing) {
      handleSelectExistingPatient(existing);
    } else if (fullName) {
      handleStartNewPatient();
    }

    setLiveTranscript(fullTranscript);
    setInformeCompletoCharla(payload.informeCompletoCharla);

    if (fullName) {
      setNewPatNombre(fullName);
    }
    if (!existing && payload.datosPaciente.genero !== 'No especificado') {
      setNewPatGenero(payload.datosPaciente.genero);
    }
    if (!existing && payload.datosPaciente.profesion) {
      setNewPatProfesion(payload.datosPaciente.profesion);
    }
    if (!existing && payload.datosPaciente.ciudad) {
      setNewPatCiudad(payload.datosPaciente.ciudad);
    }
    if (payload.datosPaciente.telefono) {
      setNewPatTelefono(payload.datosPaciente.telefono);
    }
    if (payload.datosPaciente.email) {
      setNewPatEmail(payload.datosPaciente.email);
    }

    // Paso 2: Anamnesis
    if (
      payload.datosPaciente.edad > 0 &&
      (payload.datosPaciente.edad < 16 ||
        payload.datosPaciente.genero !== 'No especificado')
    ) {
      setPerfilGrupo(
        payload.datosPaciente.edad < 16
          ? 'NIÑO'
          : payload.datosPaciente.genero === 'Femenino'
          ? 'MUJER_ADULTA'
          : 'ADULTO'
      );
    }
    if (!existing && payload.datosPaciente.profesion) {
      setProfesion(payload.datosPaciente.profesion);
    }
    if (!existing && payload.datosPaciente.ciudad) {
      setCiudad(payload.datosPaciente.ciudad);
    }
    if (!existing && payload.datosPaciente.horasSedentarioDia > 0) {
      setHorasSedentario(payload.datosPaciente.horasSedentarioDia);
    }
    if (!existing && payload.datosPaciente.horasComputadoraDia > 0) {
      setHorasComputadora(payload.datosPaciente.horasComputadoraDia);
    }
    if (!existing && payload.datosPaciente.horasSmartphoneDia > 0) {
      setHorasSmartphone(payload.datosPaciente.horasSmartphoneDia);
    }
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
      escoliosis: payload.anamnesisExtraida.escoliosis ?? prev.escoliosis,
      cifosis: payload.anamnesisExtraida.cifosis ?? prev.cifosis,
      lordosis: payload.anamnesisExtraida.lordosis ?? prev.lordosis,
      asma: payload.anamnesisExtraida.asma ?? prev.asma,
      tiroides: payload.anamnesisExtraida.tiroides ?? prev.tiroides,
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
    if (
      payload.evaluacionExtraida.medicacionPsicotropa !== 'No informado.'
    ) {
      setMedicacionPsicotropa(payload.evaluacionExtraida.medicacionPsicotropa);
    }

    setAutoSaveTimestamp(
      'Borrador extraído de la charla; revisar y confirmar cada dato antes de guardar.'
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
            if (
              patientMode === 'nuevo' &&
              (!newPatNombre.trim() ||
                !newPatDob ||
                new Date(`${newPatDob}T00:00:00`) > new Date() ||
                newPatEdad > 120 ||
                newPatEdad < 0)
            ) {
              setStep(1);
              setAutoSaveTimestamp(
                'Complete y confirme la identidad y fecha de nacimiento antes de guardar el reporte.'
              );
              return;
            }
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
                onChange={handleStartNewPatient}
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
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => handleDobChange(e.target.value)}
                    required
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#003366] mb-1">
                    Edad Calculada (años):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={newPatEdad}
                    readOnly
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
                  (!newPatNombre.trim() ||
                    !newPatDob ||
                    new Date(`${newPatDob}T00:00:00`) > new Date() ||
                    newPatEdad > 120 ||
                    newPatEdad < 0)
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
                    profesion: newPatProfesion.trim(),
                    ciudad: newPatCiudad.trim(),
                    telefono: newPatTelefono.trim(),
                    email: newPatEmail.trim(),
                    ultimaCita: formatClinicalDate(),
                    proximaCita: '',
                    estado: 'Evaluación Inicial',
                    horasSedentarioDia: horasSedentario,
                    horasComputadoraDia: horasComputadora,
                    horasSmartphoneDia: horasSmartphone,
                  };
                  onCreatePatient(created);
                  setSelectedPatientId(created.id);
                  setPatientMode('existente');
                  setPerfilGrupo(grupoAuto);
                  setProfesion(created.profesion);
                  setCiudad(created.ciudad);
                }
                setStep(2);
              }}
              disabled={
                patientMode === 'nuevo' &&
                (!newPatNombre.trim() ||
                  !newPatDob ||
                  new Date(`${newPatDob}T00:00:00`) > new Date() ||
                  newPatEdad > 120 ||
                  newPatEdad < 0)
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
                    value={horasSedentario ?? ''}
                    onChange={(e) =>
                      setHorasSedentario(
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
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
                    value={horasComputadora ?? ''}
                    onChange={(e) =>
                      setHorasComputadora(
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
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
                    value={horasSmartphone ?? ''}
                    onChange={(e) =>
                      setHorasSmartphone(
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
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
                        value={pesoMochilaNino ?? ''}
                        onChange={(e) =>
                          setPesoMochilaNino(
                            e.target.value === ''
                              ? undefined
                              : Number(e.target.value)
                          )
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
                          value={hijosMujer ?? ''}
                          onChange={(e) =>
                            setHijosMujer(
                              e.target.value === ''
                                ? undefined
                                : Number(e.target.value)
                            )
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
                          value={sobrecargaMujer ?? ''}
                          onChange={(e) =>
                            setSobrecargaMujer(
                              e.target.value === ''
                                ? undefined
                                : Number(e.target.value)
                            )
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

          {/* PROBLEMA DE HOY */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#003366]">
              PROBLEMA DE HOY
            </h3>
            <div className="border-2 border-[#E0E0E0] p-3 bg-white space-y-2">
              <div className="text-xs text-slate-500">
                Registre el relato con sus propias notas. Esta versión no graba ni
                almacena audio desde este formulario.
              </div>
              <textarea
                rows={4}
                value={problemaHoy}
                onChange={(e) => setProblemaHoy(e.target.value)}
                placeholder="Describa el motivo de consulta con las palabras del paciente."
                className="w-full text-sm text-[#003366] focus:outline-none"
              />
              <div className="pt-2 border-t border-[#E0E0E0]">
                <label className="block text-xs font-bold text-[#1a5490] mb-1">
                  Frases textuales del paciente, separadas por |:
                </label>
                <input
                  type="text"
                  value={diccionarioKeywords}
                  onChange={(e) => setDiccionarioKeywords(e.target.value)}
                  className="w-full border border-[#E0E0E0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#003366]"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowLiveScribePanel(true)}
                className="px-3.5 py-1.5 border-2 border-[#1a5490] text-xs font-bold text-[#1a5490]"
              >
                Abrir panel de transcripción en vivo
              </button>
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
                      Vista de cámara inactiva
                    </div>
                    <div className="text-xs text-slate-300">
                      La guía visual no realiza análisis postural automático.
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-px h-full bg-emerald-400/50" />
                  <div className="h-px w-full bg-emerald-400/50 absolute" />
                </div>
              </div>
            </div>

            <div className="border-2 border-[#E0E0E0] p-4 bg-[#F8FAFC] flex flex-col justify-between gap-3">
              <div className="font-bold text-sm text-[#003366] flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-[#1a5490]" />
                Audio y transcripción
              </div>
              <p className="text-xs text-slate-600">
                La grabación y transcripción se realizan desde el panel de charla
                en vivo. Este espacio no simula una captura de audio.
              </p>
              <button
                type="button"
                onClick={() => setShowLiveScribePanel(true)}
                className="w-full py-2 bg-[#1a5490] text-white text-xs font-bold"
              >
                Abrir panel de charla en vivo
              </button>
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
              2.4 REGISTRO DE CADERA / PELVIS Y SÍNTOMAS RELACIONADOS
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#003366] mb-1">
                  Hallazgos observados en cadera / pelvis (sin inferir causalidad):
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
                  Síntomas o relato referido sobre trayecto ciático:
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
                  Observación conductual durante la consulta (no diagnóstica):
                </label>
                <select
                  value={actitudPsicologica}
                  onChange={(e) =>
                    setActitudPsicologica(
                      e.target.value as
                        | 'Colaborador'
                        | 'Defensivo'
                        | 'Ansioso'
                        | 'No evaluado'
                    )
                  }
                  className="w-full border border-[#E0E0E0] bg-white px-2.5 py-1.5 text-[#003366]"
                >
                  <option value="No evaluado">No evaluado / no informado</option>
                  <option value="Colaborador">
                    Observación: colaborador
                  </option>
                  <option value="Ansioso">
                    Observación: expresa preocupación
                  </option>
                  <option value="Defensivo">
                    Observación: actitud defensiva
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#003366] mb-1">
                  Medicación referida (sin inferir efectos):
                </label>
                <input
                  type="text"
                  value={medicacionPsicotropa}
                  onChange={(e) => setMedicacionPsicotropa(e.target.value)}
                  placeholder="No informado"
                  className="w-full border border-[#E0E0E0] bg-white px-2.5 py-1.5 text-[#003366]"
                />
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
      {step === 4 && !activeDicomStudy && (
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#003366]">
            IMÁGENES CLÍNICAS — VISTA PREVIA LOCAL
          </h3>
          <p className="text-sm text-slate-600">
            Todavía no hay imágenes adjuntas. Esta vista previa acepta JPEG,
            PNG o WebP (máximo 2 MB); no interpreta estudios ni procesa DICOM o
            PDF. Registre manualmente los datos y hallazgos confirmados por el
            profesional.
          </p>
          <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1a5490] text-white text-xs font-bold cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Adjuntar imagen JPEG / PNG / WebP</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUploadNewDicom}
              className="hidden"
            />
          </label>
          <div className="flex justify-end pt-4 border-t-2 border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => setStep(5)}
              className="px-6 py-2.5 bg-[#1a5490] hover:bg-[#003366] text-white font-bold text-sm cursor-pointer"
            >
              Continuar sin imágenes
            </button>
          </div>
        </div>
      )}
      {step === 4 && activeDicomStudy && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#003366]">
              VISTA PREVIA DE IMAGEN — SIN INTERPRETACIÓN AUTOMÁTICA
            </h3>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a5490] text-white text-xs font-bold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>+ Adjuntar imagen</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUploadNewDicom}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-slate-600">
            Solo JPEG, PNG o WebP hasta 2 MB. No admite ni interpreta archivos
            DICOM o PDF; las marcas son visuales y no equivalen a mediciones
            calibradas.
          </p>

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
                        <Ruler className="w-3 h-3" /> 📏 Trazar distancia relativa
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
                  <strong>Región:</strong>{' '}
                  {activeDicomStudy.region || 'No informada'}
                </div>
                <div>
                  <strong>Formato del archivo:</strong> {activeDicomStudy.tecnica}
                  {activeDicomStudy.corteOrientacion &&
                    ` (${activeDicomStudy.corteOrientacion})`}
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
                  REGISTRO PROFESIONAL DE HALLAZGOS (NO GENERADO POR EL SISTEMA)
                </div>
                <div>
                  <span className="font-bold text-[#27AE60] block">
                    Confirmada por profesional:
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
                    Posible (requiere criterio profesional):
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
                    Descartada por profesional:
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
                    No evaluable en esta imagen:
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
          <div className="border-2 border-amber-300 p-4 bg-amber-50 space-y-1">
            <div className="font-bold text-sm text-amber-900">
              Revisión profesional requerida
            </div>
            <p className="text-xs text-amber-900">
              Este prototipo no analiza hallazgos ni genera diagnósticos,
              pronósticos o tratamientos. Complete únicamente lo evaluado y
              decidido por el profesional responsable.
            </p>
          </div>

          <h3 className="text-sm font-bold text-[#003366]">
            PLAN CLÍNICO REGISTRADO POR EL PROFESIONAL
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
