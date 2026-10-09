import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  FileText,
  Mic,
  MicOff,
  Play,
  RefreshCw,
  Sparkles,
  Square,
  UserCheck,
  Video,
  VideoOff,
} from 'lucide-react';
import { PatientProfileGroup } from '../types/wireframeTypes';

export interface ScribeExtractedPayload {
  datosPaciente: {
    nombre: string;
    apellidos: string;
    edad: number;
    fechaNacimientoEstimada?: string;
    genero: 'Masculino' | 'Femenino' | 'No especificado';
    perfilGrupo?: PatientProfileGroup;
    profesion: string;
    ciudad: string;
    telefono?: string;
    email?: string;
    horasSedentarioDia: number;
    horasComputadoraDia: number;
    horasSmartphoneDia: number;
  };
  anamnesisExtraida: {
    problemaDeHoy: string;
    diccionarioCliente: string[];
    escoliosis?: boolean;
    cifosis?: boolean;
    lordosis?: boolean;
    asma?: boolean;
    tiroides?: boolean;
    otrosAntecedentes: string;
    asimetriaPiernas?: string;
    desviacionCadera?: boolean;
    pesoMochilaKg?: number;
    posturaEscolar?: string;
    cantidadHijos?: number;
    nivelSobrecarga1a10?: number;
  };
  evaluacionExtraida: {
    notasTiempoReal: string[];
    ejeCaderaCentroGravedad: string;
    relatoNervioCiatico: string;
    actitudPsicologica: 'Colaborador' | 'Ansioso' | 'Defensivo' | 'No evaluado';
    medicacionPsicotropa: string;
    flexionAnteriorGrados?: string;
    fuerzaGluteos?: string;
  };
  protocoloExtraido: {
    diagnosticoPrincipal: string;
    diagnosticoSecundario: string;
    etiologia: string;
    fase1Ajustes: string;
    fase1Complementos: string;
    fase1Restriccion: string;
    fase2Ajustes: string;
    fase2Ejercicios: string;
    fase2Ergonomia: string;
    fase3Ajustes: string;
    fase3EjerciciosCasa: string;
    fase3Educacion: string;
    objetivosCortoPlazo: string[];
    objetivosLargoPlazo: string[];
  };
  informeCompletoCharla: {
    tituloInforme: string;
    resumenConversacion: string;
    anamnesisNarrativa: string;
    correlacionBiomecanicaEjeCadera: string;
    planTerapeuticoDetallado: string;
  };
}

interface LiveClinicalScribePanelProps {
  transcript: string;
  onTranscriptChange: (nextTranscript: string) => void;
  informeCharla: ScribeExtractedPayload['informeCompletoCharla'] | undefined;
  onApplyExtractedData: (
    payload: ScribeExtractedPayload,
    fullTranscript: string
  ) => void;
  onJumpToFullReport?: () => void;
}

const DEMO_DIALOGUE_LINES: Record<
  'ADULTO' | 'MUJER' | 'NINO',
  string[]
> = {
  ADULTO: [
    '[00:02] Juan Antonio Villalba (MP 542): Buen día, bienvenido al consultorio ATLAS. Decime por favor tu nombre y apellido, tu edad y a qué te dedicás.',
    '[00:09] Paciente: Buen día Juan Antonio. Me llamo Martín Alejandro Morales, tengo 38 años, soy arquitecto y vivo en Salta.',
    '[00:18] Juan Antonio Villalba (MP 542): Perfecto Martín. Contame cuántas horas estás sentado por día frente a la computadora y con el celular, y qué dolor te trae hoy.',
    '[00:26] Paciente: Trabajo sentado unas 9 horas por día, 8 horas en la computadora diseñando planos y unas 4 horas con el celular. Hace 2 meses siento la cintura rígida a la mañana, un pinchazo fuerte en la espalda baja derecha al inclinarme y siento que me tira desde el glúteo hacia atrás del muslo.',
    '[00:44] Juan Antonio Villalba (MP 542): ¿Tenés antecedentes de escoliosis, lordosis, asma o tiroides? ¿Tomás alguna medicación?',
    '[00:50] Paciente: Me habían dicho que tengo hiperlordosis lumbar y una diferencia de 5 milímetros en la pierna derecha. No tomo psicofármacos, solo algún antiinflamatorio.',
    '[01:02] Juan Antonio Villalba (MP 542): Mirá a la cámara mientras evaluamos tu postura de pie y ahora en camilla. Aunque te duela L4-L5, el eje principal es tu cadera, que es tu centro de gravedad: tenés rotación ilíaca anterior derecha, flexión anterior reducida a 35° y fuerza glútea en 4/5. Mientras te palpo te explico: el nervio ciático nace acá en tu cintura y va hasta tu pie; al desalinearse la cadera por estar 9 horas sentado, sobrecarga L4-L5 e irrita el nervio.',
  ],
  MUJER: [
    '[00:02] Juan Antonio Villalba (MP 542): Hola, bienvenida. Decime tu nombre completo, edad, profesión y dónde vivís para que el sistema vaya completando tu ficha.',
    '[00:10] Paciente: Hola Juan Antonio, soy Valeria Soledad Quiroga, tengo 41 años, soy contadora y docente, vivo en Salta capital.',
    '[00:19] Juan Antonio Villalba (MP 542): Contame Valeria, ¿tenés hijos, cuántas horas usás computadora y celular, y cuál es tu molestia principal hoy?',
    '[00:28] Paciente: Tengo 3 hijos, estoy 7 horas sentada por día, 6 horas en la computadora y 5 horas con el celular. Siento como una mochila de plomo en los hombros, dolor cervical que me sube a la nuca y dolor en la cadera izquierda al estar parada.',
    '[00:45] Juan Antonio Villalba (MP 542): ¿Antecedentes de tiroides, cifosis o escoliosis?',
    '[00:50] Paciente: Sí, tengo hipotiroidismo controlado y cifosis dorsal.',
    '[00:58] Juan Antonio Villalba (MP 542): Evaluando en cámara y camilla: vemos antepulsión cervical y basculación de cadera izquierda. Corregimos primero el eje de tu cadera (centro de gravedad) para alinear la columna dorsal y liberar C1-C2 y L5-S1, descomprimiendo todo el recorrido del nervio ciático de la cintura al pie.',
  ],
  NINO: [
    '[00:02] Juan Antonio Villalba (MP 542): Hola campeón, bienvenidos. Decime tu nombre y apellido, cuántos años tenés y a qué colegio vas acá en Salta.',
    '[00:10] Paciente: Hola Juan Antonio, me llamo Mateo Nicolás Paz, tengo 11 años, soy estudiante de sexto grado en Salta.',
    '[00:18] Juan Antonio Villalba (MP 542): ¿Cuántas horas estás sentado en clase, cuánto pesa tu mochila y cuántas horas usás el celular o la compu?',
    '[00:26] Paciente: Estoy 6 horas sentado en la escuela, uso 2 horas la computadora y 4 horas el celular acostado en la cama. Mi mochila pesa 6 kilos y me cansa la espalda media; mi mamá vio que tengo el hombro derecho más alto.',
    '[00:42] Juan Antonio Villalba (MP 542): En la cámara postural y Test de Adams vemos actitud escoliótica juvenil con desnivel pélvico funcional. Nivelando el eje de cadera en camilla, la columna se alinea para acompañar tu crecimiento sano.',
  ],
};

// Parser local instantáneo que extrae Nombre, Apellido, Edad, Género, Profesión, Horas, etc. mientras la persona habla
export function parseLiveTranscriptLocally(
  text: string
): ScribeExtractedPayload {
  const clean = text.trim();

  // 1. Extraer nombre y apellido
  let nombre = '';
  let apellidos = '';
  const nameMatch =
    clean.match(
      /(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})/i
    ) ||
    clean.match(
      /Paciente:\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,2})/i
    );
  if (nameMatch && nameMatch[1]) {
    const parts = nameMatch[1].trim().split(/\s+/);
    if (parts.length >= 3) {
      nombre = `${parts[0]} ${parts[1]}`;
      apellidos = parts.slice(2).join(' ');
    } else if (parts.length === 2) {
      nombre = parts[0];
      apellidos = parts[1];
    } else {
      nombre = parts[0];
      apellidos = '';
    }
  }

  // 2. Extraer edad
  let edad = 0;
  const ageMatch = clean.match(/tengo\s+(\d{1,2})\s*años|(\d{1,2})\s*años/i);
  if (ageMatch) {
    edad = Number(ageMatch[1] || ageMatch[2]) || 0;
  }

  // 3. Extraer género y perfil
  const lower = clean.toLowerCase();
  const genderMatch = clean.match(
    /\b(masculino|femenino|hombre|mujer|varón|varon)\b/i
  );
  const genero: 'Masculino' | 'Femenino' | 'No especificado' = genderMatch
    ? /femenino|mujer/i.test(genderMatch[1])
      ? 'Femenino'
      : 'Masculino'
    : 'No especificado';
  const perfilGrupo: PatientProfileGroup | undefined =
    edad > 0 && edad < 16
      ? 'NIÑO'
      : edad >= 16 && genero === 'Femenino'
      ? 'MUJER_ADULTA'
      : edad >= 16 && genero === 'Masculino'
      ? 'ADULTO'
      : undefined;

  // 4. Extraer profesión
  let profesion = '';
  const profMatch = clean.match(
    /soy\s+(contador(?:a)?(?:\s+y\s+docente)?|arquitecto(?:a)?|profesor(?:a)?|docente|estudiante|abogado(?:a)?|ingeniero(?:a)?|comerciante|administrativo(?:a)?|chofer|médico(?:a)?|odontólogo(?:a)?)/i
  );
  if (profMatch && profMatch[1]) {
    profesion =
      profMatch[1].charAt(0).toUpperCase() + profMatch[1].slice(1).toLowerCase();
  }

  // 5. Extraer ciudad
  let ciudad = '';
  const cityMatch = clean.match(
    /vivo\s+(?:acá\s+)?en\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)/i
  );
  if (cityMatch && cityMatch[1]) {
    ciudad = cityMatch[1].trim();
  }

  // 6. Extraer horas de sedentarismo, computadora y celular
  const sedMatch = clean.match(/(\d{1,2})\s*horas?\s*(?:por\s*día\s*)?(?:sentad[oa]|en\s*clase)/i) ||
    clean.match(/sentad[oa]\s*(?:unas\s*)?(\d{1,2})\s*horas?/i);
  const pcMatch = clean.match(/(\d{1,2})\s*horas?\s*(?:frente\s*a\s*)?(?:la\s*)?(?:computadora|pc|pantallas)/i);
  const phoneMatch = clean.match(/(\d{1,2})\s*horas?\s*(?:con\s*el\s*|en\s*el\s*|de\s*)?(?:celular|smartphone)/i);

  const horasSedentarioDia = sedMatch ? Number(sedMatch[1]) : 0;
  const horasComputadoraDia = pcMatch ? Number(pcMatch[1]) : 0;
  const horasSmartphoneDia = phoneMatch ? Number(phoneMatch[1]) : 0;

  // 7. Antecedentes
  const extractReportedCondition = (
    terms: string[]
  ): boolean | undefined => {
    for (const term of terms) {
      const index = lower.indexOf(term);
      if (index < 0) continue;
      const sentenceStart =
        Math.max(
          lower.lastIndexOf('.', index),
          lower.lastIndexOf(';', index),
          lower.lastIndexOf('!', index),
          lower.lastIndexOf('?', index)
        ) + 1;
      const precedingWords = lower.slice(sentenceStart, index).trim();
      const followingWords = lower.slice(index + term.length).trimStart();
      if (/\b(no sabe|no recuerda|no está seguro)\b/.test(precedingWords)) {
        return undefined;
      }
      if (
        /\b(?:niega|sin)\b/.test(precedingWords) ||
        /\bno\s+(?:tiene|presenta|padece|refiere|hay)\b/.test(precedingWords) ||
        /^(?:no|ausente|negativo)\b/.test(followingWords)
      ) {
        return false;
      }
      return true;
    }
    return undefined;
  };
  const escoliosis = extractReportedCondition(['escoliosis', 'escoliótica']);
  const cifosis = extractReportedCondition(['cifosis', 'encorva']);
  const lordosis = extractReportedCondition(['lordosis', 'hiperlordosis']);
  const asma = extractReportedCondition(['asma']);
  const tiroides = extractReportedCondition(['tiroides', 'hipotiroidismo']);

  // 8. Diccionario del cliente
  const diccionarioCliente: string[] = [];
  for (const expression of [
    /cintura (?:trabada|rígida)[^,.!?]*/i,
    /pinchazo[^,.!?]*/i,
    /mochila de plomo[^,.!?]*/i,
    /hombro derecho más alto/i,
  ]) {
    const phrase = clean.match(expression)?.[0]?.trim();
    if (phrase && !diccionarioCliente.includes(phrase)) {
      diccionarioCliente.push(phrase);
    }
  }
  const problemaDeHoy = 'Pendiente de completar por el profesional.';
  const diagnosticoPrincipal = 'Pendiente de evaluación profesional.';
  const requiereRevision = 'Pendiente de revisión clínica.';

  return {
    datosPaciente: {
      nombre,
      apellidos,
      edad,
      genero,
      perfilGrupo,
      profesion,
      ciudad,
      telefono: '',
      horasSedentarioDia,
      horasComputadoraDia,
      horasSmartphoneDia,
    },
    anamnesisExtraida: {
      problemaDeHoy,
      diccionarioCliente,
      escoliosis,
      cifosis,
      lordosis,
      asma,
      tiroides,
      otrosAntecedentes: '',
    },
    evaluacionExtraida: {
      notasTiempoReal:
        nombre || apellidos ? [`Paciente: ${nombre} ${apellidos}`.trim()] : [],
      ejeCaderaCentroGravedad: requiereRevision,
      relatoNervioCiatico: requiereRevision,
      actitudPsicologica: 'No evaluado',
      medicacionPsicotropa: 'No informado.',
      flexionAnteriorGrados: '',
      fuerzaGluteos: '',
    },
    protocoloExtraido: {
      diagnosticoPrincipal,
      diagnosticoSecundario: requiereRevision,
      etiologia: requiereRevision,
      fase1Ajustes: requiereRevision,
      fase1Complementos: requiereRevision,
      fase1Restriccion: requiereRevision,
      fase2Ajustes: requiereRevision,
      fase2Ejercicios: requiereRevision,
      fase2Ergonomia: requiereRevision,
      fase3Ajustes: requiereRevision,
      fase3EjerciciosCasa: requiereRevision,
      fase3Educacion: requiereRevision,
      objetivosCortoPlazo: [],
      objetivosLargoPlazo: [],
    },
    informeCompletoCharla: {
      tituloInforme: `INFORME CLÍNICO INTEGRAL DE CHARLA EN VIVO — ${nombre.toUpperCase()} ${apellidos.toUpperCase()}`,
      resumenConversacion: clean,
      anamnesisNarrativa: `${problemaDeHoy} Frases clave registradas en el diccionario del paciente: ${diccionarioCliente.join(
        ' | '
      )}.`,
      correlacionBiomecanicaEjeCadera: requiereRevision,
      planTerapeuticoDetallado: requiereRevision,
    },
  };
}

export const LiveClinicalScribePanel: React.FC<LiveClinicalScribePanelProps> = ({
  transcript,
  onTranscriptChange,
  informeCharla,
  onApplyExtractedData,
  onJumpToFullReport,
}) => {
  const [isCameraAndMicConnected, setIsCameraAndMicConnected] = useState(false);
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cameraSnapshotUrl, setCameraSnapshotUrl] = useState<string | null>(
    null
  );
  const [isProcessingGemini, setIsProcessingGemini] = useState(false);
  const [isTranscribingAudioBlob, setIsTranscribingAudioBlob] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [autoDetectedFields, setAutoDetectedFields] =
    useState<ScribeExtractedPayload | null>(() =>
      transcript.trim() ? parseLiveTranscriptLocally(transcript) : null
    );
  const [manualUtterance, setManualUtterance] = useState('');
  const [speakerRole, setSpeakerRole] = useState<'PACIENTE' | 'VILLALBA'>(
    'PACIENTE'
  );
  const [isDemoTranscript, setIsDemoTranscript] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Actualizar autocompletado instantáneo cada vez que crece la transcripción
  useEffect(() => {
    if (!transcript.trim()) return;
    const localExtracted = parseLiveTranscriptLocally(transcript);
    setAutoDetectedFields(localExtracted);
  }, [transcript]);

  // Cronómetro cuando cámara + micrófono están conectados
  useEffect(() => {
    if (!isCameraAndMicConnected && !isSpeechListening) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCameraAndMicConnected, isSpeechListening]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      stopAllMediaAndRecognition();
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  const stopAllMediaAndRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraAndMicConnected(false);
    setIsSpeechListening(false);
    setMicVolume(0);
  };

  const startCameraAndMicLive = async () => {
    if (isCameraAndMicConnected) {
      stopAllMediaAndRecognition();
      setStatusBanner(
        'Cámara y micrófono desconectados. La transcripción y los datos autocompletados se han conservado.'
      );
      return;
    }

    setStatusBanner(
      'Conectando Cámara + Micrófono en vivo e iniciando transcripción continua y autocompletado...'
    );

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      setIsCameraAndMicConnected(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Medidor real de nivel de micrófono con Web Audio API
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 90) * 100));
          setMicVolume(normalized);
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }

      // Iniciar grabación en segundo plano para transcripción con Gemini 3.5 Transcribe
      recordedChunksRef.current = [];
      try {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            recordedChunksRef.current.push(ev.data);
          }
        };
        recorder.start(3000);
      } catch {
        // ignore if MediaRecorder mime unsupported
      }

      // Iniciar reconocimiento de voz en tiempo real (Web Speech API en español)
      startBrowserSpeechRecognition();

      setStatusBanner(
        '🔴 EN VIVO: Cámara + Micrófono activos. Habla con el paciente: el sistema transcribe la charla y autocompleta Nombre, Apellido, Edad, Género y Ficha Clínica automáticamente.'
      );
    } catch {
      // Si el navegador bloquea la cámara/micrófono físico, activamos igualmente el reconocedor de voz o modo asistido
      setIsCameraAndMicConnected(true);
      startBrowserSpeechRecognition();
      setStatusBanner(
        '🎙️ Modo Escucha Activo: Puedes hablar por micrófono, escribir en el diálogo o usar el botón de Simulación de Charla en Vivo.'
      );
    }
  };

  const startBrowserSpeechRecognition = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'es-AR';
      recognition.continuous = true;
      recognition.interimResults = false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let addedLines = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const spoken = String(event.results[i][0].transcript).trim();
            if (spoken) {
              const mins = String(Math.floor(elapsedSeconds / 60)).padStart(
                2,
                '0'
              );
              const secs = String(elapsedSeconds % 60).padStart(2, '0');
              addedLines += `\n[${mins}:${secs}] Charla en vivo: ${spoken}`;
            }
          }
        }
        if (addedLines) {
          const updated = `${transcript}${addedLines}`.trim();
          onTranscriptChange(updated);
          const localPayload = parseLiveTranscriptLocally(updated);
          setAutoDetectedFields(localPayload);
          onApplyExtractedData(localPayload, updated);
        }
      };

      recognition.onerror = () => {
        // keep listening or ignore transient speech api warnings
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsSpeechListening(true);
    } catch {
      // ignore
    }
  };

  const captureCameraFrame = (): string | null => {
    if (!videoRef.current || !videoRef.current.videoWidth) {
      return cameraSnapshotUrl;
    }
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCameraSnapshotUrl(dataUrl);
    setStatusBanner('📸 Frame postural capturado desde la cámara en vivo.');
    return dataUrl;
  };

  // Transcribir el audio grabado con Gemini 3.5 Transcribe en el servidor
  const handleTranscribeRecordedAudioWithGemini = async () => {
    if (recordedChunksRef.current.length === 0) {
      setStatusBanner(
        'Graba unos segundos con el micrófono activo antes de solicitar transcripción de audio IA, o procesa directamente la transcripción actual.'
      );
      return;
    }

    setIsTranscribingAudioBlob(true);
    setStatusBanner(
      '⏳ Enviando audio del micrófono a Gemini 3.5 Transcribe...'
    );

    try {
      const audioBlob = new Blob(recordedChunksRef.current, {
        type: 'audio/webm',
      });
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = String(reader.result || '');
          const base64 = res.includes('base64,') ? res.split('base64,')[1] : res;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const response = await fetch('/api/clinical-scribe/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType: 'audio/webm',
        }),
      });

      const data = await response.json();
      if (
        response.ok &&
        typeof data.transcript === 'string' &&
        data.transcript.trim()
      ) {
        const merged = `${transcript}\n${data.transcript}`.trim();
        onTranscriptChange(merged);
        await handleProcessFullConversationWithAI(merged);
      } else {
        setStatusBanner(
          typeof data.error === 'string'
            ? `No se pudo transcribir el audio: ${data.error}`
            : 'El servicio no devolvió una transcripción. El audio no se procesó.'
        );
      }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'error de conexión desconocido';
      setStatusBanner(`No se pudo enviar el audio para transcripción: ${reason}.`);
    } finally {
      setIsTranscribingAudioBlob(false);
    }
  };

  // Procesar toda la charla con Gemini 3.8 Flash (/api/clinical-scribe/extract) + Fallback instantáneo
  const handleProcessFullConversationWithAI = async (
    customTranscript?: string
  ) => {
    if (isDemoTranscript) {
      setStatusBanner(
        'La transcripción de demostración es ficticia y no se puede procesar como una consulta. Edítala o bórrala antes de continuar.'
      );
      return;
    }
    const textToAnalyze = (customTranscript ?? transcript).trim();
    if (!textToAnalyze) {
      setStatusBanner(
        '⚠️ No hay charla registrada aún. Conecta el micrófono o usa el botón de Simulación en Vivo.'
      );
      return;
    }

    // 1. Aplicar de inmediato los datos detectados localmente para respuesta instantánea
    const immediateLocal = parseLiveTranscriptLocally(textToAnalyze);
    setAutoDetectedFields(immediateLocal);
    onApplyExtractedData(immediateLocal, textToAnalyze);

    // 2. Llamar al servidor con Gemini 3.8 Flash para enriquecer todos los campos y redactar el Informe Completo
    setIsProcessingGemini(true);
    setStatusBanner(
      '🤖 Procesando toda la charla entre Juan Antonio Villalba (MP 542) y el paciente para autocompletar datos y redactar el Informe Completo...'
    );

    const frame = captureCameraFrame();

    try {
      const response = await fetch('/api/clinical-scribe/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToAnalyze,
          cameraSnapshotBase64: frame,
        }),
      });

      const data = await response.json();
      if (response.ok && data.extracted) {
        const aiPayload: ScribeExtractedPayload = {
          datosPaciente: {
            ...immediateLocal.datosPaciente,
            ...data.extracted.datosPaciente,
            genero:
              data.extracted.datosPaciente?.genero === 'Femenino'
                ? 'Femenino'
                : data.extracted.datosPaciente?.genero === 'Masculino'
                ? 'Masculino'
                : 'No especificado',
            perfilGrupo:
              data.extracted.datosPaciente?.perfilGrupo === 'NIÑO' ||
              data.extracted.datosPaciente?.perfilGrupo === 'MUJER_ADULTA' ||
              data.extracted.datosPaciente?.perfilGrupo === 'ADULTO'
                ? data.extracted.datosPaciente.perfilGrupo
                : immediateLocal.datosPaciente.perfilGrupo,
          },
          anamnesisExtraida: {
            ...immediateLocal.anamnesisExtraida,
            ...data.extracted.anamnesisExtraida,
          },
          evaluacionExtraida: {
            ...immediateLocal.evaluacionExtraida,
            ...data.extracted.evaluacionExtraida,
          },
          protocoloExtraido: {
            ...immediateLocal.protocoloExtraido,
            ...data.extracted.protocoloExtraido,
          },
          informeCompletoCharla: {
            ...immediateLocal.informeCompletoCharla,
            ...data.extracted.informeCompletoCharla,
          },
        };

        setAutoDetectedFields(aiPayload);
        onApplyExtractedData(aiPayload, textToAnalyze);
        setStatusBanner(
          'Borrador asistido por IA generado. Verificá y corregí identidad, antecedentes, hallazgos y todo contenido clínico antes de guardar.'
        );
      } else {
        setStatusBanner(
          typeof data.error === 'string'
            ? `No se pudo completar el borrador con IA: ${data.error}. Las sugerencias locales requieren revisión.`
            : 'El servicio de IA no devolvió datos estructurados. Las sugerencias locales requieren revisión.'
        );
      }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'error de conexión desconocido';
      setStatusBanner(
        `No se pudo completar el borrador con IA: ${reason}. Las sugerencias locales requieren revisión.`
      );
    } finally {
      setIsProcessingGemini(false);
    }
  };

  // Simulador progresivo en tiempo real de una charla clínica para probar cómo se autocompletan los campos frase por frase
  const startSimulatedLiveConversation = (
    scenario: 'ADULTO' | 'MUJER' | 'NINO'
  ) => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setIsDemoTranscript(true);
    const lines = DEMO_DIALOGUE_LINES[scenario];
    let idx = 0;
    let accumulated = '';
    onTranscriptChange('');
    setStatusBanner(
      'Demostración ficticia en curso. No se vinculará a un paciente, no se enviará a IA y no debe guardarse como consulta.'
    );

    simIntervalRef.current = setInterval(() => {
      if (idx < lines.length) {
        accumulated = accumulated
          ? `${accumulated}\n${lines[idx]}`
          : lines[idx];
        onTranscriptChange(accumulated);
        setMicVolume(0);

        const parsedNow = parseLiveTranscriptLocally(accumulated);
        setAutoDetectedFields(parsedNow);
        idx++;
      } else {
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        setMicVolume(0);
        setStatusBanner(
          'Demostración ficticia finalizada. Borra o reemplaza la transcripción para iniciar una consulta real.'
        );
      }
    }, 950);
  };

  const handleAddManualUtterance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUtterance.trim()) return;
    setIsDemoTranscript(false);
    const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const secs = String(elapsedSeconds % 60).padStart(2, '0');
    const speakerLabel =
      speakerRole === 'VILLALBA'
        ? 'Juan Antonio Villalba (MP 542)'
        : 'Paciente';
    const nextTranscript = `${transcript}\n[${mins}:${secs}] ${speakerLabel}: ${manualUtterance.trim()}`.trim();
    onTranscriptChange(nextTranscript);
    setManualUtterance('');

    const parsed = parseLiveTranscriptLocally(nextTranscript);
    setAutoDetectedFields(parsed);
    onApplyExtractedData(parsed, nextTranscript);
  };

  const activeReport =
    informeCharla || autoDetectedFields?.informeCompletoCharla;

  return (
    <div className="border-b-2 border-[#003366] bg-[#F0F4F8] p-4 sm:p-6 space-y-5 no-print">
      {/* Encabezado del Copiloto de Escucha Clínica en Vivo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a5490] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#E74C3C] text-white text-[11px] font-bold tracking-wider uppercase">
              FUNCIÓN CENTRAL EN VIVO
            </span>
            <span className="text-xs font-mono font-bold text-[#1a5490]">
              PROPIETARIO: JUAN ANTONIO VILLALBA — MP 542
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#003366] mt-1">
            🎙️📹 CAPTURA DE CHARLA — BORRADOR PARA REVISIÓN
          </h2>
          <p className="text-xs text-slate-600">
            La transcripción y extracción asistida son borradores. Solo deben reflejar datos expresados; confirma cada campo. El sistema no diagnostica ni recomienda tratamientos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={startCameraAndMicLive}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-2 cursor-pointer transition-colors ${
              isCameraAndMicConnected
                ? 'bg-[#E74C3C] text-white border-[#E74C3C]'
                : 'bg-[#27AE60] hover:bg-emerald-700 text-white border-[#27AE60]'
            }`}
          >
            {isCameraAndMicConnected ? (
              <>
                <Square className="w-4 h-4" />
                <span>[DETENER CÁMARA Y MICRÓFONO]</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <Mic className="w-4 h-4" />
                <span>[CONECTAR CÁMARA + MICRÓFONO EN VIVO]</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleProcessFullConversationWithAI()}
            disabled={isProcessingGemini || isDemoTranscript}
            className="px-4 py-2.5 bg-[#1a5490] hover:bg-[#003366] text-white text-xs font-bold flex items-center gap-1.5 border-2 border-[#003366] cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isProcessingGemini
                ? 'Preparando borrador...'
                : isDemoTranscript
                ? 'Demostración ficticia (no procesable)'
                : '[EXTRAER BORRADOR PARA REVISIÓN]'}
            </span>
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="p-3 bg-white border-l-4 border-[#27AE60] text-xs font-bold text-[#003366] flex items-center justify-between gap-2 shadow-2xs">
          <span>{statusBanner}</span>
          {onJumpToFullReport && (
            <button
              type="button"
              onClick={onJumpToFullReport}
              className="px-3 py-1 bg-[#27AE60] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              📄 Ver Informe PDF Completo →
            </button>
          )}
        </div>
      )}

      {/* Grilla Principal: 1) Cámara + Micrófono (4 cols) | 2) Transcripción en Vivo (4 cols) | 3) Datos Autocompletados en Tiempo Real (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COLUMNA 1: CÁMARA Y MICRÓFONO CONECTADOS */}
        <div className="lg:col-span-4 bg-white border-2 border-[#E0E0E0] p-3.5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#003366] flex items-center gap-1.5">
                {isCameraAndMicConnected ? (
                  <Video className="w-4 h-4 text-[#27AE60]" />
                ) : (
                  <VideoOff className="w-4 h-4 text-slate-400" />
                )}
                📹 CÁMARA + 🎤 MICRÓFONO
              </span>
              <span className="text-xs font-mono font-bold text-[#E74C3C]">
                {isCameraAndMicConnected ? '● CONECTADO' : '○ EN ESPERA'} (
                {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
                {String(elapsedSeconds % 60).padStart(2, '0')})
              </span>
            </div>

            {/* Visor de Cámara con Plomada Postural */}
            <div className="relative h-44 bg-slate-950 border border-[#003366] overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  isCameraAndMicConnected ? 'block' : 'hidden'
                }`}
              />

              {!isCameraAndMicConnected && cameraSnapshotUrl && (
                <img
                  src={cameraSnapshotUrl}
                  alt="Captura postural"
                  className="w-full h-full object-cover"
                />
              )}

              {!isCameraAndMicConnected && !cameraSnapshotUrl && (
                <div className="text-center p-4 text-slate-300 space-y-1">
                  <Camera className="w-7 h-7 mx-auto text-[#3498DB]" />
                  <div className="text-xs font-bold">
                    CÁMARA Y MICRÓFONO LISTOS
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Conecta cámara y micrófono o introduce una transcripción manual.
                  </div>
                </div>
              )}

              {/* Retícula de plomada postural superpuesta */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-px h-full bg-emerald-400/40" />
                <div className="h-px w-full bg-emerald-400/40 absolute" />
              </div>
            </div>

            {/* Medidor de nivel de micrófono en tiempo real */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-[#003366]">
                <span className="flex items-center gap-1">
                  {isCameraAndMicConnected ? (
                    <Mic className="w-3.5 h-3.5 text-[#27AE60]" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  Nivel de Voz en Micrófono:
                </span>
                <span className="font-mono">{micVolume}%</span>
              </div>
              <div className="w-full h-3 bg-[#ECEFF1] border border-[#E0E0E0] overflow-hidden">
                <div
                  style={{ width: `${micVolume}%` }}
                  className="h-full bg-[#27AE60] transition-all duration-150"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#E0E0E0]">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={captureCameraFrame}
                className="flex-1 py-1.5 px-2 bg-[#F8FAFC] hover:bg-[#ECEFF1] border border-[#E0E0E0] text-[11px] font-bold text-[#003366] cursor-pointer"
              >
                📸 Capturar Postura
              </button>
              <button
                type="button"
                onClick={handleTranscribeRecordedAudioWithGemini}
                disabled={isTranscribingAudioBlob}
                className="flex-1 py-1.5 px-2 bg-[#1a5490] text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
              >
                {isTranscribingAudioBlob
                  ? 'Transcribiendo...'
                  : '🎙️ Transcribir Audio IA'}
              </button>
            </div>

            {/* Botones de prueba rápida de charla en vivo para demostrar autocompletado */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">
                Solo demostración ficticia (no se asocia ni guarda como consulta):
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => startSimulatedLiveConversation('ADULTO')}
                  className="py-1 px-1.5 bg-white border border-[#1a5490] text-[#1a5490] hover:bg-[#1a5490] hover:text-white text-[10px] font-bold cursor-pointer flex items-center justify-center gap-0.5"
                >
                  <Play className="w-2.5 h-2.5" /> Adulto (38a)
                </button>
                <button
                  type="button"
                  onClick={() => startSimulatedLiveConversation('MUJER')}
                  className="py-1 px-1.5 bg-white border border-[#1a5490] text-[#1a5490] hover:bg-[#1a5490] hover:text-white text-[10px] font-bold cursor-pointer flex items-center justify-center gap-0.5"
                >
                  <Play className="w-2.5 h-2.5" /> Mujer (41a)
                </button>
                <button
                  type="button"
                  onClick={() => startSimulatedLiveConversation('NINO')}
                  className="py-1 px-1.5 bg-white border border-[#1a5490] text-[#1a5490] hover:bg-[#1a5490] hover:text-white text-[10px] font-bold cursor-pointer flex items-center justify-center gap-0.5"
                >
                  <Play className="w-2.5 h-2.5" /> Niño (11a)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: TRANSCRIPCIÓN COMPLETA DE TODA LA CHARLA EN TIEMPO REAL */}
        <div className="lg:col-span-4 bg-white border-2 border-[#E0E0E0] p-3.5 flex flex-col justify-between space-y-2">
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#003366]">
                📝 TRANSCRIPCIÓN DE TODA LA CHARLA EN VIVO
              </span>
              <span className="text-[11px] font-mono text-[#27AE60] font-bold">
                Auto-Sync Activo
              </span>
            </div>

            <textarea
              rows={9}
              value={transcript}
              onChange={(e) => {
                const val = e.target.value;
                setIsDemoTranscript(false);
                onTranscriptChange(val);
                const local = parseLiveTranscriptLocally(val);
                setAutoDetectedFields(local);
                onApplyExtractedData(local, val);
              }}
              placeholder="Aquí aparece en vivo todo lo que hablan Juan Antonio Villalba (MP 542) y el paciente (ej. 'Me llamo Martín Morales, tengo 38 años, soy arquitecto...'). También puedes escribir o dictar aquí."
              className="w-full flex-1 border border-[#E0E0E0] bg-[#F8FAFC] p-2.5 text-xs font-mono text-[#003366] leading-relaxed focus:border-[#1a5490] focus:outline-none"
            />
          </div>

          {/* Entrada rápida para agregar frases de la charla */}
          <form onSubmit={handleAddManualUtterance} className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setSpeakerRole('PACIENTE')}
                className={`px-2 py-0.5 font-bold border ${
                  speakerRole === 'PACIENTE'
                    ? 'bg-[#1a5490] text-white border-[#1a5490]'
                    : 'bg-white text-[#003366] border-[#E0E0E0]'
                }`}
              >
                Habla Paciente
              </button>
              <button
                type="button"
                onClick={() => setSpeakerRole('VILLALBA')}
                className={`px-2 py-0.5 font-bold border ${
                  speakerRole === 'VILLALBA'
                    ? 'bg-[#003366] text-white border-[#003366]'
                    : 'bg-white text-[#003366] border-[#E0E0E0]'
                }`}
              >
                Habla Juan A. Villalba (MP 542)
              </button>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={manualUtterance}
                onChange={(e) => setManualUtterance(e.target.value)}
                placeholder="Ej: Me llamo Sofía Herrera, tengo 34 años..."
                className="flex-1 border border-[#E0E0E0] px-2.5 py-1.5 text-xs text-[#003366]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#27AE60] text-white text-xs font-bold cursor-pointer"
              >
                + Charla
              </button>
            </div>
          </form>
        </div>

        {/* COLUMNA 3: DATOS FUNDAMENTALES AUTOCOMPLETADOS EN VIVO */}
        <div className="lg:col-span-4 bg-white border-2 border-[#27AE60] p-3.5 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-1.5">
              <span className="text-xs font-bold text-[#003366] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#27AE60]" />
                ⚡ DATOS AUTOCOMPLETADOS EN VIVO
              </span>
              <span className="text-[10px] font-mono bg-emerald-50 text-[#27AE60] px-1.5 py-0.5 border border-[#27AE60] font-bold">
                TIEMPO REAL
              </span>
            </div>

            {autoDetectedFields ? (
              <div className="space-y-2 text-xs font-mono text-[#003366]">
                <div className="grid grid-cols-2 gap-1.5 bg-[#F8FAFC] p-2 border border-[#E0E0E0]">
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      NOMBRE:
                    </span>
                    <strong className="text-[#003366]">
                      ✓ {autoDetectedFields.datosPaciente.nombre}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      APELLIDO:
                    </span>
                    <strong className="text-[#003366]">
                      ✓ {autoDetectedFields.datosPaciente.apellidos || '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      EDAD:
                    </span>
                    <strong className="text-[#27AE60]">
                      ✓ {autoDetectedFields.datosPaciente.edad} años
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      GÉNERO / PERFIL:
                    </span>
                    <strong className="text-[#1a5490]">
                      ✓ {autoDetectedFields.datosPaciente.genero} (
                      {autoDetectedFields.datosPaciente.perfilGrupo})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      PROFESIÓN:
                    </span>
                    <strong>✓ {autoDetectedFields.datosPaciente.profesion}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      CIUDAD:
                    </span>
                    <strong>✓ {autoDetectedFields.datosPaciente.ciudad}</strong>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] p-2 border border-[#E0E0E0] space-y-1 text-[11px]">
                  <div>
                    <strong>Carga Diaria:</strong>{' '}
                    {autoDetectedFields.datosPaciente.horasSedentarioDia}h
                    sedentario ·{' '}
                    {autoDetectedFields.datosPaciente.horasComputadoraDia}h PC ·{' '}
                    {autoDetectedFields.datosPaciente.horasSmartphoneDia}h
                    celular
                  </div>
                  <div>
                    <strong>Diagnóstico Sugerido:</strong>{' '}
                    <span className="text-[#1a5490] font-bold">
                      {autoDetectedFields.protocoloExtraido.diagnosticoPrincipal}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 p-4 text-center">
                Inicia la charla para autocompletar Nombre, Apellido, Edad, Género y Diagnóstico automáticamente.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#E0E0E0] flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => handleProcessFullConversationWithAI()}
              className="w-full py-2 bg-[#27AE60] hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>[SINCRONIZAR TODOS LOS PASOS 1 A 5]</span>
            </button>
            {onJumpToFullReport && (
              <button
                type="button"
                onClick={onJumpToFullReport}
                className="w-full py-2 bg-[#003366] hover:bg-[#1a5490] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>[GENERAR INFORME COMPLETO PDF AHORA]</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VISTA PREVIA EN VIVO DEL INFORME COMPLETO DE LA CHARLA */}
      {activeReport && (
        <div className="bg-white border-2 border-[#1a5490] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E0E0E0] pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#27AE60]" />
              <h3 className="text-xs sm:text-sm font-bold text-[#003366]">
                📋 {activeReport.tituloInforme}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#1a5490] font-bold">
              Firmado por: Juan Antonio Villalba — MP 542
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-800">
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E0E0E0]">
              <strong className="text-[#003366] block mb-0.5">
                1. Síntesis de la Charla Clínica:
              </strong>
              {activeReport.resumenConversacion}
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E0E0E0]">
              <strong className="text-[#003366] block mb-0.5">
                2. Anamnesis y Contexto Extraído:
              </strong>
              {activeReport.anamnesisNarrativa}
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E0E0E0]">
              <strong className="text-[#003366] block mb-0.5">
                3. Correlación Eje de Cadera y Nervio Ciático:
              </strong>
              {activeReport.correlacionBiomecanicaEjeCadera}
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E0E0E0]">
              <strong className="text-[#003366] block mb-0.5">
                4. Plan Terapéutico y Protocolo Generado:
              </strong>
              {activeReport.planTerapeuticoDetallado}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
