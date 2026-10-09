import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'clinical_store.json');

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ServerStore {
  syncedAt: string;
  doctor: unknown;
  patients: unknown[];
  consultations: unknown[];
}

function loadStore(): ServerStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    syncedAt: new Date().toISOString(),
    doctor: null,
    patients: [],
    consultations: [],
  };
}

function saveStore(store: ServerStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // ignore fs errors in read-only environments
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  let memoryStore: ServerStore = loadStore();

  // API RESTful - Salud y Estado de Capas de Arquitectura
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      owner: 'Juan Antonio Villalba — MP 542',
      architectureVersion: '2.0',
      layers: {
        presentation: 'React Desktop-First + WCAG AAA + Light/Dark Mode',
        businessEngine:
          'Motor Quiropráctico Funcional (Niños, Adultos, Mujeres, Eje Cadera, DICOM)',
        multimediaMcp:
          'WebRTC Camera + Live Microphone + Gemini Live Transcription & Auto-Fill',
        dataLayer: 'Express REST API + Local/Cloud Bidirectional Sync',
        deployment: 'Offline-First + Local/Cloud Ready',
      },
      syncedAt: memoryStore.syncedAt,
      counts: {
        patients: memoryStore.patients.length,
        consultations: memoryStore.consultations.length,
      },
    });
  });

  // 1. Endpoint para transcribir fragmentos de audio grabados con micrófono usando gemini-3.5-transcribe
  app.post('/api/clinical-scribe/transcribe-audio', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body || {};
      if (!audioBase64) {
        res.status(400).json({ error: 'No se recibió audio para transcribir.' });
        return;
      }

      const ai = getGeminiClient();
      const audioPart = {
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: audioBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            {
              text: 'Transcribe íntegramente al español esta conversación clínica entre el quiropráctico Juan Antonio Villalba (MP 542) y su paciente. Identifica cuando habla el profesional y cuando habla el paciente si es posible.',
            },
          ],
        },
      });

      res.json({
        ok: true,
        transcript: response.text || '',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al transcribir audio con Gemini.';
      res.status(500).json({ error: message });
    }
  });

  // 2. Extract only statements made in the consultation; clinical decisions remain manual.
  app.post('/api/clinical-scribe/extract', async (req, res) => {
    try {
      const { transcript, cameraSnapshotBase64 } = req.body || {};
      if (!transcript || !String(transcript).trim()) {
        res
          .status(400)
          .json({ error: 'La transcripción está vacía. Hable en el micrófono o inicie la charla.' });
        return;
      }

      const ai = getGeminiClient();

      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      if (cameraSnapshotBase64 && String(cameraSnapshotBase64).includes('base64,')) {
        const cleanBase64 = String(cameraSnapshotBase64).split('base64,')[1];
        if (cleanBase64) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          });
        }
      }

      parts.push({
        text: `Extrae datos literales de esta conversación para crear un borrador que un profesional revisará.
No diagnostiques, no interpretes estudios o imágenes, no infieras etiologías, pronósticos, riesgos, contraindicaciones, tratamientos, ejercicios ni recomendaciones.
No completes información faltante por contexto, edad, género, nombre, profesión ni frases del profesional. No conviertas una sospecha en un hallazgo confirmado.
Usa únicamente hechos explícitamente dichos. Para campos de texto no mencionados devuelve una cadena vacía; para números no mencionados devuelve 0; para listas sin datos devuelve una lista vacía. En antecedentes devuelve true solo cuando el paciente/profesional afirme explícitamente que existe, false solo cuando lo niegue explícitamente; si no se menciona, omite el campo.
No estimes la fecha de nacimiento a partir de la edad. Distingue hechos referidos por el paciente de observaciones expresadas explícitamente por el profesional.
El informe debe resumir lo dicho, señalar lo que no se informó y no presentar consejo médico ni un plan de tratamiento.

TRANSCRIPCIÓN DE LA CHARLA CLÍNICA:
"""
${transcript}
"""`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              datosPaciente: {
                type: Type.OBJECT,
                properties: {
                  nombre: {
                    type: Type.STRING,
                    description: 'Nombre de pila del paciente extraído de la charla.',
                  },
                  apellidos: {
                    type: Type.STRING,
                    description: 'Apellido(s) del paciente extraído de la charla.',
                  },
                  edad: {
                    type: Type.INTEGER,
                    description: 'Edad en años del paciente.',
                  },
                  fechaNacimientoEstimada: {
                    type: Type.STRING,
                    description: 'Fecha exacta YYYY-MM-DD solo si se expresa literalmente; en otro caso cadena vacía.',
                  },
                  genero: {
                    type: Type.STRING,
                    description: 'Masculino o Femenino.',
                  },
                  perfilGrupo: {
                    type: Type.STRING,
                    description: 'Solo si la edad y el género fueron expresados; de otro modo cadena vacía.',
                  },
                  profesion: {
                    type: Type.STRING,
                    description: 'Profesión, oficio o actividad escolar del paciente.',
                  },
                  ciudad: {
                    type: Type.STRING,
                    description: 'Ciudad o localidad del paciente.',
                  },
                  telefono: {
                    type: Type.STRING,
                    description: 'Teléfono si fue mencionado en la charla.',
                  },
                  horasSedentarioDia: {
                    type: Type.INTEGER,
                    description: 'Horas explícitamente declaradas; usa 0 si no se informaron.',
                  },
                  horasComputadoraDia: {
                    type: Type.INTEGER,
                    description: 'Horas explícitamente declaradas; usa 0 si no se informaron.',
                  },
                  horasSmartphoneDia: {
                    type: Type.INTEGER,
                    description: 'Horas explícitamente declaradas; usa 0 si no se informaron.',
                  },
                },
                required: [
                  'nombre',
                  'apellidos',
                  'edad',
                  'genero',
                  'perfilGrupo',
                  'profesion',
                  'ciudad',
                  'horasSedentarioDia',
                  'horasComputadoraDia',
                  'horasSmartphoneDia',
                ],
              },
              anamnesisExtraida: {
                type: Type.OBJECT,
                properties: {
                  problemaDeHoy: {
                    type: Type.STRING,
                    description: 'Resumen literal del motivo referido; cadena vacía si no está informado.',
                  },
                  diccionarioCliente: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Frases textuales exactas que usó el paciente para describir su dolor o molestia.',
                  },
                  escoliosis: { type: Type.BOOLEAN },
                  cifosis: { type: Type.BOOLEAN },
                  lordosis: { type: Type.BOOLEAN },
                  asma: { type: Type.BOOLEAN },
                  tiroides: { type: Type.BOOLEAN },
                  otrosAntecedentes: { type: Type.STRING },
                  asimetriaPiernas: { type: Type.STRING },
                  desviacionCadera: { type: Type.BOOLEAN },
                  pesoMochilaKg: { type: Type.NUMBER },
                  posturaEscolar: { type: Type.STRING },
                  cantidadHijos: { type: Type.INTEGER },
                  nivelSobrecarga1a10: { type: Type.INTEGER },
                },
                required: [
                  'problemaDeHoy',
                  'diccionarioCliente',
                ],
              },
              evaluacionExtraida: {
                type: Type.OBJECT,
                properties: {
                  notasTiempoReal: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Lista de hallazgos posturales, físicos y palpatorios observados o mencionados.',
                  },
                  ejeCaderaCentroGravedad: {
                    type: Type.STRING,
                    description: 'Solo observación que el profesional haya expresado literalmente; sin inferencias.',
                  },
                  relatoNervioCiatico: {
                    type: Type.STRING,
                    description: 'Solo contenido expresado literalmente en la charla; sin inferencias.',
                  },
                  actitudPsicologica: {
                    type: Type.STRING,
                    description: 'Colaborador, Ansioso o Defensivo.',
                  },
                  medicacionPsicotropa: {
                    type: Type.STRING,
                    description: 'Medicación mencionada por el paciente.',
                  },
                  flexionAnteriorGrados: {
                    type: Type.STRING,
                    description: 'Grados de flexión anterior (ej. 30° o 45°).',
                  },
                  fuerzaGluteos: {
                    type: Type.STRING,
                    description: 'Escala de fuerza glútea (ej. 4/5).',
                  },
                },
                required: [
                  'notasTiempoReal',
                  'ejeCaderaCentroGravedad',
                  'relatoNervioCiatico',
                ],
              },
              protocoloExtraido: {
                type: Type.OBJECT,
                properties: {
                  diagnosticoPrincipal: { type: Type.STRING, description: 'Solo transcribir si el profesional lo nombra como diagnóstico; si no, cadena vacía.' },
                  diagnosticoSecundario: { type: Type.STRING, description: 'Solo transcribir si se declara explícitamente; si no, cadena vacía.' },
                  etiologia: { type: Type.STRING, description: 'Solo transcribir si se declara explícitamente; no inferir causas.' },
                  fase1Ajustes: { type: Type.STRING, description: 'Solo transcribir si se indica explícitamente; no recomendar.' },
                  fase1Complementos: { type: Type.STRING, description: 'Solo transcribir si se indica explícitamente; no recomendar.' },
                  fase1Restriccion: { type: Type.STRING, description: 'Solo transcribir si se indica explícitamente; no recomendar.' },
                  fase2Ajustes: { type: Type.STRING, description: 'Solo transcribir si se indica explícitamente; no recomendar.' },
                  fase2Ejercicios: { type: Type.STRING, description: 'Solo transcribir si se indica explícitamente; no recomendar.' },
                  fase2Ergonomia: { type: Type.STRING, description: 'Solo transcribir si se indica explícitamente; no recomendar.' },
                  fase3Ajustes: { type: Type.STRING, description: 'Solo transcribir si se indica explícitamente; no recomendar.' },
                  fase3EjerciciosCasa: { type: Type.STRING, description: 'Solo transcribir si se indica explícitamente; no recomendar.' },
                  fase3Educacion: { type: Type.STRING, description: 'Solo transcribir si se indica explícitamente; no recomendar.' },
                  objetivosCortoPlazo: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  objetivosLargoPlazo: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'diagnosticoPrincipal',
                  'diagnosticoSecundario',
                  'etiologia',
                ],
              },
              informeCompletoCharla: {
                type: Type.OBJECT,
                properties: {
                  tituloInforme: { type: Type.STRING },
                  resumenConversacion: {
                    type: Type.STRING,
                    description: 'Resumen detallado de toda la conversación entre Juan Antonio Villalba (MP 542) y el paciente.',
                  },
                  anamnesisNarrativa: {
                    type: Type.STRING,
                    description: 'Desarrollo completo de los antecedentes, estilo de vida y problema actual.',
                  },
                  correlacionBiomecanicaEjeCadera: {
                    type: Type.STRING,
                    description: 'Resumen de correlaciones dichas explícitamente; en otro caso cadena vacía.',
                  },
                  planTerapeuticoDetallado: {
                    type: Type.STRING,
                    description: 'Solo transcripción literal de un plan expresamente indicado; nunca propongas un plan.',
                  },
                },
                required: [
                  'tituloInforme',
                  'resumenConversacion',
                  'anamnesisNarrativa',
                  'correlacionBiomecanicaEjeCadera',
                  'planTerapeuticoDetallado',
                ],
              },
            },
            required: [
              'datosPaciente',
              'anamnesisExtraida',
              'evaluacionExtraida',
              'protocoloExtraido',
              'informeCompletoCharla',
            ],
          },
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);
      res.json({
        ok: true,
        extracted: parsed,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al procesar la charla clínica con Gemini.';
      res.status(500).json({ error: message });
    }
  });

  // Obtener estado sincronizado
  app.get('/api/state', (_req, res) => {
    res.json(memoryStore);
  });

  // Sincronización bidireccional Local <-> Servidor
  app.post('/api/sync', (req, res) => {
    const { doctor, patients, consultations } = req.body || {};
    memoryStore = {
      syncedAt: new Date().toISOString(),
      doctor: doctor ?? memoryStore.doctor,
      patients: Array.isArray(patients) ? patients : memoryStore.patients,
      consultations: Array.isArray(consultations)
        ? consultations
        : memoryStore.consultations,
    };
    saveStore(memoryStore);
    res.json({
      ok: true,
      syncedAt: memoryStore.syncedAt,
      totalPatients: memoryStore.patients.length,
      totalConsultations: memoryStore.consultations.length,
    });
  });

  // Respaldo completo descargable desde API
  app.get('/api/backup', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="respaldo-quiropractico-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`
    );
    res.send(JSON.stringify(memoryStore, null, 2));
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[ATLAS Sistema Quiropráctico — Juan Antonio Villalba MP 542] Server listening on http://0.0.0.0:${PORT}`
    );
  });
}

startServer();
