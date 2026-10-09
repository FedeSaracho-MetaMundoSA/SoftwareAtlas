import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  ClinicalRiskEvaluation,
  RolePermissionMatrix,
} from '../engine/clinicalEvaluationEngine';
import {
  ClinicalCaseRecord,
  MedicationEntry,
  OrthopedicTestResult,
  PatientGroup,
  SpineSegmentFinding,
} from '../types/clinical';

interface AnamnesisModuleProps {
  activeCase: ClinicalCaseRecord;
  riskEvaluation: ClinicalRiskEvaluation;
  permissions: RolePermissionMatrix;
  piiMasked: boolean;
  onUpdateCase: (updated: ClinicalCaseRecord, auditDetail: string) => void;
}

const SPINE_PRESET_SEGMENTS: { segmento: string; region: SpineSegmentFinding['region'] }[] = [
  { segmento: 'C0-C1 (Occipito-Atloidea)', region: 'cervical' },
  { segmento: 'C1 (Atlas)', region: 'cervical' },
  { segmento: 'C2 (Axis)', region: 'cervical' },
  { segmento: 'C3-C4', region: 'cervical' },
  { segmento: 'C5-C6', region: 'cervical' },
  { segmento: 'C7-T1 (Charnela)', region: 'cervical' },
  { segmento: 'T3-T4', region: 'toracica' },
  { segmento: 'T6-T10 (Ápex Torácico)', region: 'toracica' },
  { segmento: 'T12-L1', region: 'lumbar' },
  { segmento: 'L3-L4', region: 'lumbar' },
  { segmento: 'L4-L5', region: 'lumbar' },
  { segmento: 'L5-S1', region: 'lumbar' },
  { segmento: 'Sacro-Ilíaca Izquierda', region: 'pelvis_sacro' },
  { segmento: 'Sacro-Ilíaca Derecha', region: 'pelvis_sacro' },
];

export const AnamnesisModule: React.FC<AnamnesisModuleProps> = ({
  activeCase,
  riskEvaluation,
  permissions,
  piiMasked,
  onUpdateCase,
}) => {
  const [subTab, setSubTab] = useState<
    'contexto' | 'farmaco_psico' | 'estructural' | 'ortopedico'
  >('contexto');

  // Form states for adding medication
  const [newMedName, setNewMedName] = useState('');
  const [newMedCategory, setNewMedCategory] =
    useState<MedicationEntry['categoria']>('aine_analgesico');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');

  // Form states for adding spine segment finding
  const [selectedSegmentName, setSelectedSegmentName] = useState('C1 (Atlas)');
  const [segmentMobility, setSegmentMobility] =
    useState<SpineSegmentFinding['movilidad']>('hipomovil_fijacion');
  const [segmentVector, setSegmentVector] = useState('');
  const [segmentEva, setSegmentEva] = useState(5);
  const [segmentTone, setSegmentTone] =
    useState<SpineSegmentFinding['tonoParavertebral']>('hipertonia_leve');
  const [segmentDermatome, setSegmentDermatome] = useState('');

  // Form state for adding orthopedic test
  const [newTestName, setNewTestName] = useState('');
  const [newTestRegion, setNewTestRegion] =
    useState<OrthopedicTestResult['region']>('cervical');
  const [newTestResult, setNewTestResult] =
    useState<OrthopedicTestResult['resultado']>('positivo_derecho');
  const [newTestNotes, setNewTestNotes] = useState('');

  const canEditAnamnesis = permissions.puedeEditarAnamnesis;
  const canEditExam = permissions.puedeRegistrarExamenFisico;

  const handleGroupChange = (nuevoGrupo: PatientGroup) => {
    if (!canEditAnamnesis) return;
    const updated: ClinicalCaseRecord = {
      ...activeCase,
      paciente: {
        ...activeCase.paciente,
        grupoClinico: nuevoGrupo,
      },
      anamnesis: {
        ...activeCase.anamnesis,
        contextoPediatrico:
          nuevoGrupo === 'niño'
            ? activeCase.anamnesis.contextoPediatrico || {
                pesoKg: 40,
                tallaCm: 145,
                pesoMochilaKg: 4.5,
                signoRisser: 1,
                estironPuberalActivo: true,
                horasPantallaDiarias: 3,
                testAdamsGrados: 4,
                hitosMotoresNormales: true,
                observacionesDesarrollo: 'Evaluación de crecimiento espinal.',
              }
            : activeCase.anamnesis.contextoPediatrico,
        contextoMujer:
          nuevoGrupo === 'mujer'
            ? activeCase.anamnesis.contextoMujer || {
                etapaFisiologica: 'fertil',
                hiperlaxitudLigamentaria: false,
                compromisoPisoPelvico: false,
                densidadOsea: 'normal',
                dismenorreaRelacionadaLumbar: false,
              }
            : activeCase.anamnesis.contextoMujer,
        contextoAdulto:
          nuevoGrupo === 'adulto'
            ? activeCase.anamnesis.contextoAdulto || {
                modalidadTrabajo: 'sedentario_oficina',
                horasSentadoDiarias: 8,
                bruxismoOclusionATM: false,
                actividadDeportivaSemanalHoras: 2,
                calidadMobiliarioErgonomico: 'regular',
              }
            : activeCase.anamnesis.contextoAdulto,
      },
    };
    onUpdateCase(
      updated,
      `Cambio de grupo poblacional clínico a: ${nuevoGrupo.toUpperCase()}`
    );
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditAnamnesis || !newMedName.trim()) return;

    const requiereBajaFuerza =
      newMedCategory === 'anticoagulante' ||
      newMedCategory === 'corticoide_cronico' ||
      newMedCategory === 'bifosfonato_oseo';

    const impactoMap: Record<MedicationEntry['categoria'], string> = {
      anticoagulante:
        'Riesgo vascular/hematoma: contraindicado impulso HVLA y presión miofascial profunda.',
      corticoide_cronico:
        'Desmineralización trabecular: obligatorio protocolo instrumental de baja fuerza.',
      bifosfonato_oseo:
        'Fragilidad cortical potencial: evitar compresión costal o rotacional directa.',
      aine_analgesico:
        'Modulación de prostaglandinas: posible atenuación de dolor durante palpación.',
      relajante_muscular:
        'Disminución artificial del tono paravertebral defensivo.',
      psicofarmaco:
        'Considerar interacción con umbral central del dolor y calidad del sueño.',
      otro: 'Considerar farmacodinamia general en respuesta tisular.',
    };

    const nuevaMed: MedicationEntry = {
      id: `med-${Date.now()}`,
      nombre: newMedName.trim(),
      categoria: newMedCategory,
      dosis: newMedDose.trim() || 'Estándar',
      frecuencia: newMedFreq.trim() || 'Diaria',
      impactoQuiropractico: impactoMap[newMedCategory],
      requiereBajaFuerza,
    };

    const updated: ClinicalCaseRecord = {
      ...activeCase,
      anamnesis: {
        ...activeCase.anamnesis,
        medicacionActiva: [...activeCase.anamnesis.medicacionActiva, nuevaMed],
      },
    };
    onUpdateCase(updated, `Registro farmacológico: ${nuevaMed.nombre} (${nuevaMed.categoria})`);
    setNewMedName('');
    setNewMedDose('');
    setNewMedFreq('');
  };

  const handleRemoveMedication = (id: string, nombre: string) => {
    if (!canEditAnamnesis) return;
    const updated: ClinicalCaseRecord = {
      ...activeCase,
      anamnesis: {
        ...activeCase.anamnesis,
        medicacionActiva: activeCase.anamnesis.medicacionActiva.filter((m) => m.id !== id),
      },
    };
    onUpdateCase(updated, `Baja de medicación activa: ${nombre}`);
  };

  const handleToggleRedFlag = (key: keyof ClinicalCaseRecord['anamnesis']['banderasRojas']) => {
    if (!canEditAnamnesis) return;
    const currentVal = activeCase.anamnesis.banderasRojas[key];
    const updated: ClinicalCaseRecord = {
      ...activeCase,
      anamnesis: {
        ...activeCase.anamnesis,
        banderasRojas: {
          ...activeCase.anamnesis.banderasRojas,
          [key]: !currentVal,
        },
      },
    };
    onUpdateCase(
      updated,
      `Actualización de tamizaje de Bandera Roja (${key}): ${!currentVal ? 'ACTIVA' : 'NEGATIVA'}`
    );
  };

  const handleAddOrUpdateSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditExam) return;

    const preset = SPINE_PRESET_SEGMENTS.find((s) => s.segmento === selectedSegmentName);
    const region = preset ? preset.region : 'cervical';

    const newFinding: SpineSegmentFinding = {
      segmento: selectedSegmentName,
      region,
      movilidad: segmentMobility,
      subluxacionDireccion:
        segmentVector.trim() || 'Restricción biomecánica segmentaria en rotación/extensión',
      dolorPalpacionEVA: segmentEva,
      tonoParavertebral: segmentTone,
      irradiacionDermatomica: segmentDermatome.trim() || 'Localizado paravertebral',
    };

    const existingIdx = activeCase.examenEstructural.segmentosVertebrales.findIndex(
      (s) => s.segmento === selectedSegmentName
    );
    const nextList = [...activeCase.examenEstructural.segmentosVertebrales];
    if (existingIdx >= 0) {
      nextList[existingIdx] = newFinding;
    } else {
      nextList.push(newFinding);
    }

    const updated: ClinicalCaseRecord = {
      ...activeCase,
      examenEstructural: {
        ...activeCase.examenEstructural,
        segmentosVertebrales: nextList,
      },
    };

    onUpdateCase(
      updated,
      `Registro de hallazgo estructural en segmento ${selectedSegmentName} (${segmentMobility})`
    );
    setSegmentVector('');
    setSegmentDermatome('');
  };

  const handleRemoveSegment = (segmento: string) => {
    if (!canEditExam) return;
    const updated: ClinicalCaseRecord = {
      ...activeCase,
      examenEstructural: {
        ...activeCase.examenEstructural,
        segmentosVertebrales: activeCase.examenEstructural.segmentosVertebrales.filter(
          (s) => s.segmento !== segmento
        ),
      },
    };
    onUpdateCase(updated, `Eliminación de hallazgo vertebral en ${segmento}`);
  };

  const handleAddOrthopedicTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditExam || !newTestName.trim()) return;

    const nuevoTest: OrthopedicTestResult = {
      id: `ort-${Date.now()}`,
      nombre: newTestName.trim(),
      region: newTestRegion,
      resultado: newTestResult,
      hallazgoClinico:
        newTestNotes.trim() || 'Evaluado clínicamente en camilla quiropráctica.',
    };

    const updated: ClinicalCaseRecord = {
      ...activeCase,
      examenEstructural: {
        ...activeCase.examenEstructural,
        pruebasOrtopedicas: [...activeCase.examenEstructural.pruebasOrtopedicas, nuevoTest],
      },
    };

    onUpdateCase(
      updated,
      `Prueba ortopédica registrada: ${nuevoTest.nombre} (${nuevoTest.resultado})`
    );
    setNewTestName('');
    setNewTestNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Banner de Semáforo Clínico y Reglas de Negocio Activas */}
      <div
        className={`border p-5 ${
          riskEvaluation.requiereDerivacionUrgente
            ? 'border-red-300 bg-red-50/70'
            : riskEvaluation.requiereBajaFuerzaObligatoria
            ? 'border-amber-300 bg-amber-50/70'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Motor de Reglas Clínicas y Seguridad Quiropráctica</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Expediente {activeCase.codigoExpediente}
              </span>
              <span aria-hidden="true">·</span>
              <span>Grupo: {activeCase.paciente.grupoClinico.toUpperCase()}</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mt-1 flex items-center gap-2">
              {riskEvaluation.requiereDerivacionUrgente ? (
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0" />
              ) : riskEvaluation.requiereBajaFuerzaObligatoria ? (
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              )}
              <span>{riskEvaluation.etiquetaRiesgo}</span>
            </h2>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-700">
            <div>
              <span className="block text-slate-500">EVA Actual / Máximo</span>
              <span className="font-mono tabular-nums font-semibold text-sm text-slate-900">
                {activeCase.anamnesis.evaActual}/10 · Máx {activeCase.anamnesis.evaMaximoUltimaSemana}/10
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="block text-slate-500">{activeCase.anamnesis.escalaUtilizada}</span>
              <span className="font-mono tabular-nums font-semibold text-sm text-slate-900">
                {activeCase.anamnesis.indiceDiscapacidadPorcentaje}% Discapacidad
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="block text-slate-500">Modalidad Permitida</span>
              <span className="font-semibold text-sm text-slate-900">
                {riskEvaluation.requiereDerivacionUrgente
                  ? 'Interconsulta Médica'
                  : riskEvaluation.requiereBajaFuerzaObligatoria
                  ? 'Baja Fuerza / Instrumental'
                  : 'No Invasiva Completa'}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de alertas generadas por el motor */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {riskEvaluation.alertasBanderasRojas.map((alerta, i) => (
            <div key={`rf-${i}`} className="p-3 bg-red-100/80 border border-red-300 text-red-950">
              <strong className="font-semibold block mb-0.5">
                Bandera Roja Clínica Detectada:
              </strong>
              {alerta}
            </div>
          ))}
          {riskEvaluation.alertasFarmacologicas.map((alerta, i) => (
            <div
              key={`med-${i}`}
              className="p-3 bg-amber-100/70 border border-amber-300 text-amber-950"
            >
              <strong className="font-semibold block mb-0.5">
                Regla Farmacológica Aplicada:
              </strong>
              {alerta}
            </div>
          ))}
          {riskEvaluation.alertasGrupoPoblacional.map((alerta, i) => (
            <div
              key={`grp-${i}`}
              className="p-3 bg-slate-100 border border-slate-300 text-slate-900"
            >
              <strong className="font-semibold block mb-0.5">
                Regla Específica ({activeCase.paciente.grupoClinico.toUpperCase()}):
              </strong>
              {alerta}
            </div>
          ))}
          {riskEvaluation.alertasPsicologicas.map((alerta, i) => (
            <div
              key={`psy-${i}`}
              className="p-3 bg-slate-100 border border-slate-300 text-slate-900"
            >
              <strong className="font-semibold block mb-0.5">
                Evaluación Psicosocial Integrada:
              </strong>
              {alerta}
            </div>
          ))}
        </div>
      </div>

      {/* Navegación interna de etapas de evaluación */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setSubTab('contexto')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'contexto'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            01. Anamnesis y Contexto por Grupo
          </button>
          <button
            type="button"
            onClick={() => setSubTab('farmaco_psico')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'farmaco_psico'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            02. Farmacología, Psicología y Banderas Rojas
          </button>
          <button
            type="button"
            onClick={() => setSubTab('estructural')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'estructural'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            03. Examen Estructural y Mapa Vertebral
          </button>
          <button
            type="button"
            onClick={() => setSubTab('ortopedico')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'ortopedico'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            04. Pruebas Ortopédicas y Neurológicas
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Permiso de edición actual:{' '}
          <span className="font-semibold text-slate-800">
            {canEditAnamnesis ? 'Habilitado' : 'Solo Lectura (Auditoría)'}
          </span>
        </div>
      </div>

      {/* SUB-TAB 1: ANAMNESIS Y CONTEXTO POR GRUPO */}
      {subTab === 'contexto' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna izquierda: Datos clínicos y dolor */}
          <div className="lg:col-span-6 border border-slate-200 bg-white p-6 space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Datos Demográficos y Cuadro Clínico Principal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Recolección estructurada con adaptación automática de reglas según edad y grupo biológico.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre del Paciente
                </label>
                <input
                  type="text"
                  disabled={!canEditAnamnesis || piiMasked}
                  value={
                    piiMasked
                      ? 'PACIENTE CONFIDENCIAL'
                      : activeCase.paciente.nombreCompleto
                  }
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        paciente: {
                          ...activeCase.paciente,
                          nombreCompleto: e.target.value,
                        },
                      },
                      'Actualización de nombre del paciente'
                    )
                  }
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Grupo Clínico Especializado
                </label>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                  {(['niño', 'mujer', 'adulto'] as PatientGroup[]).map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      disabled={!canEditAnamnesis}
                      onClick={() => handleGroupChange(grp)}
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                        activeCase.paciente.grupoClinico === grp
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {grp === 'niño'
                        ? 'Niños / Pediátrico'
                        : grp === 'mujer'
                        ? 'Mujer'
                        : 'Adulto'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Edad (Años)
                </label>
                <input
                  type="number"
                  min={1}
                  max={105}
                  disabled={!canEditAnamnesis}
                  value={activeCase.paciente.edad}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        paciente: {
                          ...activeCase.paciente,
                          edad: Number(e.target.value) || 1,
                        },
                      },
                      'Actualización de edad del paciente'
                    )
                  }
                  className="w-full border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ocupación / Contexto Diario
                </label>
                <input
                  type="text"
                  disabled={!canEditAnamnesis}
                  value={activeCase.paciente.ocupacion}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        paciente: {
                          ...activeCase.paciente,
                          ocupacion: e.target.value,
                        },
                      },
                      'Actualización de ocupación/contexto'
                    )
                  }
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Motivo de Consulta y Distribución del Síntoma
              </label>
              <textarea
                rows={3}
                disabled={!canEditAnamnesis}
                value={activeCase.anamnesis.motivoConsultaPrincipal}
                onChange={(e) =>
                  onUpdateCase(
                    {
                      ...activeCase,
                      anamnesis: {
                        ...activeCase.anamnesis,
                        motivoConsultaPrincipal: e.target.value,
                      },
                    },
                    'Actualización de motivo de consulta'
                  )
                }
                className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Dolor Actual (EVA 0-10)</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {activeCase.anamnesis.evaActual} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  disabled={!canEditAnamnesis}
                  value={activeCase.anamnesis.evaActual}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        anamnesis: {
                          ...activeCase.anamnesis,
                          evaActual: Number(e.target.value),
                        },
                      },
                      `Ajuste de EVA actual a ${e.target.value}/10`
                    )
                  }
                  className="w-full accent-slate-900"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">
                    Índice Funcional ({activeCase.anamnesis.escalaUtilizada})
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {activeCase.anamnesis.indiceDiscapacidadPorcentaje}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={2}
                  disabled={!canEditAnamnesis}
                  value={activeCase.anamnesis.indiceDiscapacidadPorcentaje}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        anamnesis: {
                          ...activeCase.anamnesis,
                          indiceDiscapacidadPorcentaje: Number(e.target.value),
                        },
                      },
                      `Actualización de índice de discapacidad a ${e.target.value}%`
                    )
                  }
                  className="w-full accent-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Columna derecha: Formulario Dinámico según Grupo (Niño / Mujer / Adulto) */}
          <div className="lg:col-span-6 border border-slate-200 bg-white p-6 space-y-5">
            {activeCase.paciente.grupoClinico === 'niño' &&
              activeCase.anamnesis.contextoPediatrico && (
                <>
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-base font-semibold text-slate-900">
                      Parámetros de Crecimiento Espinal Infantil y Carga Escolar
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evalúa riesgo de progresión escoliótica por maduración ósea (Risser) y relación mochila/peso.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Peso Corporal (kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        disabled={!canEditAnamnesis}
                        value={activeCase.anamnesis.contextoPediatrico.pesoKg}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoPediatrico: {
                                  ...activeCase.anamnesis.contextoPediatrico!,
                                  pesoKg: Number(e.target.value) || 1,
                                },
                              },
                            },
                            'Actualización de peso pediátrico'
                          )
                        }
                        className="w-full border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Peso Mochila (kg)
                      </label>
                      <input
                        type="number"
                        step="0.2"
                        disabled={!canEditAnamnesis}
                        value={activeCase.anamnesis.contextoPediatrico.pesoMochilaKg}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoPediatrico: {
                                  ...activeCase.anamnesis.contextoPediatrico!,
                                  pesoMochilaKg: Number(e.target.value) || 0,
                                },
                              },
                            },
                            'Actualización de peso de mochila escolar'
                          )
                        }
                        className="w-full border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Relación Carga / Peso
                      </label>
                      <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono tabular-nums font-semibold">
                        {(
                          (activeCase.anamnesis.contextoPediatrico.pesoMochilaKg /
                            Math.max(1, activeCase.anamnesis.contextoPediatrico.pesoKg)) *
                          100
                        ).toFixed(1)}
                        %{' '}
                        <span className="text-xs font-sans font-normal text-slate-500">
                          (Máx 10%)
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Signo de Risser (0 a 5)
                      </label>
                      <select
                        disabled={!canEditAnamnesis}
                        value={activeCase.anamnesis.contextoPediatrico.signoRisser}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoPediatrico: {
                                  ...activeCase.anamnesis.contextoPediatrico!,
                                  signoRisser: Number(
                                    e.target.value
                                  ) as 0 | 1 | 2 | 3 | 4 | 5,
                                },
                              },
                            },
                            `Actualización de Signo de Risser a ${e.target.value}`
                          )
                        }
                        className="w-full border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums bg-white"
                      >
                        <option value={0}>Risser 0 (Inmadurez alta)</option>
                        <option value={1}>Risser 1 (25% osificación ilíaca)</option>
                        <option value={2}>Risser 2 (50% osificación ilíaca)</option>
                        <option value={3}>Risser 3 (75% osificación ilíaca)</option>
                        <option value={4}>Risser 4 (100% sin fusión)</option>
                        <option value={5}>Risser 5 (Madurez ósea completa)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Test de Adams (Grados ATR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        disabled={!canEditAnamnesis}
                        value={activeCase.anamnesis.contextoPediatrico.testAdamsGrados}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoPediatrico: {
                                  ...activeCase.anamnesis.contextoPediatrico!,
                                  testAdamsGrados: Number(e.target.value) || 0,
                                },
                              },
                            },
                            `Actualización de grados ATR en Test de Adams a ${e.target.value}°`
                          )
                        }
                        className="w-full border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Horas Pantalla / Día
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        disabled={!canEditAnamnesis}
                        value={activeCase.anamnesis.contextoPediatrico.horasPantallaDiarias}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoPediatrico: {
                                  ...activeCase.anamnesis.contextoPediatrico!,
                                  horasPantallaDiarias: Number(e.target.value) || 0,
                                },
                              },
                            },
                            'Actualización de horas de pantalla pediátricas'
                          )
                        }
                        className="w-full border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canEditAnamnesis}
                        checked={activeCase.anamnesis.contextoPediatrico.estironPuberalActivo}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoPediatrico: {
                                  ...activeCase.anamnesis.contextoPediatrico!,
                                  estironPuberalActivo: e.target.checked,
                                },
                              },
                            },
                            'Actualización de estado de estirón puberal'
                          )
                        }
                        className="w-4 h-4 accent-slate-900"
                      />
                      <span>
                        Paciente en pico de velocidad de crecimiento puberal (requiere vigilancia estrecha de curva)
                      </span>
                    </label>
                  </div>
                </>
              )}

            {activeCase.paciente.grupoClinico === 'mujer' &&
              activeCase.anamnesis.contextoMujer && (
                <>
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-base font-semibold text-slate-900">
                      Biomecánica Especializada en la Mujer (Ciclo Vital, Gestación y Densidad Ósea)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Parametriza hiperlaxitud ligamentaria por relaxina, estabilidad lumbo-pélvica posparto y salud trabecular.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Etapa Fisiológica Actual
                      </label>
                      <select
                        disabled={!canEditAnamnesis}
                        value={activeCase.anamnesis.contextoMujer.etapaFisiologica}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoMujer: {
                                  ...activeCase.anamnesis.contextoMujer!,
                                  etapaFisiologica: e.target
                                    .value as typeof activeCase.anamnesis.contextoMujer.etapaFisiologica,
                                },
                              },
                            },
                            `Actualización de etapa fisiológica femenina a ${e.target.value}`
                          )
                        }
                        className="w-full border border-slate-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="fertil">Etapa Fértil No Gestante</option>
                        <option value="gestacion_t1">Gestación — 1° Trimestre</option>
                        <option value="gestacion_t2">Gestación — 2° Trimestre</option>
                        <option value="gestacion_t3">Gestación — 3° Trimestre</option>
                        <option value="posparto">Puerperio / Posparto y Lactancia</option>
                        <option value="perimenopausia">Perimenopausia</option>
                        <option value="posmenopausia">Posmenopausia</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Densidad Mineral Ósea (DMO / DEXA)
                      </label>
                      <select
                        disabled={!canEditAnamnesis}
                        value={activeCase.anamnesis.contextoMujer.densidadOsea}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoMujer: {
                                  ...activeCase.anamnesis.contextoMujer!,
                                  densidadOsea: e.target
                                    .value as typeof activeCase.anamnesis.contextoMujer.densidadOsea,
                                },
                              },
                            },
                            `Cambio de estado de densidad ósea a ${e.target.value}`
                          )
                        }
                        className="w-full border border-slate-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="normal">Normal (T-score ≥ -1.0)</option>
                        <option value="osteopenia">
                          Osteopenia (-1.0 a -2.5) — Activa Baja Fuerza
                        </option>
                        <option value="osteoporosis">
                          Osteoporosis (≤ -2.5) — Bloquea HVLA
                        </option>
                        <option value="no_evaluada">No evaluada aún</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canEditAnamnesis}
                        checked={activeCase.anamnesis.contextoMujer.hiperlaxitudLigamentaria}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoMujer: {
                                  ...activeCase.anamnesis.contextoMujer!,
                                  hiperlaxitudLigamentaria: e.target.checked,
                                },
                              },
                            },
                            'Actualización de hiperlaxitud ligamentaria sacroilíaca'
                          )
                        }
                        className="w-4 h-4 accent-slate-900"
                      />
                      <span>
                        Hiperlaxitud ligamentaria sacroilíaca / pélvica activa (evitar hiperrotación lumbar)
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canEditAnamnesis}
                        checked={activeCase.anamnesis.contextoMujer.compromisoPisoPelvico}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoMujer: {
                                  ...activeCase.anamnesis.contextoMujer!,
                                  compromisoPisoPelvico: e.target.checked,
                                },
                              },
                            },
                            'Actualización de sinergia de piso pélvico/diástasis'
                          )
                        }
                        className="w-4 h-4 accent-slate-900"
                      />
                      <span>
                        Disfunción de piso pélvico o diástasis abdominal asociada a inestabilidad lumbosacra
                      </span>
                    </label>
                  </div>
                </>
              )}

            {activeCase.paciente.grupoClinico === 'adulto' &&
              activeCase.anamnesis.contextoAdulto && (
                <>
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-base font-semibold text-slate-900">
                      Contexto Biomecánico Ocupacional, Deportivo y Cráneo-Mandibular (Adulto)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evalúa carga estática laboral, calidad ergonómica y cadena ascendente/descendente (ATM - Atlas).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Modalidad Ocupacional Predominante
                      </label>
                      <select
                        disabled={!canEditAnamnesis}
                        value={activeCase.anamnesis.contextoAdulto.modalidadTrabajo}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoAdulto: {
                                  ...activeCase.anamnesis.contextoAdulto!,
                                  modalidadTrabajo: e.target
                                    .value as typeof activeCase.anamnesis.contextoAdulto.modalidadTrabajo,
                                },
                              },
                            },
                            'Actualización de modalidad ocupacional'
                          )
                        }
                        className="w-full border border-slate-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="sedentario_oficina">
                          Sedentario / Escritorio y Pantallas
                        </option>
                        <option value="carga_fisica">
                          Esfuerzo Físico / Levantamiento de Pesos
                        </option>
                        <option value="bipedestacion_prolongada">
                          Bipedestación Estática Prolongada
                        </option>
                        <option value="conduccion_vibracion">
                          Conducción Vehicular / Vibración Axial
                        </option>
                        <option value="mixto">Mixto / Dinámico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Horas de Sedestación Diaria
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={18}
                        disabled={!canEditAnamnesis}
                        value={activeCase.anamnesis.contextoAdulto.horasSentadoDiarias}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoAdulto: {
                                  ...activeCase.anamnesis.contextoAdulto!,
                                  horasSentadoDiarias: Number(e.target.value) || 0,
                                },
                              },
                            },
                            'Actualización de horas de sedestación diaria'
                          )
                        }
                        className="w-full border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Calidad de Mobiliario Ergonómico
                      </label>
                      <select
                        disabled={!canEditAnamnesis}
                        value={activeCase.anamnesis.contextoAdulto.calidadMobiliarioErgonomico}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoAdulto: {
                                  ...activeCase.anamnesis.contextoAdulto!,
                                  calidadMobiliarioErgonomico: e.target
                                    .value as typeof activeCase.anamnesis.contextoAdulto.calidadMobiliarioErgonomico,
                                },
                              },
                            },
                            'Actualización de calificación ergonómica laboral'
                          )
                        }
                        className="w-full border border-slate-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="optimo">Óptimo (Soporte regulado)</option>
                        <option value="regular">Regular (Sin ajuste de altura/lumbar)</option>
                        <option value="deficiente">Deficiente (Superficie inadecuada)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Actividad Física Semanal (Horas)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        disabled={!canEditAnamnesis}
                        value={
                          activeCase.anamnesis.contextoAdulto.actividadDeportivaSemanalHoras
                        }
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoAdulto: {
                                  ...activeCase.anamnesis.contextoAdulto!,
                                  actividadDeportivaSemanalHoras:
                                    Number(e.target.value) || 0,
                                },
                              },
                            },
                            'Actualización de horas de actividad deportiva'
                          )
                        }
                        className="w-full border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canEditAnamnesis}
                        checked={activeCase.anamnesis.contextoAdulto.bruxismoOclusionATM}
                        onChange={(e) =>
                          onUpdateCase(
                            {
                              ...activeCase,
                              anamnesis: {
                                ...activeCase.anamnesis,
                                contextoAdulto: {
                                  ...activeCase.anamnesis.contextoAdulto!,
                                  bruxismoOclusionATM: e.target.checked,
                                },
                              },
                            },
                            'Actualización de correlación Bruxismo/ATM - C1 Atlas'
                          )
                        }
                        className="w-4 h-4 accent-slate-900"
                      />
                      <span>
                        Bruxismo o disfunción temporomandibular (ATM) asociada a tensión suboccipital C0-C1-C2
                      </span>
                    </label>
                  </div>
                </>
              )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FARMACOLOGÍA, EVALUACIÓN PSICOLÓGICA Y BANDERAS ROJAS */}
      {subTab === 'farmaco_psico' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Farmacología Relevante */}
          <div className="lg:col-span-5 border border-slate-200 bg-white p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Medicación Activa e Impacto Biomecánico
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detecta anticoagulantes, corticoides o bifosfonatos que obligan a adaptar la fuerza del ajuste.
              </p>
            </div>

            {activeCase.anamnesis.medicacionActiva.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 text-xs text-slate-500">
                El paciente no registra medicación farmacológica activa en este momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200">
                {activeCase.anamnesis.medicacionActiva.map((med) => (
                  <div key={med.id} className="p-3.5 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-900 text-sm">
                          {med.nombre}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{med.dosis}</span>
                        <span aria-hidden="true">·</span>
                        <span>{med.frecuencia}</span>
                      </div>
                      <p className="text-xs text-slate-600">{med.impactoQuiropractico}</p>
                      {med.requiereBajaFuerza && (
                        <p className="text-xs font-semibold text-amber-800">
                          Regla activa: Obliga a técnicas suaves de baja fuerza
                        </p>
                      )}
                    </div>
                    {canEditAnamnesis && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(med.id, med.nombre)}
                        className="text-slate-400 hover:text-red-700 p-1"
                        title="Eliminar medicación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canEditAnamnesis && (
              <form onSubmit={handleAddMedication} className="space-y-3 pt-2 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-800">
                  Agregar Fármaco al Expediente
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Nombre comercial o droga"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="border border-slate-300 px-2.5 py-1.5 text-xs"
                  />
                  <select
                    value={newMedCategory}
                    onChange={(e) =>
                      setNewMedCategory(
                        e.target.value as MedicationEntry['categoria']
                      )
                    }
                    className="border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                  >
                    <option value="aine_analgesico">AINE / Analgésico</option>
                    <option value="relajante_muscular">Relajante Muscular</option>
                    <option value="anticoagulante">
                      Anticoagulante / Antiagregante (Alerta HVLA)
                    </option>
                    <option value="corticoide_cronico">
                      Corticoide Crónico (Alerta Fragilidad)
                    </option>
                    <option value="bifosfonato_oseo">
                      Bifosfonato / Metabolismo Óseo
                    </option>
                    <option value="psicofarmaco">Psicofármaco / Modulador Central</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Dosis (ej. 15 mg)"
                    value={newMedDose}
                    onChange={(e) => setNewMedDose(e.target.value)}
                    className="border border-slate-300 px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Frecuencia (ej. cada 12h)"
                    value={newMedFreq}
                    onChange={(e) => setNewMedFreq(e.target.value)}
                    className="border border-slate-300 px-2.5 py-1.5 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Medicación y Recalcular Riesgo
                </button>
              </form>
            )}
          </div>

          {/* Evaluación Psicológica y Banderas Amarillas */}
          <div className="lg:col-span-4 border border-slate-200 bg-white p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Motor Psicosocial Integrado (Banderas Amarillas)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Modula el pronóstico funcional y la necesidad de educación en neurociencia del dolor.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">
                    Kinesiofobia (Miedo al movimiento)
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {activeCase.anamnesis.evaluacionPsicologica.kinesiofobiaScore} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  disabled={!canEditAnamnesis}
                  value={activeCase.anamnesis.evaluacionPsicologica.kinesiofobiaScore}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        anamnesis: {
                          ...activeCase.anamnesis,
                          evaluacionPsicologica: {
                            ...activeCase.anamnesis.evaluacionPsicologica,
                            kinesiofobiaScore: Number(e.target.value),
                          },
                        },
                      },
                      'Actualización de score de kinesiofobia'
                    )
                  }
                  className="w-full accent-slate-900"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">
                    Catastrofización ante el Síntoma
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {activeCase.anamnesis.evaluacionPsicologica.catastrofizacionDolor} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  disabled={!canEditAnamnesis}
                  value={activeCase.anamnesis.evaluacionPsicologica.catastrofizacionDolor}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        anamnesis: {
                          ...activeCase.anamnesis,
                          evaluacionPsicologica: {
                            ...activeCase.anamnesis.evaluacionPsicologica,
                            catastrofizacionDolor: Number(e.target.value),
                          },
                        },
                      },
                      'Actualización de catastrofización del dolor'
                    )
                  }
                  className="w-full accent-slate-900"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">
                    Estrés Autonómico Percibido
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {activeCase.anamnesis.evaluacionPsicologica.estresPercibido} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  disabled={!canEditAnamnesis}
                  value={activeCase.anamnesis.evaluacionPsicologica.estresPercibido}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        anamnesis: {
                          ...activeCase.anamnesis,
                          evaluacionPsicologica: {
                            ...activeCase.anamnesis.evaluacionPsicologica,
                            estresPercibido: Number(e.target.value),
                          },
                        },
                      },
                      'Actualización de nivel de estrés percibido'
                    )
                  }
                  className="w-full accent-slate-900"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">
                    Calidad del Sueño Reparador (10 = Óptimo)
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {activeCase.anamnesis.evaluacionPsicologica.calidadSueno} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  disabled={!canEditAnamnesis}
                  value={activeCase.anamnesis.evaluacionPsicologica.calidadSueno}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        anamnesis: {
                          ...activeCase.anamnesis,
                          evaluacionPsicologica: {
                            ...activeCase.anamnesis.evaluacionPsicologica,
                            calidadSueno: Number(e.target.value),
                          },
                        },
                      },
                      'Actualización de calidad del sueño'
                    )
                  }
                  className="w-full accent-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Tamizaje de Banderas Rojas */}
          <div className="lg:col-span-3 border border-slate-200 bg-white p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Tamizaje de Banderas Rojas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cualquier ítem activo bloquea el ajuste mecánico e indica derivación urgente.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              {(
                [
                  ['perdidaControlEsfinteres', 'Alteración de esfínteres vesical/anal'],
                  ['anestesiaSillaMontar', 'Anestesia perineal en silla de montar'],
                  ['insuficienciaVertebrobasilar', 'Signos vertebrobasilares (5D / 3N)'],
                  ['deficitMotorProgresivo', 'Déficit motor miotomal progresivo'],
                  ['traumaAltaEnergiaReciente', 'Trauma reciente de alta energía'],
                  ['perdidaPesoInexplicada', 'Pérdida de peso inexplicada'],
                  ['dolorNocturnoIncesante', 'Dolor nocturno que no cede en ninguna postura'],
                  ['fiebreRecienteInfeccion', 'Fiebre o proceso infeccioso espinal'],
                ] as [keyof ClinicalCaseRecord['anamnesis']['banderasRojas'], string][]
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-start gap-2.5 cursor-pointer text-slate-800"
                >
                  <input
                    type="checkbox"
                    disabled={!canEditAnamnesis}
                    checked={activeCase.anamnesis.banderasRojas[key]}
                    onChange={() => handleToggleRedFlag(key)}
                    className="mt-0.5 w-4 h-4 accent-red-700"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EXAMEN ESTRUCTURAL Y MAPA VERTEBRAL */}
      {subTab === 'estructural' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Métricas Posturales y Plomada */}
          <div className="lg:col-span-4 border border-slate-200 bg-white p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Biometría Postural y Plomada
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mediciones milimétricas de desnivel pélvico, Derifield-Thompson y traslación cefálica.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Basculación Pélvica Frontal (mm)
                </label>
                <input
                  type="number"
                  disabled={!canEditExam}
                  value={activeCase.examenEstructural.basculacionPelvicaMm}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        examenEstructural: {
                          ...activeCase.examenEstructural,
                          basculacionPelvicaMm: Number(e.target.value) || 0,
                        },
                      },
                      'Actualización de basculación pélvica en mm'
                    )
                  }
                  className="w-full border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Discrepancia Funcional MMII — Derifield (mm)
                </label>
                <input
                  type="number"
                  disabled={!canEditExam}
                  value={activeCase.examenEstructural.discrepanciaMiembrosInferioresMm}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        examenEstructural: {
                          ...activeCase.examenEstructural,
                          discrepanciaMiembrosInferioresMm: Number(e.target.value) || 0,
                        },
                      },
                      'Actualización de discrepancia funcional de miembros inferiores'
                    )
                  }
                  className="w-full border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Proyección Anterior de Cabeza — FHP (mm)
                </label>
                <input
                  type="number"
                  disabled={!canEditExam}
                  value={activeCase.examenEstructural.proyeccionAnteriorCabezaMm}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        examenEstructural: {
                          ...activeCase.examenEstructural,
                          proyeccionAnteriorCabezaMm: Number(e.target.value) || 0,
                        },
                      },
                      'Actualización de proyección anterior de cabeza (FHP)'
                    )
                  }
                  className="w-full border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nivelación Acromial de Hombros
                </label>
                <select
                  disabled={!canEditExam}
                  value={activeCase.examenEstructural.simetriaHombros}
                  onChange={(e) =>
                    onUpdateCase(
                      {
                        ...activeCase,
                        examenEstructural: {
                          ...activeCase.examenEstructural,
                          simetriaHombros: e.target
                            .value as typeof activeCase.examenEstructural.simetriaHombros,
                        },
                      },
                      'Actualización de simetría de hombros'
                    )
                  }
                  className="w-full border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="nivelados">Nivelados Simétricos</option>
                  <option value="ascenso_derecho">Ascenso Acromial Derecho</option>
                  <option value="ascenso_izquierdo">Ascenso Acromial Izquierdo</option>
                </select>
              </div>
            </div>

            {canEditExam && (
              <form
                onSubmit={handleAddOrUpdateSegment}
                className="space-y-3 pt-4 border-t border-slate-200"
              >
                <div className="text-xs font-semibold text-slate-900">
                  Registrar / Actualizar Segmento Vertebral
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Segmento Anatómico
                  </label>
                  <select
                    value={selectedSegmentName}
                    onChange={(e) => setSelectedSegmentName(e.target.value)}
                    className="w-full border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                  >
                    {SPINE_PRESET_SEGMENTS.map((s) => (
                      <option key={s.segmento} value={s.segmento}>
                        {s.segmento} ({s.region.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      Cinemática Articular
                    </label>
                    <select
                      value={segmentMobility}
                      onChange={(e) =>
                        setSegmentMobility(
                          e.target.value as SpineSegmentFinding['movilidad']
                        )
                      }
                      className="w-full border border-slate-300 px-2 py-1.5 text-xs bg-white"
                    >
                      <option value="hipomovil_fijacion">Hipomóvil (Fijación)</option>
                      <option value="hipermovil_compensatorio">
                        Hipermóvil (Compensatorio)
                      </option>
                      <option value="normal">Movilidad Conservada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      Tono Paravertebral
                    </label>
                    <select
                      value={segmentTone}
                      onChange={(e) =>
                        setSegmentTone(
                          e.target.value as SpineSegmentFinding['tonoParavertebral']
                        )
                      }
                      className="w-full border border-slate-300 px-2 py-1.5 text-xs bg-white"
                    >
                      <option value="espasmo_defensivo">Espasmo Defensivo</option>
                      <option value="hipertonia_leve">Hipertonía Leve</option>
                      <option value="normotonico">Normotónico</option>
                      <option value="atrofia">Atrofia / Inhibición</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Listado / Dirección de Subluxación (ej. ASRP, PLS, PI)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Atlas ASRP / Rotación espinosa izq."
                    value={segmentVector}
                    onChange={(e) => setSegmentVector(e.target.value)}
                    className="w-full border border-slate-300 px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      Dolor Palpación (EVA {segmentEva}/10)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={segmentEva}
                      onChange={(e) => setSegmentEva(Number(e.target.value))}
                      className="w-full accent-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      Referencia Dermatómica
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Territorio C6 / L5"
                      value={segmentDermatome}
                      onChange={(e) => setSegmentDermatome(e.target.value)}
                      className="w-full border border-slate-300 px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
                >
                  Guardar Hallazgo Segmentario
                </button>
              </form>
            )}
          </div>

          {/* Tabla de Hallazgos Estructurales por Segmento Vertebral */}
          <div className="lg:col-span-8 border border-slate-200 bg-white p-6">
            <div className="border-b border-slate-200 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Mapa de Hallazgos Segmentarios de Columna Vertebral (C0 a Pelvis)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Diferencia segmentos primarios hipomóviles (objetivo de ajuste) de segmentos hipermóviles compensatorios.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                {activeCase.examenEstructural.segmentosVertebrales.length} segmentos registrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2.5 pr-3 font-medium">Segmento</th>
                    <th className="py-2.5 px-3 font-medium">Estado Cinemático</th>
                    <th className="py-2.5 px-3 font-medium">Vector / Subluxación</th>
                    <th className="py-2.5 px-3 font-medium text-right">EVA Palpación</th>
                    <th className="py-2.5 px-3 font-medium">Tono y Dermatoma</th>
                    {canEditExam && <th className="py-2.5 pl-3 text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {activeCase.examenEstructural.segmentosVertebrales.map((seg) => (
                    <tr key={seg.segmento} className="hover:bg-slate-50/80">
                      <td className="py-3 pr-3 font-semibold text-slate-900 whitespace-nowrap">
                        {seg.segmento}
                        <span className="block font-normal text-slate-500">
                          Región {seg.region}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-medium ${
                            seg.movilidad === 'hipomovil_fijacion'
                              ? 'text-red-800'
                              : seg.movilidad === 'hipermovil_compensatorio'
                              ? 'text-amber-800'
                              : 'text-emerald-800'
                          }`}
                        >
                          {seg.movilidad === 'hipomovil_fijacion'
                            ? 'Hipomóvil · Fijación Primaria'
                            : seg.movilidad === 'hipermovil_compensatorio'
                            ? 'Hipermóvil · Compensatorio (No rotar)'
                            : 'Movilidad Normal'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-800">{seg.subluxacionDireccion}</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {seg.dolorPalpacionEVA}/10
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="text-slate-900 font-medium">
                          {seg.tonoParavertebral.replace('_', ' ')}
                        </span>{' '}
                        · {seg.irradiacionDermatomica}
                      </td>
                      {canEditExam && (
                        <td className="py-3 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveSegment(seg.segmento)}
                            className="text-slate-400 hover:text-red-700 p-1"
                            title="Quitar segmento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PRUEBAS ORTOPÉDICAS Y NEUROLÓGICAS */}
      {subTab === 'ortopedico' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 border border-slate-200 bg-white p-6">
            <div className="border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Batería de Pruebas Ortopédicas, Radiculares y Funcionales
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Resultados de provocación y alivio para alimentar el motor de diagnóstico diferencial.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {activeCase.examenEstructural.pruebasOrtopedicas.map((ort) => (
                <div key={ort.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="text-sm font-semibold text-slate-900">
                        {ort.nombre}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Región {ort.region.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-slate-700">{ort.hallazgoClinico}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      disabled={!canEditExam}
                      value={ort.resultado}
                      onChange={(e) => {
                        const nextList =
                          activeCase.examenEstructural.pruebasOrtopedicas.map((item) =>
                            item.id === ort.id
                              ? {
                                  ...item,
                                  resultado: e.target
                                    .value as OrthopedicTestResult['resultado'],
                                }
                              : item
                          );
                        onUpdateCase(
                          {
                            ...activeCase,
                            examenEstructural: {
                              ...activeCase.examenEstructural,
                              pruebasOrtopedicas: nextList,
                            },
                          },
                          `Cambio de resultado en prueba ${ort.nombre} a ${e.target.value}`
                        );
                      }}
                      className="border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-medium text-slate-900"
                    >
                      <option value="negativo">Negativo (-)</option>
                      <option value="positivo_derecho">Positivo Derecho (+)</option>
                      <option value="positivo_izquierdo">Positivo Izquierdo (+)</option>
                      <option value="positivo_bilateral">Positivo Bilateral (++)</option>
                      <option value="no_evaluado">No Evaluado</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canEditExam && (
            <div className="lg:col-span-4 border border-slate-200 bg-white p-6">
              <div className="border-b border-slate-200 pb-3 mb-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Incorporar Prueba Clínica
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registra maniobras adicionales (Spurling, Lasègue, Bragard, Kemp, Adams, Derifield, Romberg).
                </p>
              </div>

              <form onSubmit={handleAddOrthopedicTest} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nombre de la Maniobra / Test
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Test de Kemp / Maniobra de Valsalva"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    className="w-full border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Región
                    </label>
                    <select
                      value={newTestRegion}
                      onChange={(e) =>
                        setNewTestRegion(
                          e.target.value as OrthopedicTestResult['region']
                        )
                      }
                      className="w-full border border-slate-300 px-2.5 py-2 text-xs bg-white"
                    >
                      <option value="cervical">Cervical</option>
                      <option value="toracica">Torácica</option>
                      <option value="lumbar">Lumbar</option>
                      <option value="sacroiliaca">Sacroilíaca / Pelvis</option>
                      <option value="neurologica">Neurológica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Resultado
                    </label>
                    <select
                      value={newTestResult}
                      onChange={(e) =>
                        setNewTestResult(
                          e.target.value as OrthopedicTestResult['resultado']
                        )
                      }
                      className="w-full border border-slate-300 px-2.5 py-2 text-xs bg-white"
                    >
                      <option value="positivo_derecho">Positivo Derecho (+)</option>
                      <option value="positivo_izquierdo">Positivo Izquierdo (+)</option>
                      <option value="positivo_bilateral">Positivo Bilateral (++)</option>
                      <option value="negativo">Negativo (-)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hallazgo Clínico y Respuesta Sintomática
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe reproducción o alivio del dolor, grados de aparición o respuesta radicular..."
                    value={newTestNotes}
                    onChange={(e) => setNewTestNotes(e.target.value)}
                    className="w-full border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
                >
                  Agregar Prueba al Examen
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
