import React, { useState } from 'react';
import {
  Edit3,
  FileText,
  Plus,
  Search,
  Settings,
  TrendingUp,
} from 'lucide-react';
import {
  ConsultationRecord,
  DoctorProfile,
  FollowUpProgressNote,
  PatientRecord,
  PatientStatus,
} from '../types/wireframeTypes';

/* ============================================================================
   1. VISTA: MIS PACIENTES (Con Componente Reutilizable CARDS PACIENTE)
   ============================================================================ */
interface PatientsDirectoryViewProps {
  patients: PatientRecord[];
  consultations: ConsultationRecord[];
  onCreateOrUpdatePatient: (pat: PatientRecord) => void;
  onStartConsultationForPatient: (patientId: string) => void;
  onViewPatientHistory: (patientId: string) => void;
  onBackToDashboard: () => void;
}

export const PatientsDirectoryView: React.FC<PatientsDirectoryViewProps> = ({
  patients,
  onCreateOrUpdatePatient,
  onStartConsultationForPatient,
  onViewPatientHistory,
  onBackToDashboard,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  const [formNombre, setFormNombre] = useState('');
  const [formEdad, setFormEdad] = useState(30);
  const [formGenero, setFormGenero] = useState<
    'Masculino' | 'Femenino' | 'No especificado'
  >(
    'No especificado'
  );
  const [formProfesion, setFormProfesion] = useState('');
  const [formCiudad, setFormCiudad] = useState('Salta');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEstado, setFormEstado] = useState<PatientStatus>('Mejorando');
  const [formProximaCita, setFormProximaCita] = useState('Oct 17');

  const openModalForCreate = () => {
    setEditingPatient(null);
    setFormNombre('');
    setFormEdad(30);
    setFormGenero('Masculino');
    setFormProfesion('');
    setFormCiudad('Salta');
    setFormTelefono('');
    setFormEmail('');
    setFormEstado('Evaluación Inicial');
    setFormProximaCita('Oct 24');
    setIsCreating(true);
  };

  const openModalForEdit = (pat: PatientRecord) => {
    setEditingPatient(pat);
    setFormNombre(pat.nombreCompleto);
    setFormEdad(pat.edad);
    setFormGenero(pat.genero);
    setFormProfesion(pat.profesion);
    setFormCiudad(pat.ciudad);
    setFormTelefono(pat.telefono);
    setFormEmail(pat.email);
    setFormEstado(pat.estado);
    setFormProximaCita(pat.proximaCita);
    setIsCreating(true);
  };

  const handleSavePatientForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) return;
    const record: PatientRecord = {
      id: editingPatient ? editingPatient.id : `pat-${Date.now()}`,
      nombre: formNombre.trim().split(' ')[0] || formNombre.trim(),
      apellidos: formNombre.trim().split(' ').slice(1).join(' ') || '',
      nombreCompleto: formNombre.trim(),
      edad: formEdad,
      genero: formGenero,
      profesion: formProfesion.trim() || 'Particular',
      ciudad: formCiudad.trim() || 'Salta',
      telefono: formTelefono.trim(),
      email: formEmail.trim(),
      ultimaCita: editingPatient?.ultimaCita || 'Hoy',
      proximaCita: formProximaCita.trim() || 'Oct 24',
      estado: formEstado,
      horasSedentarioDia: editingPatient?.horasSedentarioDia ?? 8,
      horasComputadoraDia: editingPatient?.horasComputadoraDia ?? 7,
      horasSmartphoneDia: editingPatient?.horasSmartphoneDia ?? 5,
    };
    onCreateOrUpdatePatient(record);
    setIsCreating(false);
  };

  const filtered = patients.filter((p) => {
    const matchText =
      p.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      p.profesion.toLowerCase().includes(search.toLowerCase()) ||
      p.ciudad.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Todos' || p.estado === statusFilter;
    return matchText && matchStatus;
  });

  return (
    <div className="max-w-5xl mx-auto bg-white border-2 border-[#E0E0E0] p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#E0E0E0] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#003366]">
            👥 MIS PACIENTES ({patients.length})
          </h2>
          <p className="text-xs text-slate-500">
            Gestión de pacientes, búsqueda, edición y acceso directo al historial clínico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openModalForCreate}
            className="px-4 py-2 bg-[#27AE60] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ CREAR PACIENTE]</span>
          </button>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-3.5 py-2 border-2 border-[#E0E0E0] text-xs font-bold text-[#003366] hover:border-[#1a5490]"
          >
            &lt; Volver al Dashboard
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, profesión o ciudad..."
            className="w-full border-2 border-[#E0E0E0] pl-9 pr-3 py-2 text-sm text-[#003366]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366] bg-white"
        >
          <option value="Todos">Estado: Todos</option>
          <option value="Mejorando">Estado: Mejorando</option>
          <option value="Tratamiento">Estado: Tratamiento</option>
          <option value="Seguimiento">Estado: Seguimiento</option>
          <option value="Evaluación Inicial">Estado: Evaluación Inicial</option>
        </select>
      </div>

      {/* GRILLA DE CARDS PACIENTE (Estructura exacta de COMPONENTES REUTILIZABLES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((pat) => (
          <div
            key={pat.id}
            className="border-2 border-[#E0E0E0] bg-white p-4 flex flex-col justify-between space-y-3 hover:border-[#1a5490] transition-colors"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#1a5490] text-white font-bold text-xs flex items-center justify-center shrink-0 border border-[#003366]">
                  [FOTO]
                </div>
                <div>
                  <div className="font-bold text-sm text-[#003366]">
                    {pat.nombreCompleto}, {pat.edad} a.
                  </div>
                  <div className="text-xs text-slate-600">
                    {pat.profesion}, {pat.ciudad}
                  </div>
                </div>
              </div>

              <div className="pt-2 text-xs text-[#003366] space-y-1 font-mono">
                <div>Última cita: {pat.ultimaCita}</div>
                <div>
                  Estado:{' '}
                  <strong
                    className={
                      pat.estado === 'Mejorando'
                        ? 'text-[#27AE60]'
                        : 'text-[#1a5490]'
                    }
                  >
                    {pat.estado}
                  </strong>
                </div>
                <div>Próxima: {pat.proximaCita}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E0E0E0] flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onViewPatientHistory(pat.id)}
                className="flex-1 py-1.5 px-2 bg-[#1a5490] hover:bg-[#003366] text-white text-xs font-bold text-center cursor-pointer"
              >
                [VER HISTORIAL]
              </button>
              <button
                type="button"
                onClick={() => openModalForEdit(pat)}
                className="py-1.5 px-2.5 border border-[#E0E0E0] text-xs font-bold text-[#003366] hover:border-[#1a5490]"
                title="Editar Paciente"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onStartConsultationForPatient(pat.id)}
                className="py-1.5 px-2.5 bg-[#27AE60] text-white text-xs font-bold"
                title="Iniciar Nueva Consulta"
              >
                + Consulta
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear / Editar Paciente */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#003366] max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#003366]">
              {editingPatient ? 'EDITAR PACIENTE' : 'CREAR PACIENTE NUEVO'}
            </h3>
            <form onSubmit={handleSavePatientForm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#003366] mb-1">
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#003366] mb-1">
                    Edad:
                  </label>
                  <input
                    type="number"
                    value={formEdad}
                    onChange={(e) => setFormEdad(Number(e.target.value) || 1)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#003366] mb-1">
                    Género:
                  </label>
                  <select
                    value={formGenero}
                    onChange={(e) =>
                      setFormGenero(
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
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#003366] mb-1">
                    Profesión:
                  </label>
                  <input
                    type="text"
                    value={formProfesion}
                    onChange={(e) => setFormProfesion(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#003366] mb-1">
                    Ciudad:
                  </label>
                  <input
                    type="text"
                    value={formCiudad}
                    onChange={(e) => setFormCiudad(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#003366] mb-1">
                    Teléfono (opcional):
                  </label>
                  <input
                    type="tel"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#003366] mb-1">
                    Email (opcional):
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#003366] mb-1">
                    Estado Clínico:
                  </label>
                  <select
                    value={formEstado}
                    onChange={(e) =>
                      setFormEstado(e.target.value as PatientStatus)
                    }
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366] bg-white"
                  >
                    <option value="Mejorando">Mejorando</option>
                    <option value="Tratamiento">Tratamiento</option>
                    <option value="Seguimiento">Seguimiento</option>
                    <option value="Evaluación Inicial">Evaluación Inicial</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#003366] mb-1">
                    Próxima Cita:
                  </label>
                  <input
                    type="text"
                    value={formProximaCita}
                    onChange={(e) => setFormProximaCita(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E0E0E0]">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-[#E0E0E0] text-[#003366] font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a5490] text-white font-bold"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   2. VISTA: MIS CONSULTAS (FLUJO SECUNDARIO: VER CONSULTAS PASADAS)
   ============================================================================ */
interface ConsultationsHistoryViewProps {
  consultations: ConsultationRecord[];
  initialPatientFilterId?: string | null;
  onViewReportPdf: (consultation: ConsultationRecord) => void;
  onEditConsultationProtocol: (consultation: ConsultationRecord) => void;
  onAddFollowUpToConsultation: (
    consultationId: string,
    note: FollowUpProgressNote
  ) => void;
  onBackToDashboard: () => void;
}

export const ConsultationsHistoryView: React.FC<
  ConsultationsHistoryViewProps
> = ({
  consultations,
  initialPatientFilterId,
  onViewReportPdf,
  onEditConsultationProtocol,
  onAddFollowUpToConsultation,
  onBackToDashboard,
}) => {
  const [filterPatient, setFilterPatient] = useState<string>(
    initialPatientFilterId || 'Todos'
  );
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [filterPatologia, setFilterPatologia] = useState<string>('');
  const [filterFecha, setFilterFecha] = useState<string>('');

  const [selectedConsultationId, setSelectedConsultationId] = useState<
    string | null
  >(consultations[0]?.id || null);

  // Modal de Crear Seguimiento
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [segDolor, setSegDolor] = useState(3);
  const [segFlexion, setSegFlexion] = useState(65);
  const [segFuerza, setSegFuerza] = useState('5/5');
  const [segNota, setSegNota] = useState('');
  const [showNextAppointmentBanner, setShowNextAppointmentBanner] =
    useState(false);

  const filteredConsultations = consultations.filter((c) => {
    const matchPat =
      filterPatient === 'Todos' || c.pacienteId === filterPatient;
    const matchEst =
      filterEstado === 'Todos' || c.estadoConsulta === filterEstado;
    const matchPath =
      !filterPatologia.trim() ||
      c.patologiaFiltro
        .toLowerCase()
        .includes(filterPatologia.toLowerCase()) ||
      c.pacienteNombre.toLowerCase().includes(filterPatologia.toLowerCase());
    const matchDate =
      !filterFecha.trim() ||
      c.fechaConsulta.toLowerCase().includes(filterFecha.toLowerCase());
    return matchPat && matchEst && matchPath && matchDate;
  });

  const activeConsultation =
    consultations.find((c) => c.id === selectedConsultationId) ||
    filteredConsultations[0];

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsultation || !segNota.trim()) return;
    const newFollowUp: FollowUpProgressNote = {
      id: `seg-${Date.now()}`,
      fecha: new Date().toISOString().slice(0, 10),
      dolorEva: segDolor,
      flexionGrados: segFlexion,
      fuerzaGluteos: segFuerza,
      notaProgreso: segNota.trim(),
    };
    onAddFollowUpToConsultation(activeConsultation.id, newFollowUp);
    setSegNota('');
    setIsFollowUpModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white border-2 border-[#E0E0E0] p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#E0E0E0] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#003366]">
            📋 MIS CONSULTAS — HISTORIAL Y SEGUIMIENTO CLÍNICO
          </h2>
          <p className="text-xs text-slate-500">
            Flujo secundario: Filtrar por Paciente, Fecha, Estado y Patología · Ver detalles completos y evolución.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-3.5 py-2 border-2 border-[#E0E0E0] text-xs font-bold text-[#003366] hover:border-[#1a5490]"
        >
          &lt; Volver al Dashboard
        </button>
      </div>

      {/* FILTROS DEL FLUJO SECUNDARIO (Paciente, Fecha, Estado, Patología) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-3.5 border border-[#E0E0E0]">
        <div>
          <label className="block text-[11px] font-bold text-[#003366] mb-1">
            Filtrar por Paciente:
          </label>
          <select
            value={filterPatient}
            onChange={(e) => setFilterPatient(e.target.value)}
            className="w-full border border-[#E0E0E0] bg-white px-2.5 py-1.5 text-xs text-[#003366]"
          >
            <option value="Todos">Todos los pacientes</option>
            <option value="pat-juan">Juan García</option>
            <option value="pat-maria">María López</option>
            <option value="pat-carlos">Carlos Mendez</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#003366] mb-1">
            Filtrar por Fecha:
          </label>
          <input
            type="text"
            placeholder="Ej. Octubre / Oct 5..."
            value={filterFecha}
            onChange={(e) => setFilterFecha(e.target.value)}
            className="w-full border border-[#E0E0E0] bg-white px-2.5 py-1.5 text-xs text-[#003366]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#003366] mb-1">
            Filtrar por Estado:
          </label>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full border border-[#E0E0E0] bg-white px-2.5 py-1.5 text-xs text-[#003366]"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Mejorando">Mejorando</option>
            <option value="Tratamiento">Tratamiento</option>
            <option value="Seguimiento">Seguimiento</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#003366] mb-1">
            Filtrar por Patología:
          </label>
          <input
            type="text"
            placeholder="Ej. Lumbar, L4-L5, Escoliosis..."
            value={filterPatologia}
            onChange={(e) => setFilterPatologia(e.target.value)}
            className="w-full border border-[#E0E0E0] bg-white px-2.5 py-1.5 text-xs text-[#003366]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de consultas históricas (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-bold text-[#003366]">
            LISTA DE CONSULTAS HISTÓRICAS ({filteredConsultations.length})
          </div>
          {filteredConsultations.map((c) => {
            const isSelected = activeConsultation?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedConsultationId(c.id)}
                className={`p-3.5 border-2 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-[#1a5490] bg-[#1a5490] text-white'
                    : 'border-[#E0E0E0] bg-white text-[#003366] hover:border-[#1a5490]'
                }`}
              >
                <div className="font-bold text-sm">{c.pacienteNombre}</div>
                <div className="text-xs opacity-90">{c.fechaConsulta}</div>
                <div className="text-xs font-mono mt-1">
                  Estado: {c.estadoConsulta} · {c.patologiaFiltro}
                </div>
              </div>
            );
          })}
        </div>

        {/* VER DETALLES COMPLETOS (8 cols) */}
        {activeConsultation && (
          <div className="lg:col-span-8 border-2 border-[#E0E0E0] p-5 bg-white space-y-5">
            <div className="border-b-2 border-[#E0E0E0] pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#003366]">
                  DETALLES COMPLETOS — {activeConsultation.pacienteNombre.toUpperCase()}
                </h3>
                <span className="text-xs text-slate-500">
                  {activeConsultation.fechaConsulta} · {activeConsultation.pacienteProfesion}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#27AE60]">
                Estado: {activeConsultation.estadoConsulta}
              </span>
            </div>

            {showNextAppointmentBanner && (
              <div className="p-3 bg-sky-50 border border-[#3498DB] text-xs text-[#003366] flex items-center justify-between">
                <span>
                  📅 <strong>Próxima cita programada:</strong>{' '}
                  {activeConsultation.protocolo.proximaCitaFechaHora}
                </span>
                <button
                  type="button"
                  onClick={() => setShowNextAppointmentBanner(false)}
                  className="font-bold"
                >
                  [X]
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#003366]">
              <div className="border border-[#E0E0E0] p-3 bg-[#F8FAFC] space-y-1">
                <div className="font-bold text-[#1a5490]">
                  ├─ Resumen anamnesis:
                </div>
                <p>{activeConsultation.anamnesis.problemaDeHoy}</p>
              </div>

              <div className="border border-[#E0E0E0] p-3 bg-[#F8FAFC] space-y-1">
                <div className="font-bold text-[#1a5490]">
                  ├─ Evaluación física:
                </div>
                <ul className="space-y-0.5">
                  {activeConsultation.evaluacionClinica.notasTiempoReal
                    .slice(0, 4)
                    .map((n, idx) => (
                      <li key={idx}>• {n}</li>
                    ))}
                </ul>
              </div>

              <div className="border border-[#E0E0E0] p-3 bg-[#F8FAFC] space-y-1">
                <div className="font-bold text-[#1a5490]">
                  ├─ Imágenes y análisis:
                </div>
                <p>
                  {activeConsultation.imagenes.estudiosHistorial[0]?.estudio} (
                  {activeConsultation.imagenes.estudiosHistorial[0]?.region}):{' '}
                  {activeConsultation.imagenes.estudiosHistorial[0]?.impresion}
                </p>
              </div>

              <div className="border border-[#E0E0E0] p-3 bg-[#F8FAFC] space-y-1">
                <div className="font-bold text-[#1a5490]">
                  ├─ Protocolo aplicado:
                </div>
                <p className="font-semibold">
                  {activeConsultation.protocolo.diagnosticoPrincipal}
                </p>
                <p>{activeConsultation.protocolo.fase1.ajustes}</p>
              </div>
            </div>

            {/* └─ Progreso del paciente */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#003366]">
                └─ Progreso del paciente ({activeConsultation.seguimientos.length} controles):
              </div>
              <div className="border border-[#E0E0E0] divide-y divide-[#E0E0E0] text-xs">
                {activeConsultation.seguimientos.map((seg) => (
                  <div
                    key={seg.id}
                    className="p-2.5 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#003366]">
                        {seg.fecha}
                      </span>{' '}
                      — {seg.notaProgreso}
                    </div>
                    <div className="font-mono font-bold text-[#27AE60]">
                      Dolor: {seg.dolorEva}/10 · Flexión: {seg.flexionGrados}° · Fuerza: {seg.fuerzaGluteos}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* OPCIONES EXACTAS DEL FLUJO SECUNDARIO */}
            <div className="pt-3 border-t-2 border-[#E0E0E0] flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onViewReportPdf(activeConsultation)}
                className="px-3.5 py-2 bg-[#1a5490] text-white text-xs font-bold cursor-pointer"
              >
                [Ver reporte PDF]
              </button>
              <button
                type="button"
                onClick={() => setIsFollowUpModalOpen(true)}
                className="px-3.5 py-2 bg-[#27AE60] text-white text-xs font-bold cursor-pointer"
              >
                [Crear seguimiento]
              </button>
              <button
                type="button"
                onClick={() => onEditConsultationProtocol(activeConsultation)}
                className="px-3.5 py-2 border-2 border-[#1a5490] text-[#1a5490] text-xs font-bold cursor-pointer"
              >
                [Editar protocolo]
              </button>
              <button
                type="button"
                onClick={() =>
                  setShowNextAppointmentBanner(!showNextAppointmentBanner)
                }
                className="px-3.5 py-2 border-2 border-[#E0E0E0] text-[#003366] text-xs font-bold cursor-pointer"
              >
                [Ver próxima cita]
              </button>
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-3.5 py-2 border-2 border-[#E0E0E0] text-slate-600 text-xs font-bold cursor-pointer"
              >
                [Volver]
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para Crear Seguimiento */}
      {isFollowUpModalOpen && activeConsultation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#003366] max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#003366]">
              CREAR SEGUIMIENTO — {activeConsultation.pacienteNombre}
            </h3>
            <form onSubmit={handleSaveFollowUp} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#003366] mb-1">
                    Dolor (0-10):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={segDolor}
                    onChange={(e) => setSegDolor(Number(e.target.value))}
                    className="w-full border-2 border-[#E0E0E0] px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#003366] mb-1">
                    Flexión (°):
                  </label>
                  <input
                    type="number"
                    value={segFlexion}
                    onChange={(e) => setSegFlexion(Number(e.target.value))}
                    className="w-full border-2 border-[#E0E0E0] px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#003366] mb-1">
                    Fuerza:
                  </label>
                  <input
                    type="text"
                    value={segFuerza}
                    onChange={(e) => setSegFuerza(e.target.value)}
                    className="w-full border-2 border-[#E0E0E0] px-2 py-1.5 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-[#003366] mb-1">
                  Notas de Progreso:
                </label>
                <textarea
                  rows={3}
                  required
                  value={segNota}
                  onChange={(e) => setSegNota(e.target.value)}
                  placeholder="Describe la evolución clínica de la sesión..."
                  className="w-full border-2 border-[#E0E0E0] p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#E0E0E0] font-bold text-[#003366]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#27AE60] text-white font-bold"
                >
                  Guardar Seguimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   3. VISTA: REPORTES Y GRÁFICOS DE EVOLUCIÓN
   ============================================================================ */
interface ReportsAnalyticsViewProps {
  consultations: ConsultationRecord[];
  onOpenReportPdf: (consultation: ConsultationRecord) => void;
  onBackToDashboard: () => void;
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({
  consultations,
  onOpenReportPdf,
  onBackToDashboard,
}) => {
  return (
    <div className="max-w-5xl mx-auto bg-white border-2 border-[#E0E0E0] p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#E0E0E0] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#003366]">
            📊 REPORTES Y GRÁFICOS DE EVOLUCIÓN CLÍNICA
          </h2>
          <p className="text-xs text-slate-500">
            Historial de reportes PDF generados, métricas del consultorio y curva de evolución de pacientes.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-3.5 py-2 border-2 border-[#E0E0E0] text-xs font-bold text-[#003366]"
        >
          &lt; Volver al Dashboard
        </button>
      </div>

      {/* Gráficos de Evolución por Consulta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {consultations.map((c) => (
          <div
            key={c.id}
            className="border-2 border-[#E0E0E0] p-4 bg-[#F8FAFC] space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-2">
              <div>
                <div className="font-bold text-sm text-[#003366] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#27AE60]" />
                  <span>{c.pacienteNombre}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {c.protocolo.diagnosticoPrincipal}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenReportPdf(c)}
                className="px-3 py-1.5 bg-[#1a5490] text-white text-xs font-bold flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>[Ver Reporte PDF]</span>
              </button>
            </div>

            {/* Barras de progreso de Dolor y Movilidad */}
            <div className="space-y-2 text-xs font-mono text-[#003366]">
              {c.seguimientos.map((seg, idx) => (
                <div key={seg.id} className="space-y-1">
                  <div className="flex justify-between">
                    <span>
                      Control #{idx + 1} ({seg.fecha})
                    </span>
                    <span>
                      Dolor: {seg.dolorEva}/10 | Movilidad: {seg.flexionGrados}°
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#ECEFF1] border border-[#E0E0E0] flex">
                    <div
                      style={{
                        width: `${Math.min(100, (seg.flexionGrados / 90) * 100)}%`,
                      }}
                      className="h-full bg-[#27AE60]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
   4. VISTA: CONFIGURACIÓN (Perfil Médico, Clínica, Contraseña y 2FA)
   ============================================================================ */
interface DoctorSettingsViewProps {
  doctor: DoctorProfile;
  onUpdateDoctor: (updated: DoctorProfile) => void;
  onBackToDashboard: () => void;
}

export const DoctorSettingsView: React.FC<DoctorSettingsViewProps> = ({
  doctor,
  onUpdateDoctor,
  onBackToDashboard,
}) => {
  const [nombre, setNombre] = useState(doctor.nombre);
  const [clinica, setClinica] = useState(doctor.clinica);
  const [email, setEmail] = useState(doctor.email);
  const [telefono, setTelefono] = useState(doctor.telefono);
  const [twoFA, setTwoFA] = useState(doctor.twoFactorEnabled);
  const [darkMode, setDarkMode] = useState(Boolean(doctor.darkMode));
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDoctor({
      ...doctor,
      nombre,
      clinica,
      email,
      telefono,
      twoFactorEnabled: twoFA,
      darkMode,
    });
    setSavedNotice(true);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white border-2 border-[#E0E0E0] p-6 space-y-6">
      <div className="flex items-center justify-between border-b-2 border-[#E0E0E0] pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#1a5490]" />
          <h2 className="text-lg font-bold text-[#003366]">
            CONFIGURACIÓN DE PERFIL MÉDICO Y CLÍNICA
          </h2>
        </div>
        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-3.5 py-2 border-2 border-[#E0E0E0] text-xs font-bold text-[#003366]"
        >
          &lt; Volver al Dashboard
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-[#27AE60] text-xs font-bold text-[#27AE60]">
          ✓ Configuración de perfil médico y clínica actualizada correctamente.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-sm text-[#003366]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1">
              Nombre del Médico:
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border-2 border-[#E0E0E0] px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">
              Nombre de la Clínica:
            </label>
            <input
              type="text"
              value={clinica}
              onChange={(e) => setClinica(e.target.value)}
              className="w-full border-2 border-[#E0E0E0] px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">
              Email Profesional:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-[#E0E0E0] px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">
              Teléfono / Emergencias:
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full border-2 border-[#E0E0E0] px-3 py-2 font-mono"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#E0E0E0] space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={twoFA}
              onChange={(e) => setTwoFA(e.target.checked)}
              className="w-4 h-4 accent-[#1a5490]"
            />
            <span>
              Requerir autenticación en dos factores (2FA) al iniciar sesión
            </span>
          </label>

          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              className="w-4 h-4 accent-[#1a5490]"
            />
            <span>
              Activar Modo Oscuro (Dark Mode opcional para sesiones largas)
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-[#1a5490] text-white font-bold text-xs cursor-pointer"
        >
          [GUARDAR CONFIGURACIÓN]
        </button>
      </form>
    </div>
  );
};

/* ============================================================================
   5. VISTA: FASE 6 — ARQUITECTURA TÉCNICA, SEGURIDAD HIPAA, ROLES Y BACKUP
   ============================================================================ */
interface SystemArchitectureViewProps {
  patients: PatientRecord[];
  consultations: ConsultationRecord[];
  doctor: DoctorProfile;
  onImportFullBackup: (data: {
    patients: PatientRecord[];
    consultations: ConsultationRecord[];
    doctor?: DoctorProfile;
  }) => void;
  onResetDefaultData: () => void;
  onBackToDashboard: () => void;
}

export const SystemArchitectureView: React.FC<SystemArchitectureViewProps> = ({
  patients,
  consultations,
  doctor,
  onImportFullBackup,
  onResetDefaultData,
  onBackToDashboard,
}) => {
  const [activeRole, setActiveRole] = useState<
    'MEDICO' | 'ASISTENTE' | 'PACIENTE' | 'ADMIN'
  >('MEDICO');
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  const handleExportBackupJson = () => {
    const payload = {
      sistema: 'ATLAS Columna Vertebral — Sistema Quiropráctico Profesional',
      version: '1.0.0-offline-first',
      fechaRespaldo: new Date().toISOString(),
      doctor,
      patients,
      consultations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo-quiropractico-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupNotice(
      '✓ Copia de seguridad local (.JSON) exportada y descargada correctamente.'
    );
  };

  const handleImportBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (
          Array.isArray(parsed.patients) &&
          Array.isArray(parsed.consultations)
        ) {
          onImportFullBackup({
            patients: parsed.patients,
            consultations: parsed.consultations,
            doctor: parsed.doctor,
          });
          setBackupNotice(
            `✓ Respaldo importado con éxito (${parsed.patients.length} pacientes y ${parsed.consultations.length} consultas).`
          );
        } else {
          setBackupNotice('⚠️ El archivo JSON no tiene el formato esperado.');
        }
      } catch {
        setBackupNotice('⚠️ Error al leer el archivo de respaldo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white border-2 border-[#E0E0E0] p-6 space-y-6 text-[#003366]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#E0E0E0] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#003366]">
            🛡️ FASE 6: ARQUITECTURA TÉCNICA, SEGURIDAD Y GOBERNANZA CLÍNICA
          </h2>
          <p className="text-xs text-slate-500">
            Control de acceso por rol (RBAC), cumplimiento HIPAA/GDPR, estrategia Offline-First y copias de seguridad.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-3.5 py-2 border-2 border-[#E0E0E0] text-xs font-bold text-[#003366] hover:border-[#1a5490]"
        >
          &lt; Volver al Dashboard
        </button>
      </div>

      {backupNotice && (
        <div className="p-3 bg-emerald-50 border border-[#27AE60] text-xs font-bold text-[#27AE60]">
          {backupNotice}
        </div>
      )}

      {/* 6.3 Control de Acceso por Rol (RBAC) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#003366]">
          6.3 MATRIZ DE ACCESO POR ROL (RBAC)
        </h3>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['MEDICO', '👨‍⚕️ Médico Quiropráctico'],
              ['ASISTENTE', '🧑‍💼 Asistente Clínico'],
              ['PACIENTE', '🙋 Paciente (Portal Lectura)'],
              ['ADMIN', '🔐 Administrador / Auditor'],
            ] as ['MEDICO' | 'ASISTENTE' | 'PACIENTE' | 'ADMIN', string][]
          ).map(([roleKey, roleLabel]) => (
            <button
              key={roleKey}
              type="button"
              onClick={() => setActiveRole(roleKey)}
              className={`px-3.5 py-2 border-2 text-xs font-bold cursor-pointer ${
                activeRole === roleKey
                  ? 'bg-[#1a5490] text-white border-[#1a5490]'
                  : 'bg-white text-[#003366] border-[#E0E0E0]'
              }`}
            >
              {roleLabel}
            </button>
          ))}
        </div>

        <div className="border-2 border-[#E0E0E0] p-4 bg-[#F8FAFC] text-xs space-y-2 font-mono">
          {activeRole === 'MEDICO' && (
            <>
              <div className="font-bold text-[#27AE60]">
                ROL ACTIVO: MÉDICO QUIROPRÁCTICO (Acceso Total Clínico)
              </div>
              <div>
                • Permisos: Crear/editar pacientes, grabar evaluación multimedia, analizar DICOM, editar diagnóstico diferencial, firmar protocolo y emitir doble reporte (5.1 Paciente + 5.2 Médico).
              </div>
            </>
          )}
          {activeRole === 'ASISTENTE' && (
            <>
              <div className="font-bold text-[#1a5490]">
                ROL ACTIVO: ASISTENTE CLÍNICO (Admisión y Carga Inicial)
              </div>
              <div>
                • Permisos: Crear fichas demográficas (Paso 1), registrar datos de contexto de vida (Paso 2) y agendar próximas citas. Sin firma de diagnóstico ni modificación de protocolo médico.
              </div>
            </>
          )}
          {activeRole === 'PACIENTE' && (
            <>
              <div className="font-bold text-[#3498DB]">
                ROL ACTIVO: PACIENTE (Acceso Exclusivo a su Reporte 5.1)
              </div>
              <div>
                • Permisos: Visualizar y descargar su Reporte Comprensible (Pantalla 8), guía de ejercicios en casa (Glute Bridge, Bird Dog, Cat-Cow) y recomendaciones de ergonomía.
              </div>
            </>
          )}
          {activeRole === 'ADMIN' && (
            <>
              <div className="font-bold text-[#003366]">
                ROL ACTIVO: ADMINISTRADOR DE SISTEMA (Seguridad, Logs y Backups)
              </div>
              <div>
                • Permisos: Gestión de copias de seguridad encriptadas, auditoría de accesos (quién, cuándo, qué), configuración de 2FA y estado de almacenamiento local/nube.
              </div>
            </>
          )}
        </div>
      </div>

      {/* 6.1 y 6.3 Arquitectura y Seguridad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-[#E0E0E0] p-4 space-y-2 text-xs">
          <div className="font-bold text-sm text-[#003366]">
            6.1 COMPONENTES DEL SISTEMA Y ALMACENAMIENTO
          </div>
          <ul className="space-y-1.5 text-slate-700">
            <li>
              • <strong>Base de Datos Local (Offline-First):</strong>{' '}
              Persistencia inmediata en cliente ({patients.length} pacientes y{' '}
              {consultations.length} consultas activas).
            </li>
            <li>
              • <strong>Visor de Imágenes Médicas:</strong> Soporte para
              radiografías, RMN y anotaciones vectoriales (lápiz y regla en mm/grados).
            </li>
            <li>
              • <strong>Motor de Evaluación Clínica:</strong> Correlación
              automática Anamnesis + Eje Cadera + Imágenes → Protocolo en 4 fases.
            </li>
            <li>
              • <strong>Generador de Documentación:</strong> Exportación PDF /
              Impresión directa A4 sin elementos de navegación.
            </li>
          </ul>
        </div>

        <div className="border-2 border-[#E0E0E0] p-4 space-y-2 text-xs">
          <div className="font-bold text-sm text-[#003366]">
            6.3 SEGURIDAD, ENCRIPTACIÓN Y CUMPLIMIENTO HIPAA
          </div>
          <ul className="space-y-1.5 text-slate-700">
            <li>
              • <strong>Encriptación &amp; Privacidad:</strong> Datos clínicos
              sensibles protegidos bajo estándares de confidencialidad médica.
            </li>
            <li>
              • <strong>Autenticación:</strong> Login profesional con soporte
              para verificación en dos pasos (2FA:{' '}
              {doctor.twoFactorEnabled ? 'ACTIVO ✓' : 'Opcional'}).
            </li>
            <li>
              • <strong>Auditoría de Accesos:</strong> Trazabilidad automática
              de creación y edición de consultas y protocolos.
            </li>
            <li>
              • <strong>Backup y Recuperación:</strong> Exportación e
              importación instantánea en formato estructurado JSON.
            </li>
          </ul>
        </div>
      </div>

      {/* Respaldo y Restauración Offline-First */}
      <div className="border-2 border-[#1a5490] bg-[#F8FAFC] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-bold text-[#003366]">
            💾 COPIA DE SEGURIDAD Y RECUPERACIÓN DE DESASTRES (OFFLINE-FIRST)
          </div>
          <p className="text-xs text-slate-600">
            Descarga todos los pacientes, consultas, estudios y protocolos en un archivo local o restaura un respaldo previo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportBackupJson}
            className="px-4 py-2 bg-[#1a5490] text-white text-xs font-bold cursor-pointer"
          >
            [⬇ EXPORTAR BACKUP JSON]
          </button>

          <label className="px-4 py-2 bg-[#27AE60] text-white text-xs font-bold cursor-pointer">
            <span>[⬆ IMPORTAR BACKUP JSON]</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportBackupJson}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              onResetDefaultData();
              setBackupNotice(
                '✓ Datos de demostración originales restaurados correctamente.'
              );
            }}
            className="px-3 py-2 border border-[#E74C3C] text-[#E74C3C] text-xs font-bold cursor-pointer"
          >
            [Restaurar Demo]
          </button>
        </div>
      </div>
    </div>
  );
};
