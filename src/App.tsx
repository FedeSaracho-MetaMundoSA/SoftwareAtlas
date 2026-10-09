import React, { useEffect, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { ConsultationWizard } from './components/ConsultationWizard';
import { FinalReportModal } from './components/FinalReportModal';
import {
  ConsultationsHistoryView,
  DoctorSettingsView,
  PatientsDirectoryView,
  ReportsAnalyticsView,
  SystemArchitectureView,
} from './components/SecondaryViews';
import {
  INITIAL_CONSULTATIONS,
  INITIAL_DOCTOR_PROFILE,
  INITIAL_PATIENTS,
} from './data/wireframeInitialData';
import {
  ConsultationRecord,
  DoctorProfile,
  FollowUpProgressNote,
  MainScreen,
  PatientRecord,
} from './types/wireframeTypes';

const STORAGE_WF_PATIENTS = 'wf_quiropractico_patients_v1';
const STORAGE_WF_CONSULTATIONS = 'wf_quiropractico_consultations_v1';
const STORAGE_WF_DOCTOR = 'wf_quiropractico_doctor_v1';

export default function App() {
  const [screen, setScreen] = useState<MainScreen>('DASHBOARD');

  const [doctor, setDoctor] = useState<DoctorProfile>(() => {
    try {
      const s = localStorage.getItem(STORAGE_WF_DOCTOR);
      if (s) {
        const parsed = JSON.parse(s) as DoctorProfile;
        if (parsed.nombre === 'Dr. Juan García') {
          return INITIAL_DOCTOR_PROFILE;
        }
        return {
          ...INITIAL_DOCTOR_PROFILE,
          ...parsed,
          matriculaProfesional: parsed.matriculaProfesional || 'MP 542',
        };
      }
    } catch {
      // ignore
    }
    return INITIAL_DOCTOR_PROFILE;
  });

  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_WF_PATIENTS);
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_PATIENTS;
  });

  const [consultations, setConsultations] = useState<ConsultationRecord[]>(
    () => {
      try {
        const s = localStorage.getItem(STORAGE_WF_CONSULTATIONS);
        if (s) {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore
      }
      return INITIAL_CONSULTATIONS;
    }
  );

  // Estado para abrir consulta específica o reporte PDF
  const [wizardInitialPatientId, setWizardInitialPatientId] = useState<
    string | undefined
  >(undefined);
  const [editingConsultation, setEditingConsultation] =
    useState<ConsultationRecord | null>(null);
  const [activeReportConsultation, setActiveReportConsultation] =
    useState<ConsultationRecord>(
      () => consultations[0] || INITIAL_CONSULTATIONS[0]
    );
  const [historyFilterPatientId, setHistoryFilterPatientId] = useState<
    string | null
  >(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WF_DOCTOR, JSON.stringify(doctor));
    } catch {
      // ignore
    }
  }, [doctor]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WF_PATIENTS, JSON.stringify(patients));
    } catch {
      // ignore
    }
  }, [patients]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_WF_CONSULTATIONS,
        JSON.stringify(consultations)
      );
    } catch {
      // ignore
    }
  }, [consultations]);

  const handleCreateOrUpdatePatient = (pat: PatientRecord) => {
    setPatients((prev) => {
      const exists = prev.some((p) => p.id === pat.id);
      if (exists) {
        return prev.map((p) => (p.id === pat.id ? pat : p));
      }
      return [pat, ...prev];
    });
  };

  const handleSaveConsultation = (
    record: ConsultationRecord,
    openPdfAfterSave: boolean
  ) => {
    setConsultations((prev) => {
      const exists = prev.some((c) => c.id === record.id);
      if (exists) {
        return prev.map((c) => (c.id === record.id ? record : c));
      }
      return [record, ...prev];
    });

    // Actualizar fecha de última cita del paciente
    setPatients((prev) =>
      prev.map((p) =>
        p.id === record.pacienteId
          ? { ...p, ultimaCita: 'Hoy', estado: 'Tratamiento' }
          : p
      )
    );

    setActiveReportConsultation(record);
    setEditingConsultation(null);

    if (openPdfAfterSave) {
      setScreen('REPORTE_PDF');
    } else {
      setScreen('DASHBOARD');
    }
  };

  const handleAddFollowUpToConsultation = (
    consultationId: string,
    note: FollowUpProgressNote
  ) => {
    setConsultations((prev) =>
      prev.map((c) =>
        c.id === consultationId
          ? {
              ...c,
              estadoConsulta: note.dolorEva <= 4 ? 'Mejorando' : c.estadoConsulta,
              seguimientos: [...c.seguimientos, note],
            }
          : c
      )
    );
  };

  if (screen === 'LOGIN') {
    return (
      <AuthScreen
        doctor={doctor}
        onLoginSuccess={(updatedDoc) => {
          if (updatedDoc) setDoctor(updatedDoc);
          setScreen('DASHBOARD');
        }}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        doctor.darkMode
          ? 'bg-slate-900 text-[#003366]'
          : 'bg-[#F4F6F8] text-[#003366]'
      }`}
    >
      {/* CABECERA PRINCIPAL (Top Bar exacta de PANTALLA 2: DASHBOARD PRINCIPAL) */}
      <header className="bg-white border-b-2 border-[#E0E0E0] px-6 py-4 no-print">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setScreen('DASHBOARD')}
            className="text-lg font-bold tracking-wide text-[#003366] hover:text-[#1a5490] cursor-pointer text-left"
          >
            🏥 SISTEMA QUIROPRÁCTICO
          </button>

          {/* Navegación rápida entre las pantallas del Wireframe */}
          <nav className="hidden md:flex items-center gap-3 text-xs font-bold text-[#003366]">
            <button
              type="button"
              onClick={() => setScreen('DASHBOARD')}
              className={`px-2.5 py-1 transition-colors cursor-pointer ${
                screen === 'DASHBOARD'
                  ? 'bg-[#1a5490] text-white'
                  : 'hover:underline'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                setWizardInitialPatientId(undefined);
                setEditingConsultation(null);
                setScreen('NUEVA_CONSULTA');
              }}
              className={`px-2.5 py-1 transition-colors cursor-pointer ${
                screen === 'NUEVA_CONSULTA'
                  ? 'bg-[#1a5490] text-white'
                  : 'hover:underline'
              }`}
            >
              ➕ Nueva Consulta (Pasos 1-5)
            </button>
            <button
              type="button"
              onClick={() => setScreen('MIS_PACIENTES')}
              className={`px-2.5 py-1 transition-colors cursor-pointer ${
                screen === 'MIS_PACIENTES'
                  ? 'bg-[#1a5490] text-white'
                  : 'hover:underline'
              }`}
            >
              👥 Mis Pacientes
            </button>
            <button
              type="button"
              onClick={() => {
                setHistoryFilterPatientId(null);
                setScreen('MIS_ CONSULTAS');
              }}
              className={`px-2.5 py-1 transition-colors cursor-pointer ${
                screen === 'MIS_ CONSULTAS'
                  ? 'bg-[#1a5490] text-white'
                  : 'hover:underline'
              }`}
            >
              📋 Mis Consultas
            </button>
            <button
              type="button"
              onClick={() => setScreen('REPORTE_PDF')}
              className={`px-2.5 py-1 transition-colors cursor-pointer ${
                screen === 'REPORTE_PDF'
                  ? 'bg-[#1a5490] text-white'
                  : 'hover:underline'
              }`}
            >
              📄 Reporte PDF (P.8)
            </button>
            <button
              type="button"
              onClick={() => setScreen('ARQUITECTURA')}
              className={`px-2.5 py-1 transition-colors cursor-pointer ${
                screen === 'ARQUITECTURA'
                  ? 'bg-[#1a5490] text-white'
                  : 'hover:underline'
              }`}
            >
              🛡️ Seguridad y Backup
            </button>
          </nav>

          {/* Zona Derecha: 👤 Dr. Juan García | 🌙 | ⚙️ Salir */}
          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-[#003366]">
            <button
              type="button"
              onClick={() =>
                setDoctor((prev) => ({ ...prev, darkMode: !prev.darkMode }))
              }
              className="px-2 py-0.5 border border-[#E0E0E0] text-xs hover:border-[#1a5490] cursor-pointer"
              title="Alternar Modo Claro / Oscuro"
            >
              {doctor.darkMode ? '☀️ Claro' : '🌙 Oscuro'}
            </button>
            <button
              type="button"
              onClick={() => setScreen('CONFIGURACION')}
              className="hover:text-[#1a5490] cursor-pointer"
              title="Configuración de Perfil y Clínica"
            >
              👤 {doctor.nombre} ({doctor.matriculaProfesional || 'MP 542'})
            </button>
            <span className="text-[#E0E0E0]">|</span>
            <button
              type="button"
              onClick={() => setScreen('LOGIN')}
              className="hover:text-[#E74C3C] cursor-pointer"
            >
              ⚙️ Salir
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL SEGÚN PANTALLA ACTIVA */}
      <main className="flex-1 p-4 sm:p-6">
        <div
          role="note"
          className="no-print mx-auto mb-4 max-w-5xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <strong>Prototipo local:</strong> los datos se guardan en este navegador sin cifrado ni control de acceso.
          Usá solo datos ficticios; no cargues información real de pacientes.
        </div>
        {/* ===================================================================
            PANTALLA 2: DASHBOARD PRINCIPAL (Médico) - WIREFRAME EXACTO
           =================================================================== */}
        {screen === 'DASHBOARD' && (
          <div className="max-w-4xl mx-auto bg-white border-2 border-[#E0E0E0] shadow-xs">
            {/* Bloque superior: BIENVENIDA y CLÍNICA */}
            <div className="p-6 border-b-2 border-[#E0E0E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold tracking-wider text-[#1a5490]">
                  BIENVENIDA — PROPIETARIO TITULAR ({doctor.matriculaProfesional || 'MP 542'})
                </div>
                <h1 className="text-lg font-bold text-[#003366] mt-0.5">
                  Hola {doctor.nombre} ({doctor.matriculaProfesional || 'MP 542'}), bienvenido
                </h1>
              </div>

              <div className="sm:text-right font-mono text-xs sm:text-sm text-[#003366]">
                <div>
                  <strong>CLÍNICA:</strong> {doctor.clinica}
                </div>
                <div className="text-slate-600 mt-0.5">
                  <strong>Propietario:</strong> {doctor.nombre} —{' '}
                  <strong>{doctor.matriculaProfesional || 'MP 542'}</strong>
                </div>
              </div>
            </div>

            {/* Banner Destacado: Escucha Clínica en Vivo (Cámara + Micrófono + Transcripción + Autocompletado) */}
            <div className="px-6 py-4 bg-[#F0F4F8] border-b-2 border-[#1a5490] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#E74C3C] uppercase tracking-wider">
                  🎙️📹 FUNCIÓN CENTRAL DE CONSULTA EN VIVO
                </div>
                <div className="text-sm font-bold text-[#003366]">
                  Procesador de Charla Clínica en Tiempo Real (Cámara + Micrófono)
                </div>
                <p className="text-xs text-slate-600">
                  Transcribe toda la conversación con el paciente, autocompleta Nombre, Apellido, Edad, Género y Ficha, y genera el Informe Completo firmado por {doctor.nombre} ({doctor.matriculaProfesional || 'MP 542'}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWizardInitialPatientId(undefined);
                  setEditingConsultation(null);
                  setScreen('NUEVA_CONSULTA');
                }}
                className="px-4 py-2.5 bg-[#27AE60] hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer border-2 border-[#003366]"
              >
                [🎙️ INICIAR ESCUCHA Y CONSULTA EN VIVO]
              </button>
            </div>

            {/* Cuerpo del Dashboard: ACCIONES RÁPIDAS + ESTADÍSTICAS HOY (Izquierda) | ÚLTIMOS PACIENTES (Derecha) */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Columna Izquierda (5 cols): ACCIONES RÁPIDAS + ESTADÍSTICAS HOY */}
              <div className="md:col-span-5 space-y-6">
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-[#003366]">
                    ACCIONES RÁPIDAS
                  </h2>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setWizardInitialPatientId(undefined);
                        setEditingConsultation(null);
                        setScreen('NUEVA_CONSULTA');
                      }}
                      className="w-full py-3 px-4 border-2 border-[#1a5490] bg-[#1a5490] hover:bg-[#003366] text-white font-bold text-sm text-left transition-colors cursor-pointer"
                    >
                      ➕ NUEVA CONSULTA
                    </button>

                    <button
                      type="button"
                      onClick={() => setScreen('MIS_PACIENTES')}
                      className="w-full py-3 px-4 border-2 border-[#E0E0E0] bg-white hover:border-[#1a5490] hover:bg-[#F8FAFC] text-[#003366] font-bold text-sm text-left transition-colors cursor-pointer"
                    >
                      👥 MIS PACIENTES
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHistoryFilterPatientId(null);
                        setScreen('MIS_ CONSULTAS');
                      }}
                      className="w-full py-3 px-4 border-2 border-[#E0E0E0] bg-white hover:border-[#1a5490] hover:bg-[#F8FAFC] text-[#003366] font-bold text-sm text-left transition-colors cursor-pointer"
                    >
                      📋 MIS CONSULTAS
                    </button>

                    <button
                      type="button"
                      onClick={() => setScreen('REPORTES')}
                      className="w-full py-3 px-4 border-2 border-[#E0E0E0] bg-white hover:border-[#1a5490] hover:bg-[#F8FAFC] text-[#003366] font-bold text-sm text-left transition-colors cursor-pointer"
                    >
                      📊 REPORTES
                    </button>
                  </div>
                </div>

                {/* ESTADÍSTICAS HOY */}
                <div className="pt-4 border-t-2 border-[#E0E0E0] space-y-2">
                  <h2 className="text-sm font-bold text-[#003366]">
                    ESTADÍSTICAS HOY
                  </h2>
                  <div className="font-mono text-sm text-[#003366] space-y-1 bg-[#F8FAFC] p-3.5 border border-[#E0E0E0]">
                    <div>
                      Consultas: <strong>{consultations.length}</strong>
                    </div>
                    <div>
                      Pacientes nuevos: <strong>1</strong>
                    </div>
                    <div>
                      Pendientes: <strong>2</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha (7 cols): ÚLTIMOS PACIENTES */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#003366]">
                    ÚLTIMOS PACIENTES
                  </h2>
                  <button
                    type="button"
                    onClick={() => setScreen('MIS_PACIENTES')}
                    className="text-xs font-bold text-[#3498DB] hover:underline"
                  >
                    Ver todos ({patients.length}) →
                  </button>
                </div>

                <div className="space-y-3">
                  {patients.map((pat) => (
                    <div
                      key={pat.id}
                      onClick={() => {
                        setHistoryFilterPatientId(pat.id);
                        setScreen('MIS_ CONSULTAS');
                      }}
                      className="border-2 border-[#E0E0E0] bg-white p-4 hover:border-[#1a5490] transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 text-sm text-[#003366]">
                        <div className="font-bold text-base">
                          {pat.nombreCompleto}
                        </div>
                        <div className="font-mono text-xs text-slate-600">
                          Última cita: {pat.ultimaCita}
                        </div>
                        <div className="font-mono text-xs">
                          Estado:{' '}
                          <strong
                            className={
                              pat.estado === 'Mejorando'
                                ? 'text-[#27AE60]'
                                : pat.estado === 'Tratamiento'
                                ? 'text-[#1a5490]'
                                : 'text-[#3498DB]'
                            }
                          >
                            {pat.estado}
                          </strong>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWizardInitialPatientId(pat.id);
                            setEditingConsultation(null);
                            setScreen('NUEVA_CONSULTA');
                          }}
                          className="px-3 py-1.5 bg-[#1a5490] text-white text-xs font-bold hover:bg-[#003366]"
                        >
                          Nueva Consulta
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const found = consultations.find(
                              (c) => c.pacienteId === pat.id
                            );
                            if (found) {
                              setActiveReportConsultation(found);
                              setScreen('REPORTE_PDF');
                            }
                          }}
                          className="px-3 py-1.5 border border-[#E0E0E0] text-[#003366] text-xs font-bold hover:border-[#1a5490]"
                        >
                          Reporte PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PANTALLAS 3, 4, 5, 6 y 7: FLUJO NUEVA CONSULTA (PASOS 1 A 5)
           =================================================================== */}
        {screen === 'NUEVA_CONSULTA' && (
          <ConsultationWizard
            patients={patients}
            initialPatientId={wizardInitialPatientId}
            initialConsultationToEdit={editingConsultation}
            onCreatePatient={handleCreateOrUpdatePatient}
            onSaveConsultation={handleSaveConsultation}
            onCancel={() => {
              setEditingConsultation(null);
              setScreen('DASHBOARD');
            }}
          />
        )}

        {/* ===================================================================
            PANTALLA 8: REPORTE FINAL (PDF Generado)
           =================================================================== */}
        {screen === 'REPORTE_PDF' && (
          <FinalReportModal
            consultation={activeReportConsultation}
            doctor={doctor}
            onClose={() => setScreen('DASHBOARD')}
          />
        )}

        {/* ===================================================================
            FLUJO SECUNDARIO: MIS PACIENTES
           =================================================================== */}
        {screen === 'MIS_PACIENTES' && (
          <PatientsDirectoryView
            patients={patients}
            consultations={consultations}
            onCreateOrUpdatePatient={handleCreateOrUpdatePatient}
            onStartConsultationForPatient={(patId) => {
              setWizardInitialPatientId(patId);
              setEditingConsultation(null);
              setScreen('NUEVA_CONSULTA');
            }}
            onViewPatientHistory={(patId) => {
              setHistoryFilterPatientId(patId);
              setScreen('MIS_ CONSULTAS');
            }}
            onBackToDashboard={() => setScreen('DASHBOARD')}
          />
        )}

        {/* ===================================================================
            FLUJO SECUNDARIO: MIS CONSULTAS (Ver Consultas Pasadas y Seguimiento)
           =================================================================== */}
        {screen === 'MIS_ CONSULTAS' && (
          <ConsultationsHistoryView
            consultations={consultations}
            initialPatientFilterId={historyFilterPatientId}
            onViewReportPdf={(cons) => {
              setActiveReportConsultation(cons);
              setScreen('REPORTE_PDF');
            }}
            onEditConsultationProtocol={(cons) => {
              setEditingConsultation(cons);
              setScreen('NUEVA_CONSULTA');
            }}
            onAddFollowUpToConsultation={handleAddFollowUpToConsultation}
            onBackToDashboard={() => setScreen('DASHBOARD')}
          />
        )}

        {/* ===================================================================
            VISTA: REPORTES Y GRÁFICOS DE EVOLUCIÓN
           =================================================================== */}
        {screen === 'REPORTES' && (
          <ReportsAnalyticsView
            consultations={consultations}
            onOpenReportPdf={(cons) => {
              setActiveReportConsultation(cons);
              setScreen('REPORTE_PDF');
            }}
            onBackToDashboard={() => setScreen('DASHBOARD')}
          />
        )}

        {/* ===================================================================
            VISTA: CONFIGURACIÓN (Perfil Médico, Clínica, 2FA)
           =================================================================== */}
        {screen === 'CONFIGURACION' && (
          <DoctorSettingsView
            doctor={doctor}
            onUpdateDoctor={(updated) => setDoctor(updated)}
            onBackToDashboard={() => setScreen('DASHBOARD')}
          />
        )}

        {/* ===================================================================
            VISTA FASE 6: ARQUITECTURA TÉCNICA, ROLES RBAC, SEGURIDAD Y BACKUP
           =================================================================== */}
        {screen === 'ARQUITECTURA' && (
          <SystemArchitectureView
            patients={patients}
            consultations={consultations}
            doctor={doctor}
            onImportFullBackup={({
              patients: impPatients,
              consultations: impConsultations,
              doctor: impDoctor,
            }) => {
              setPatients(impPatients);
              setConsultations(impConsultations);
              if (impDoctor) setDoctor(impDoctor);
            }}
            onResetDefaultData={() => {
              setPatients(INITIAL_PATIENTS);
              setConsultations(INITIAL_CONSULTATIONS);
              setDoctor(INITIAL_DOCTOR_PROFILE);
            }}
            onBackToDashboard={() => setScreen('DASHBOARD')}
          />
        )}
      </main>
    </div>
  );
}
