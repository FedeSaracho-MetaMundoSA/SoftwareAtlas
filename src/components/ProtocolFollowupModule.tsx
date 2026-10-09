import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  RefreshCw,
} from 'lucide-react';
import {
  ClinicalRiskEvaluation,
  generateRecommendedProtocolPhases,
  RolePermissionMatrix,
} from '../engine/clinicalEvaluationEngine';
import {
  ClinicalCaseRecord,
  FollowUpSession,
  ProtocolPhaseItem,
} from '../types/clinical';

interface ProtocolFollowupModuleProps {
  activeCase: ClinicalCaseRecord;
  riskEvaluation: ClinicalRiskEvaluation;
  permissions: RolePermissionMatrix;
  piiMasked: boolean;
  onUpdateCase: (updated: ClinicalCaseRecord, auditDetail: string) => void;
}

export const ProtocolFollowupModule: React.FC<ProtocolFollowupModuleProps> = ({
  activeCase,
  riskEvaluation,
  permissions,
  piiMasked,
  onUpdateCase,
}) => {
  const [viewMode, setViewMode] = useState<'protocolo' | 'seguimiento' | 'informe'>(
    'protocolo'
  );

  // Estado para agregar pauta ergonómica
  const [newErgonomicRule, setNewErgonomicRule] = useState('');

  // Estado para registrar nueva sesión SOAP de seguimiento
  const [evaPre, setEvaPre] = useState(activeCase.anamnesis.evaActual);
  const [evaPost, setEvaPost] = useState(
    Math.max(0, activeCase.anamnesis.evaActual - 2)
  );
  const [segmentosAjustadosInput, setSegmentosAjustadosInput] = useState(
    activeCase.examenEstructural.segmentosVertebrales
      .filter((s) => s.movilidad === 'hipomovil_fijacion')
      .map((s) => s.segmento)
      .join(', ') || 'C1 (Atlas), Pelvis'
  );
  const [tecnicaInput, setTecnicaInput] = useState(
    riskEvaluation.requiereBajaFuerzaObligatoria
      ? 'Técnica Instrumental de Baja Fuerza / Flexión-Distracción Cox'
      : 'Ajuste específico de Atlas C1 + Drop Pélvico Thompson'
  );
  const [respuestaInput, setRespuestaInput] =
    useState<FollowUpSession['respuestaInmediata']>('favorable_liberacion');
  const [soapSubjetivo, setSoapSubjetivo] = useState('');
  const [soapObjetivo, setSoapObjetivo] = useState('');
  const [soapAnalisis, setSoapAnalisis] = useState('');
  const [soapPlan, setSoapPlan] = useState('');

  const canModifyProtocol = permissions.puedeModificarProtocolo;
  const canLogSession = permissions.puedeRegistrarExamenFisico;

  const handleRegenerateProtocol = () => {
    if (!canModifyProtocol) return;
    const nuevasFases = generateRecommendedProtocolPhases(
      activeCase,
      riskEvaluation
    );
    const precaucionesAuto: string[] = [];
    if (riskEvaluation.requiereDerivacionUrgente) {
      precaucionesAuto.push(
        'ALERTA DE BANDERA ROJA: Suspender ajuste mecánico y derivar a especialista urgente.'
      );
    }
    if (riskEvaluation.requiereBajaFuerzaObligatoria) {
      precaucionesAuto.push(
        'Protocolo restringido a técnicas instrumentales de baja fuerza y movilización sin impulso rotacional HVLA.'
      );
    }
    precaucionesAuto.push(
      ...riskEvaluation.alertasFarmacologicas,
      ...riskEvaluation.alertasGrupoPoblacional
    );

    onUpdateCase(
      {
        ...activeCase,
        protocolo: {
          ...activeCase.protocolo,
          precaucionesEspecificas:
            precaucionesAuto.length > 0
              ? precaucionesAuto
              : activeCase.protocolo.precaucionesEspecificas,
          fases: nuevasFases,
        },
      },
      `Recálculo de protocolo terapéutico personalizado para grupo ${activeCase.paciente.grupoClinico.toUpperCase()}`
    );
  };

  const handlePhaseStatusChange = (
    faseNumero: ProtocolPhaseItem['faseNumero'],
    nuevoEstado: ProtocolPhaseItem['estadoFase']
  ) => {
    if (!canModifyProtocol) return;
    const nextFases = activeCase.protocolo.fases.map((f) =>
      f.faseNumero === faseNumero ? { ...f, estadoFase: nuevoEstado } : f
    );
    onUpdateCase(
      {
        ...activeCase,
        protocolo: {
          ...activeCase.protocolo,
          fases: nextFases,
        },
      },
      `Cambio de estado de Fase ${faseNumero} del protocolo a ${nuevoEstado}`
    );
  };

  const handleAddErgonomicRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModifyProtocol || !newErgonomicRule.trim()) return;
    onUpdateCase(
      {
        ...activeCase,
        protocolo: {
          ...activeCase.protocolo,
          pautasErgonomicas: [
            ...activeCase.protocolo.pautasErgonomicas,
            newErgonomicRule.trim(),
          ],
        },
      },
      'Incorporación de recomendación ergonómica personalizada'
    );
    setNewErgonomicRule('');
  };

  const handleAddFollowUpSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canLogSession || !soapSubjetivo.trim()) return;

    const nextNum = activeCase.seguimientos.length + 1;
    const nuevaSesion: FollowUpSession = {
      id: `seg-${Date.now()}`,
      numeroSesion: nextNum,
      fecha: new Date().toISOString().slice(0, 10),
      profesional: 'Dr. Federico Saracho',
      evaPreSesion: evaPre,
      evaPostSesion: evaPost,
      segmentosAjustados: segmentosAjustadosInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      tecnicaUtilizada: tecnicaInput.trim(),
      respuestaInmediata: respuestaInput,
      notasSOAP: {
        subjetivo: soapSubjetivo.trim(),
        objetivo:
          soapObjetivo.trim() ||
          'Restauración de juego articular segmentario y nivelación de miembros inferiores post-ajuste.',
        analisis:
          soapAnalisis.trim() ||
          'Evolución biomecánica favorable acorde a la fase actual del protocolo.',
        plan:
          soapPlan.trim() ||
          'Continuar plan de cuidado y ejercicios domiciliarios indicados.',
      },
    };

    onUpdateCase(
      {
        ...activeCase,
        anamnesis: {
          ...activeCase.anamnesis,
          evaActual: evaPost,
        },
        seguimientos: [...activeCase.seguimientos, nuevaSesion],
      },
      `Registro de Sesión de Seguimiento #${nextNum} (EVA ${evaPre}/10 -> ${evaPost}/10)`
    );

    setSoapSubjetivo('');
    setSoapObjetivo('');
    setSoapAnalisis('');
    setSoapPlan('');
    setEvaPre(evaPost);
    setEvaPost(Math.max(0, evaPost - 1));
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de selección de vista */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3 no-print">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('protocolo')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'protocolo'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            01. Protocolo Terapéutico en 4 Fases
          </button>
          <button
            type="button"
            onClick={() => setViewMode('seguimiento')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'seguimiento'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            02. Seguimiento Longitudinal y Sesiones SOAP ({activeCase.seguimientos.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('informe')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'informe'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            03. Informe Clínico y Documentación Imprimible
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {canModifyProtocol && viewMode === 'protocolo' && (
            <button
              type="button"
              onClick={handleRegenerateProtocol}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Adaptar Protocolo por Motor Clínico</span>
            </button>
          )}
          {viewMode === 'informe' && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Exportar PDF Clínico</span>
            </button>
          )}
        </div>
      </div>

      {/* VISTA 1: PROTOCOLO TERAPÉUTICO EN 4 FASES */}
      {viewMode === 'protocolo' && (
        <div className="space-y-6">
          {/* Bloque de Objetivos y Precauciones Obligatorias */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 border border-slate-200 bg-white p-6">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2.5 mb-3">
                Objetivos Clínicos y Funcionales del Caso
              </h3>
              <ul className="space-y-2 text-xs text-slate-700 list-disc pl-4">
                {activeCase.protocolo.objetivosPaciente.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-6 border border-slate-200 bg-white p-6">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2.5 mb-3">
                Precauciones Biomecánicas y Adaptación de Fuerza ({activeCase.paciente.grupoClinico.toUpperCase()})
              </h3>
              <ul className="space-y-2 text-xs text-slate-800 list-disc pl-4">
                {activeCase.protocolo.precaucionesEspecificas.map((prec, i) => (
                  <li key={i} className="font-medium">
                    {prec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Las 4 Fases del Protocolo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeCase.protocolo.fases.map((fase) => (
              <div
                key={fase.faseNumero}
                className={`border p-6 flex flex-col justify-between ${
                  fase.estadoFase === 'en_curso'
                    ? 'border-slate-900 bg-white'
                    : fase.estadoFase === 'completada'
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                        <span>FASE 0{fase.faseNumero}</span>
                        <span aria-hidden="true">·</span>
                        <span>{fase.frecuenciaSesiones}</span>
                        <span aria-hidden="true">·</span>
                        <span>{fase.duracionSemanas} semanas</span>
                      </div>
                      <h4 className="text-base font-semibold text-slate-900 mt-1">
                        {fase.nombreFase}
                      </h4>
                    </div>

                    <select
                      disabled={!canModifyProtocol}
                      value={fase.estadoFase}
                      onChange={(e) =>
                        handlePhaseStatusChange(
                          fase.faseNumero,
                          e.target.value as ProtocolPhaseItem['estadoFase']
                        )
                      }
                      className="border border-slate-300 px-2.5 py-1 text-xs font-medium bg-white text-slate-900"
                    >
                      <option value="en_curso">En Curso</option>
                      <option value="completada">Completada</option>
                      <option value="programada">Programada</option>
                    </select>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Objetivo clínico:</strong>{' '}
                    {fase.objetivoClinico}
                  </p>

                  <div>
                    <div className="text-xs font-semibold text-slate-900 mb-1.5">
                      Técnicas Quiroprácticas No Invasivas Prescritas:
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
                      {fase.tecnicasNoInvasivas.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-900 mb-1.5">
                      Ejercicios de Reeducación y Control Motor:
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
                      {fase.ejerciciosPrescritos.map((ej, idx) => (
                        <li key={idx}>{ej}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
                  <strong className="text-slate-900">Criterio de progresión:</strong>{' '}
                  {fase.criterioProgresion}
                </div>
              </div>
            ))}
          </div>

          {/* Pautas Ergonómicas y de Higiene de Columna */}
          <div className="border border-slate-200 bg-white p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Prescripción de Ergonomía Aplicada e Higiene Postural Domiciliaria
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Indicaciones adaptadas al entorno laboral, escolar o doméstico del paciente.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-800 list-decimal pl-5">
              {activeCase.protocolo.pautasErgonomicas.map((pauta, idx) => (
                <li key={idx}>{pauta}</li>
              ))}
            </ul>

            {canModifyProtocol && (
              <form
                onSubmit={handleAddErgonomicRule}
                className="flex flex-col sm:flex-row gap-2.5 pt-2"
              >
                <input
                  type="text"
                  placeholder="Agregar nueva indicación ergonómica o de descanso..."
                  value={newErgonomicRule}
                  onChange={(e) => setNewErgonomicRule(e.target.value)}
                  className="flex-1 border border-slate-300 px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Pauta Ergonómica</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: SEGUIMIENTO LONGITUDINAL Y SESIONES SOAP */}
      {viewMode === 'seguimiento' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Historial de sesiones y curva de dolor EVA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="border border-slate-200 bg-white p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Curva de Evolución Sintomática (EVA Pre vs. Post Sesión)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monitoreo cuantitativo de respuesta al ajuste quiropráctico no invasivo.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-600">
                  {activeCase.seguimientos.length} sesiones documentadas
                </span>
              </div>

              {activeCase.seguimientos.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200">
                  Aún no se han registrado sesiones de seguimiento para este caso.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCase.seguimientos.map((seg) => (
                    <div
                      key={seg.id}
                      className="p-4 border border-slate-200 bg-slate-50/50 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums font-bold text-slate-900">
                            Sesión #{seg.numeroSesion}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-slate-600">
                            {seg.fecha}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-700">{seg.profesional}</span>
                        </div>
                        <div className="font-mono tabular-nums font-semibold text-slate-900">
                          EVA Ingreso: {seg.evaPreSesion}/10 → Egreso: {seg.evaPostSesion}/10
                        </div>
                      </div>

                      <div className="text-xs text-slate-700">
                        <strong className="text-slate-900">Segmentos y Técnica:</strong>{' '}
                        {seg.segmentosAjustados.join(', ')} — {seg.tecnicaUtilizada}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                        <div>
                          <strong className="text-slate-900">S (Subjetivo):</strong>{' '}
                          {seg.notasSOAP.subjetivo}
                        </div>
                        <div>
                          <strong className="text-slate-900">O (Objetivo):</strong>{' '}
                          {seg.notasSOAP.objetivo}
                        </div>
                        <div>
                          <strong className="text-slate-900">A (Análisis):</strong>{' '}
                          {seg.notasSOAP.analisis}
                        </div>
                        <div>
                          <strong className="text-slate-900">P (Plan):</strong>{' '}
                          {seg.notasSOAP.plan}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Formulario de Nueva Sesión de Seguimiento SOAP */}
          <div className="lg:col-span-5 border border-slate-200 bg-white p-6">
            <div className="border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Documentar Nueva Sesión Clínica (Formato SOAP)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Actualiza automáticamente la curva evolutiva y la trazabilidad del expediente.
              </p>
            </div>

            {canLogSession ? (
              <form onSubmit={handleAddFollowUpSession} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      EVA Pre-Sesión ({evaPre}/10)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={evaPre}
                      onChange={(e) => setEvaPre(Number(e.target.value))}
                      className="w-full accent-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      EVA Post-Sesión ({evaPost}/10)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={evaPost}
                      onChange={(e) => setEvaPost(Number(e.target.value))}
                      className="w-full accent-emerald-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Segmentos Vertebrales Ajustados (separados por coma)
                  </label>
                  <input
                    type="text"
                    value={segmentosAjustadosInput}
                    onChange={(e) => setSegmentosAjustadosInput(e.target.value)}
                    className="w-full border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Técnica No Invasiva Aplicada
                  </label>
                  <input
                    type="text"
                    value={tecnicaInput}
                    onChange={(e) => setTecnicaInput(e.target.value)}
                    className="w-full border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Respuesta Neuro-Mecánica Inmediata
                  </label>
                  <select
                    value={respuestaInput}
                    onChange={(e) =>
                      setRespuestaInput(
                        e.target.value as FollowUpSession['respuestaInmediata']
                      )
                    }
                    className="w-full border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="favorable_liberacion">
                      Favorable — Liberación articular y alivio inmediato
                    </option>
                    <option value="alivio_parcial">
                      Alivio Parcial — Disminución progresiva del tono
                    </option>
                    <option value="sin_cambios">Sin cambios inmediatos</option>
                    <option value="molestia_reactiva_leve">
                      Sensibilidad muscular reactiva leve (esperable 24h)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    S — Subjetivo (Evolución reportada por el paciente)
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Ej. Refiere mayor libertad de giro cervical y ausencia de cefalea..."
                    value={soapSubjetivo}
                    onChange={(e) => setSoapSubjetivo(e.target.value)}
                    className="w-full border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    O — Objetivo (Hallazgos en camilla, Derifield, rango articular)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Nivelación de miembros inferiores completa, menor hipertonía C1-C2..."
                    value={soapObjetivo}
                    onChange={(e) => setSoapObjetivo(e.target.value)}
                    className="w-full border border-slate-300 px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      A — Análisis Clínico
                    </label>
                    <input
                      type="text"
                      placeholder="Progresión favorable..."
                      value={soapAnalisis}
                      onChange={(e) => setSoapAnalisis(e.target.value)}
                      className="w-full border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      P — Plan Próxima Sesión
                    </label>
                    <input
                      type="text"
                      placeholder="Continuar frecuencia..."
                      value={soapPlan}
                      onChange={(e) => setSoapPlan(e.target.value)}
                      className="w-full border border-slate-300 px-3 py-2"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                >
                  Registrar Sesión de Seguimiento
                </button>
              </form>
            ) : (
              <div className="p-4 border border-slate-200 bg-slate-50 text-xs text-slate-600">
                El rol actual ({permissions.titulo}) se encuentra en modo de solo lectura y no permite anexar evoluciones SOAP.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 3: INFORME CLÍNICO IMPRIMIBLE / EXPORTABLE */}
      {viewMode === 'informe' && (
        <div className="border border-slate-300 bg-white p-8 max-w-4xl mx-auto space-y-6">
          {/* Membrete Institucional ATLAS Columna Vertebral */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-700" />
                <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display">
                  ATLAS COLUMNA VERTEBRAL
                </h2>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                QUIROPRAXIA · ORTOPEDIA · APLICACIÓN DE TÉCNICAS NO INVASIVAS
              </p>
            </div>
            <div className="text-xs text-slate-600 sm:text-right font-mono tabular-nums">
              <div>Pje. Astigueta 1292, A4400 Salta, Argentina</div>
              <div>WhatsApp: +54 9 387 4 816999 · columna-vertebral.com.ar</div>
              <div>
                Expediente: {activeCase.codigoExpediente} · Fecha: {activeCase.ultimaActualizacion}
              </div>
            </div>
          </div>

          {/* Ficha del Paciente */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Paciente</span>
              <strong className="text-slate-900">
                {piiMasked
                  ? 'CONFIDENCIAL (PROTEGIDO)'
                  : activeCase.paciente.nombreCompleto}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">DNI / Edad / Grupo</span>
              <strong className="text-slate-900 font-mono tabular-nums">
                {piiMasked ? '***.***.***' : activeCase.paciente.documentoIdentidad} ·{' '}
                {activeCase.paciente.edad} años ({activeCase.paciente.grupoClinico.toUpperCase()})
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Índice Discapacidad / EVA</span>
              <strong className="text-slate-900 font-mono tabular-nums">
                {activeCase.anamnesis.indiceDiscapacidadPorcentaje}% · EVA{' '}
                {activeCase.anamnesis.evaActual}/10
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Clasificación de Seguridad</span>
              <strong className="text-slate-900">
                {riskEvaluation.requiereBajaFuerzaObligatoria
                  ? 'Protocolo Baja Fuerza'
                  : 'Apto No Invasivo'}
              </strong>
            </div>
          </div>

          {/* Síntesis de Evaluación y Correlación */}
          <div className="space-y-2 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
              1. Síntesis de Anamnesis y Correlación Clínico-Radiológica
            </h3>
            <p className="text-slate-800 leading-relaxed">
              <strong>Motivo de consulta:</strong> {activeCase.anamnesis.motivoConsultaPrincipal}
            </p>
            <p className="text-slate-800 leading-relaxed">
              <strong>Síntesis de correlación ({riskEvaluation.indiceConcordanciaImagenClinica}%):</strong>{' '}
              {activeCase.sintesisCorrelacion}
            </p>
          </div>

          {/* Hallazgos Vertebrales y Diagnóstico Diferencial Confirmado */}
          <div className="space-y-2 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
              2. Segmentos Vertebrales Comprometidos e Impresión Diagnóstica Funcional
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-800">
              {activeCase.examenEstructural.segmentosVertebrales.map((s) => (
                <li key={s.segmento}>
                  <strong>{s.segmento}:</strong> {s.subluxacionDireccion} ({s.movilidad.replace('_', ' ')}) — EVA palpación {s.dolorPalpacionEVA}/10.
                </li>
              ))}
            </ul>
            <div className="pt-2">
              {activeCase.diagnosticoDiferencial
                .filter((d) => d.certeza === 'confirmado' || d.certeza === 'probable')
                .map((d) => (
                  <div key={d.id} className="text-slate-800">
                    • <strong>[{d.certeza.toUpperCase()}] {d.patologia} ({d.codigoCIE10}):</strong>{' '}
                    {d.conductaQuiropractica}
                  </div>
                ))}
            </div>
          </div>

          {/* Plan Terapéutico por Fases */}
          <div className="space-y-2 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
              3. Protocolo Terapéutico Personalizado y Pautas Domiciliarias
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeCase.protocolo.fases.map((f) => (
                <div key={f.faseNumero} className="p-3 border border-slate-200">
                  <div className="font-bold text-slate-900">
                    {f.nombreFase} ({f.frecuenciaSesiones})
                  </div>
                  <div className="text-slate-700 mt-1">
                    {f.tecnicasNoInvasivas.join(' · ')}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <strong className="text-slate-900 block mb-1">
                Indicaciones de Higiene de Columna y Ergonomía:
              </strong>
              <ul className="list-decimal pl-5 space-y-1 text-slate-800">
                {activeCase.protocolo.pautasErgonomicas.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pie de firma */}
          <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
            <div>
              Documento clínico generado bajo protocolo de evaluación estructural y funcional no invasiva.
            </div>
            <div className="text-right">
              <strong className="text-slate-900 block">
                {activeCase.firmadoPorClinico || 'Profesional Quiropráctico Actuante'}
              </strong>
              <span>ATLAS Columna Vertebral — Salta, Argentina</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
