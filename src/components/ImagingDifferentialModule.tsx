import React, { useState } from 'react';
import {
  Columns,
  Crosshair,
  Eye,
  FileCheck2,
  Plus,
  Sliders,
  Upload,
} from 'lucide-react';
import {
  ClinicalRiskEvaluation,
  RolePermissionMatrix,
} from '../engine/clinicalEvaluationEngine';
import {
  CertaintyLevel,
  ClinicalCaseRecord,
  DifferentialHypothesis,
  ImagingModality,
  ImagingPinFinding,
} from '../types/clinical';

interface ImagingDifferentialModuleProps {
  activeCase: ClinicalCaseRecord;
  riskEvaluation: ClinicalRiskEvaluation;
  permissions: RolePermissionMatrix;
  onUpdateCase: (updated: ClinicalCaseRecord, auditDetail: string) => void;
}

export const ImagingDifferentialModule: React.FC<ImagingDifferentialModuleProps> = ({
  activeCase,
  riskEvaluation,
  permissions,
  onUpdateCase,
}) => {
  const [selectedStudyIdx, setSelectedStudyIdx] = useState(0);
  const [contrast, setContrast] = useState(108);
  const [brightness, setBrightness] = useState(102);
  const [invertFilter, setInvertFilter] = useState(false);
  const [showPlumbGrid, setShowPlumbGrid] = useState(true);
  const [sideBySideMode, setSideBySideMode] = useState(false);
  const [pinPlacementMode, setPinPlacementMode] = useState(false);
  const [imgLoadError, setImgLoadError] = useState<Record<string, boolean>>({});

  // Pending pin coordinates when clicking canvas
  const [pendingCoord, setPendingCoord] = useState<{ x: number; y: number } | null>(
    null
  );
  const [newPinSegment, setNewPinSegment] = useState('C1 (Atlas)');
  const [newPinDesc, setNewPinDesc] = useState('');
  const [newPinCorr, setNewPinCorr] =
    useState<ImagingPinFinding['correlacionClinica']>('alta_concordancia');

  // New Differential Hypothesis form
  const [newHypPathology, setNewHypPathology] = useState('');
  const [newHypCode, setNewHypCode] = useState('M99.0');
  const [newHypCertainty, setNewHypCertainty] =
    useState<CertaintyLevel>('probable');
  const [newHypAnamnesis, setNewHypAnamnesis] = useState('');
  const [newHypStructural, setNewHypStructural] = useState('');
  const [newHypImaging, setNewHypImaging] = useState('');
  const [newHypAction, setNewHypAction] = useState('');

  const studies = activeCase.estudiosImagen;
  const currentStudy = studies[selectedStudyIdx] || studies[0];

  const canCalibrate = permissions.puedeCalibrarImagenes;
  const canSign = permissions.puedeFirmarDiagnostico;

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinPlacementMode || !canCalibrate || !currentStudy) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPendingCoord({ x, y });
  };

  const handleConfirmNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCoord || !currentStudy || !newPinDesc.trim()) return;

    const nuevoPin: ImagingPinFinding = {
      id: `pin-${Date.now()}`,
      segmento: newPinSegment.trim(),
      descripcion: newPinDesc.trim(),
      correlacionClinica: newPinCorr,
      xPercent: pendingCoord.x,
      yPercent: pendingCoord.y,
    };

    const nextStudies = studies.map((st, idx) =>
      idx === selectedStudyIdx
        ? { ...st, marcadores: [...st.marcadores, nuevoPin] }
        : st
    );

    onUpdateCase(
      {
        ...activeCase,
        estudiosImagen: nextStudies,
      },
      `Marcador radiológico agregado en ${nuevoPin.segmento} (${nuevoPin.correlacionClinica})`
    );

    setPendingCoord(null);
    setPinPlacementMode(false);
    setNewPinDesc('');
  };

  const handleUploadLocalStudy = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canCalibrate) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;

      const nuevoEstudio = {
        id: `img-upload-${Date.now()}`,
        titulo: `Estudio Cargado: ${file.name.replace(/\.[^/.]+$/, '')}`,
        modalidad: 'RX_LATERAL' as ImagingModality,
        fechaEstudio: new Date().toISOString().slice(0, 10),
        imageUrl: dataUrl,
        proyeccion: 'Proyección Clínica Digitalizada',
        calidadTecnica: 'optima' as const,
        mediciones: [
          {
            id: `cal-${Date.now()}`,
            etiqueta: 'Alineación Axial de Control',
            valorMedido: '18.5°',
            rangoReferencia: '20° a 35°',
            interpretacion: 'normal' as const,
            x1: 48,
            y1: 22,
            x2: 50,
            y2: 75,
          },
        ],
        marcadores: [],
        conclusionRadiologicaFuncional:
          'Estudio incorporado en consulta para correlación evolutiva y medición biomecánica.',
      };

      const nextStudies = [...studies, nuevoEstudio];
      onUpdateCase(
        {
          ...activeCase,
          estudiosImagen: nextStudies,
        },
        `Carga de nuevo estudio de imagen: ${nuevoEstudio.titulo}`
      );
      setSelectedStudyIdx(nextStudies.length - 1);
    };
    reader.readAsDataURL(file);
  };

  const handleCertaintyChange = (hypId: string, nuevaCerteza: CertaintyLevel) => {
    if (!canSign) return;
    const nextList = activeCase.diagnosticoDiferencial.map((d) =>
      d.id === hypId ? { ...d, certeza: nuevaCerteza } : d
    );
    onUpdateCase(
      {
        ...activeCase,
        diagnosticoDiferencial: nextList,
      },
      `Actualización de nivel de certeza diagnóstica a: ${nuevaCerteza.toUpperCase()}`
    );
  };

  const handleAddHypothesis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSign || !newHypPathology.trim()) return;

    const nueva: DifferentialHypothesis = {
      id: `dd-${Date.now()}`,
      patologia: newHypPathology.trim(),
      codigoCIE10: newHypCode.trim() || 'M99.0',
      certeza: newHypCertainty,
      evidenciaAnamnesis:
        newHypAnamnesis.trim() || 'Correlación con sintomatología referida.',
      evidenciaEstructural:
        newHypStructural.trim() || 'Hallazgo en palpación estática/dinámica.',
      evidenciaImagen:
        newHypImaging.trim() || 'Correlación con proyección radiográfica actual.',
      conductaQuiropractica:
        newHypAction.trim() || 'Abordaje específico de baja fuerza y control evolutivo.',
    };

    onUpdateCase(
      {
        ...activeCase,
        diagnosticoDiferencial: [...activeCase.diagnosticoDiferencial, nueva],
      },
      `Incorporación de hipótesis en diagnóstico diferencial: ${nueva.patologia} (${nueva.certeza})`
    );

    setNewHypPathology('');
    setNewHypAnamnesis('');
    setNewHypStructural('');
    setNewHypImaging('');
    setNewHypAction('');
  };

  const handleSignDiagnosis = () => {
    if (!canSign) return;
    onUpdateCase(
      {
        ...activeCase,
        firmadoPorClinico:
          'Dr. Federico Saracho — M.P. Quiropraxia Funcional (Validado)',
      },
      'Firma clínica de correlación imagenológica y diagnóstico diferencial'
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de Correlación Paciente - Imagen */}
      <div className="border border-slate-200 bg-white p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Fase 3: Análisis Visual RX / RMN / DICOM</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Coherencia Clínica-Imagen: {riskEvaluation.indiceConcordanciaImagenClinica}%
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {activeCase.firmadoPorClinico
                ? `Firmado: ${activeCase.firmadoPorClinico}`
                : 'Pendiente de Firma Clínica'}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mt-1">
            Correlación Morfológica, Biomecánica y Diagnóstico Diferencial Estructurado
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 max-w-3xl">
            {riskEvaluation.resumenConcordancia}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {canCalibrate && (
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 cursor-pointer transition-colors whitespace-nowrap">
              <Upload className="w-3.5 h-3.5" />
              <span>Cargar RX / RMN / DICOM</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadLocalStudy}
                className="hidden"
              />
            </label>
          )}

          {canSign && (
            <button
              type="button"
              onClick={handleSignDiagnosis}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Validar y Firmar Correlación</span>
            </button>
          )}
        </div>
      </div>

      {/* Visor Radiológico Digital y Panel de Mediciones */}
      {currentStudy && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Visor Dark Lightbox (7 cols) */}
          <div className="lg:col-span-7 border border-slate-800 bg-slate-950 text-slate-100 p-5 flex flex-col justify-between">
            {/* Barra de herramientas del Negatoscopio Digital */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                {studies.map((st, idx) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStudyIdx(idx)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      selectedStudyIdx === idx
                        ? 'bg-white text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.modalidad.replace('_', ' ')} ({st.fechaEstudio})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlumbGrid(!showPlumbGrid)}
                  className={`px-2.5 py-1.5 text-xs border transition-colors whitespace-nowrap ${
                    showPlumbGrid
                      ? 'border-sky-400 text-sky-300 bg-sky-950/40'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Plomada y Ángulos
                </button>

                <button
                  type="button"
                  onClick={() => setInvertFilter(!invertFilter)}
                  className={`px-2.5 py-1.5 text-xs border transition-colors whitespace-nowrap ${
                    invertFilter
                      ? 'border-amber-400 text-amber-300 bg-amber-950/40'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Invertir (Negativo)
                </button>

                <button
                  type="button"
                  onClick={() => setSideBySideMode(!sideBySideMode)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border transition-colors whitespace-nowrap ${
                    sideBySideMode
                      ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Comparar Evolución</span>
                </button>

                {canCalibrate && (
                  <button
                    type="button"
                    onClick={() => {
                      setPinPlacementMode(!pinPlacementMode);
                      setPendingCoord(null);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border transition-colors whitespace-nowrap ${
                      pinPlacementMode
                        ? 'border-red-400 text-red-200 bg-red-950/60'
                        : 'border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>{pinPlacementMode ? 'Clic en Imagen...' : '+ Marcar Hallazgo'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Lienzo de Imagen (Simple o Comparación Lado a Lado) */}
            <div
              className={`grid gap-4 ${
                sideBySideMode ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {/* Estudio Primario */}
              <div
                onClick={handleCanvasClick}
                className={`relative overflow-hidden border border-slate-800 bg-black select-none mx-auto w-full max-w-md aspect-[3/4] ${
                  pinPlacementMode ? 'cursor-crosshair' : 'cursor-default'
                }`}
              >
                {!imgLoadError[currentStudy.id] ? (
                  <img
                    src={currentStudy.imageUrl}
                    alt={currentStudy.titulo}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setImgLoadError((prev) => ({ ...prev, [currentStudy.id]: true }))
                    }
                    style={{
                      filter: `contrast(${contrast}%) brightness(${brightness}%) ${
                        invertFilter ? 'invert(1)' : ''
                      }`,
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-400">
                    <Eye className="w-8 h-8 mb-2 text-slate-500" />
                    <span className="text-xs font-medium text-slate-200">
                      {currentStudy.titulo}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Esquema Radiológico Vectorial Activo
                    </span>
                  </div>
                )}

                {/* Retícula de Plomada y Vectores de Ángulo Cobb / Lordosis */}
                {showPlumbGrid && (
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    {/* Línea de plomada vertical central */}
                    <line
                      x1="50"
                      y1="0"
                      x2="50"
                      y2="100"
                      stroke="rgba(56, 189, 248, 0.45)"
                      strokeWidth="0.35"
                      strokeDasharray="1.5 1.5"
                    />
                    {/* Líneas horizontales de nivelación (Atlas / Acromial / Pelvis) */}
                    <line
                      x1="15"
                      y1="20"
                      x2="85"
                      y2="20"
                      stroke="rgba(148, 163, 184, 0.25)"
                      strokeWidth="0.25"
                    />
                    <line
                      x1="15"
                      y1="78"
                      x2="85"
                      y2="78"
                      stroke="rgba(148, 163, 184, 0.25)"
                      strokeWidth="0.25"
                    />

                    {/* Vectores de mediciones del estudio */}
                    {currentStudy.mediciones.map((m) => (
                      <g key={m.id}>
                        <line
                          x1={m.x1}
                          y1={m.y1}
                          x2={m.x2}
                          y2={m.y2}
                          stroke="#38BDF8"
                          strokeWidth="0.8"
                        />
                        <circle cx={m.x1} cy={m.y1} r="1.2" fill="#38BDF8" />
                        <circle cx={m.x2} cy={m.y2} r="1.2" fill="#38BDF8" />
                      </g>
                    ))}
                  </svg>
                )}

                {/* Marcadores Anatómicos Interactivos */}
                {currentStudy.marcadores.map((pin, idx) => (
                  <div
                    key={pin.id}
                    style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 shadow-md ${
                        pin.correlacionClinica === 'alta_concordancia'
                          ? 'bg-red-600 text-white border-white'
                          : pin.correlacionClinica === 'compensacion_biomecanica'
                          ? 'bg-amber-500 text-slate-950 border-white'
                          : 'bg-slate-700 text-slate-200 border-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="hidden group-hover:block absolute left-7 top-0 z-20 w-56 p-2.5 bg-slate-950/95 border border-slate-700 text-xs text-slate-100 pointer-events-none">
                      <div className="font-semibold text-white">{pin.segmento}</div>
                      <div className="text-slate-300 mt-0.5">{pin.descripcion}</div>
                    </div>
                  </div>
                ))}

                {/* Marcador pendiente de confirmación */}
                {pendingCoord && (
                  <div
                    style={{ left: `${pendingCoord.x}%`, top: `${pendingCoord.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-sky-400 bg-sky-400/40 animate-pulse"
                  />
                )}

                {/* Leyenda técnica superpuesta */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">
                      {currentStudy.proyeccion}
                    </span>
                    <span className="block text-slate-300 font-mono tabular-nums">
                      Fecha: {currentStudy.fechaEstudio} · Calidad: {currentStudy.calidadTecnica.toUpperCase()}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-sky-300">
                    C:{contrast}% · B:{brightness}%
                  </span>
                </div>
              </div>

              {/* Vista Comparativa Evolutiva (Lado a Lado) */}
              {sideBySideMode && (
                <div className="relative overflow-hidden border border-slate-800 bg-slate-900 mx-auto w-full max-w-md aspect-[3/4] flex flex-col justify-between p-4">
                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono text-emerald-400">
                      PROYECCIÓN DE CONTROL / SIMULACIÓN BIOMECÁNICA DE CORRECCIÓN
                    </span>
                    <h4 className="text-sm font-semibold text-white mt-0.5">
                      Comparativa de Evolución Post-Protocolo Fase I-II
                    </h4>
                  </div>

                  <div className="my-auto space-y-3 text-xs text-slate-300">
                    <div className="p-3 border border-slate-800 bg-slate-950/80">
                      <div className="text-slate-400">Parámetro Inicial (Ingreso)</div>
                      <div className="font-mono tabular-nums text-sm font-semibold text-white mt-0.5">
                        {currentStudy.mediciones[0]?.etiqueta || 'Alineación Axial'}:{' '}
                        {currentStudy.mediciones[0]?.valorMedido || 'Alterado'}
                      </div>
                      <div className="text-slate-400 mt-1">
                        EVA Inicial: {activeCase.seguimientos[0]?.evaPreSesion ?? activeCase.anamnesis.evaActual}/10
                      </div>
                    </div>

                    <div className="p-3 border border-emerald-800/80 bg-emerald-950/30">
                      <div className="text-emerald-300">
                        Estado Actual Tras {activeCase.seguimientos.length} Sesiones
                      </div>
                      <div className="font-mono tabular-nums text-sm font-semibold text-white mt-0.5">
                        Reducción sintomática y nivelación pélvica/cervical funcional
                      </div>
                      <div className="text-emerald-200 mt-1 font-mono tabular-nums">
                        EVA Última Sesión:{' '}
                        {activeCase.seguimientos[activeCase.seguimientos.length - 1]
                          ?.evaPostSesion ?? activeCase.anamnesis.evaActual}
                        /10 · Concordancia {riskEvaluation.indiceConcordanciaImagenClinica}%
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 border-t border-slate-800 pt-2">
                    Criterio radiológico: No repetir exposición RX antes de finalizar Fase II/III salvo bandera roja clínica.
                  </div>
                </div>
              )}
            </div>

            {/* Formulario emergente si el clínico hizo clic en la imagen para agregar pin */}
            {pendingCoord && canCalibrate && (
              <form
                onSubmit={handleConfirmNewPin}
                className="mt-4 p-4 border border-sky-700 bg-slate-900 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-300">
                    Nuevo Hallazgo en Coordenada (X: {pendingCoord.x}%, Y: {pendingCoord.y}%)
                  </span>
                  <button
                    type="button"
                    onClick={() => setPendingCoord(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Segmento (ej. C1 Atlas, L4-L5)"
                    value={newPinSegment}
                    onChange={(e) => setNewPinSegment(e.target.value)}
                    className="border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                  <select
                    value={newPinCorr}
                    onChange={(e) =>
                      setNewPinCorr(
                        e.target.value as ImagingPinFinding['correlacionClinica']
                      )
                    }
                    className="border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="alta_concordancia">
                      Alta Concordancia Clínica (Generador Primario)
                    </option>
                    <option value="compensacion_biomecanica">
                      Compensación Biomecánica Secundaria
                    </option>
                    <option value="hallazgo_incidental">
                      Hallazgo Incidental Asintomático
                    </option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Descripción radiológica/funcional del hallazgo..."
                  value={newPinDesc}
                  onChange={(e) => setNewPinDesc(e.target.value)}
                  className="w-full border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-500 text-slate-950 font-semibold text-xs hover:bg-sky-400"
                >
                  Confirmar Marcador en Estudio
                </button>
              </form>
            )}

            {/* Controles de Brillo y Contraste */}
            <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400 w-20">Contraste</span>
                <input
                  type="range"
                  min={80}
                  max={160}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="flex-1 accent-sky-400"
                />
                <span className="font-mono tabular-nums text-slate-300 w-10 text-right">
                  {contrast}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 w-20">Brillo RX</span>
                <input
                  type="range"
                  min={70}
                  max={135}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="flex-1 accent-sky-400"
                />
                <span className="font-mono tabular-nums text-slate-300 w-10 text-right">
                  {brightness}%
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Mediciones de Ángulos y Correlación Imagen-Clínica (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-slate-200 bg-white p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-semibold text-slate-900">
                  Biometría Radiológica y Ángulos Estructurales
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Valores angulares y lineales medidos sobre {currentStudy.titulo}.
                </p>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200">
                {currentStudy.mediciones.map((cal) => (
                  <div key={cal.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {cal.etiqueta}
                      </div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                        Referencia normal: {cal.rangoReferencia}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono tabular-nums text-base font-bold text-slate-900">
                        {cal.valorMedido}
                      </span>
                      <span className="block text-xs text-slate-600">
                        {cal.interpretacion.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-2">
                  Marcadores Anatómicos y Correlación con Examen Físico
                </h4>
                <div className="space-y-2.5">
                  {currentStudy.marcadores.map((pin, idx) => (
                    <div
                      key={pin.id}
                      className="p-3 border border-slate-200 bg-slate-50/70 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          #{idx + 1} · {pin.segmento}
                        </span>
                        <span
                          className={`font-medium ${
                            pin.correlacionClinica === 'alta_concordancia'
                              ? 'text-red-800'
                              : pin.correlacionClinica === 'compensacion_biomecanica'
                              ? 'text-amber-800'
                              : 'text-slate-600'
                          }`}
                        >
                          {pin.correlacionClinica === 'alta_concordancia'
                            ? 'Concordancia Clínica Directa'
                            : pin.correlacionClinica === 'compensacion_biomecanica'
                            ? 'Compensación Biomecánica'
                            : 'Hallazgo Incidental (No sintomático)'}
                        </span>
                      </div>
                      <p className="text-slate-700">{pin.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-100 border border-slate-200 text-xs text-slate-800">
                <strong className="font-semibold block text-slate-900 mb-1">
                  Conclusión Radiológica Funcional:
                </strong>
                {currentStudy.conclusionRadiologicaFuncional}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matriz de Diagnóstico Diferencial y Niveles de Certeza */}
      <div className="border border-slate-200 bg-white p-6 space-y-5">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Matriz de Diagnóstico Diferencial Quiropráctico y Niveles de Certeza
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clasificación clínica no invasiva que cruza anamnesis, palpación estructural y hallazgos de imagen (Confirmado · Probable · Descartado · No visible).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-3 font-medium">Hipótesis / Entidad Clínica</th>
                <th className="py-2.5 px-3 font-medium">Nivel de Certeza</th>
                <th className="py-2.5 px-3 font-medium">Evidencia Anamnesis y Examen</th>
                <th className="py-2.5 px-3 font-medium">Correlación en Imagen</th>
                <th className="py-2.5 pl-3 font-medium">Conducta Terapéutica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {activeCase.diagnosticoDiferencial.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 align-top">
                  <td className="py-3.5 pr-3">
                    <span className="font-semibold text-slate-900 block">
                      {item.patologia}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">
                      CIE-10: {item.codigoCIE10}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <select
                      disabled={!canSign}
                      value={item.certeza}
                      onChange={(e) =>
                        handleCertaintyChange(
                          item.id,
                          e.target.value as CertaintyLevel
                        )
                      }
                      className={`border px-2.5 py-1.5 text-xs font-semibold bg-white ${
                        item.certeza === 'confirmado'
                          ? 'border-emerald-600 text-emerald-900'
                          : item.certeza === 'probable'
                          ? 'border-amber-600 text-amber-900'
                          : item.certeza === 'descartado'
                          ? 'border-slate-300 text-slate-500 line-through'
                          : 'border-slate-400 text-slate-700'
                      }`}
                    >
                      <option value="confirmado">CONFIRMADO</option>
                      <option value="probable">PROBABLE</option>
                      <option value="descartado">DESCARTADO</option>
                      <option value="no_visible">NO VISIBLE EN IMAGEN</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 space-y-1">
                    <div>
                      <strong className="text-slate-900">Clínica:</strong>{' '}
                      {item.evidenciaAnamnesis}
                    </div>
                    <div>
                      <strong className="text-slate-900">Examen:</strong>{' '}
                      {item.evidenciaEstructural}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700">{item.evidenciaImagen}</td>
                  <td className="py-3.5 pl-3 font-medium text-slate-900">
                    {item.conductaQuiropractica}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Formulario para agregar nueva hipótesis diferencial */}
        {canSign && (
          <form
            onSubmit={handleAddHypothesis}
            className="pt-4 border-t border-slate-200 space-y-3"
          >
            <div className="text-xs font-semibold text-slate-900">
              Agregar Hipótesis al Diagnóstico Diferencial
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Entidad o síndrome biomecánico..."
                value={newHypPathology}
                onChange={(e) => setNewHypPathology(e.target.value)}
                className="sm:col-span-2 border border-slate-300 px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Código CIE-10 (ej. M99.01)"
                value={newHypCode}
                onChange={(e) => setNewHypCode(e.target.value)}
                className="border border-slate-300 px-3 py-2 text-xs font-mono"
              />
              <select
                value={newHypCertainty}
                onChange={(e) =>
                  setNewHypCertainty(e.target.value as CertaintyLevel)
                }
                className="border border-slate-300 px-3 py-2 text-xs bg-white font-medium"
              >
                <option value="confirmado">Certeza: Confirmado</option>
                <option value="probable">Certeza: Probable</option>
                <option value="descartado">Certeza: Descartado</option>
                <option value="no_visible">Certeza: No visible en imagen</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Evidencia en anamnesis..."
                value={newHypAnamnesis}
                onChange={(e) => setNewHypAnamnesis(e.target.value)}
                className="border border-slate-300 px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Evidencia en examen estructural..."
                value={newHypStructural}
                onChange={(e) => setNewHypStructural(e.target.value)}
                className="border border-slate-300 px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Correlación en imagen..."
                value={newHypImaging}
                onChange={(e) => setNewHypImaging(e.target.value)}
                className="border border-slate-300 px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Conducta quiropráctica..."
                value={newHypAction}
                onChange={(e) => setNewHypAction(e.target.value)}
                className="border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Incorporar al Cuadro Diferencial
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
