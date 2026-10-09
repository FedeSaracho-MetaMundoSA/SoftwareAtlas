import React, { useState } from 'react';
import {
  Download,
  FileText,
  Mail,
  Printer,
  Share2,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  ConsultationRecord,
  DoctorProfile,
} from '../types/wireframeTypes';

interface FinalReportModalProps {
  consultation: ConsultationRecord;
  doctor: DoctorProfile;
  onClose: () => void;
}

export const FinalReportModal: React.FC<FinalReportModalProps> = ({
  consultation,
  doctor,
  onClose,
}) => {
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [reportMode, setReportMode] = useState<'PACIENTE' | 'MEDICO' | 'AMBOS'>(
    'PACIENTE'
  );

  const activeStudy =
    consultation.imagenes.estudiosHistorial.find(
      (s) => s.id === consultation.imagenes.estudioSeleccionadoId
    ) || consultation.imagenes.estudiosHistorial[0];

  const handlePrintOrDownload = () => {
    setActionStatus(
      'En el diálogo de impresión, elegí «Guardar como PDF» para descargar una copia.'
    );
    window.print();
  };

  const ddVisual = consultation.imagenes.diagnosticoDiferencialVisual;
  const ejeCadera = consultation.evaluacionClinica.maniobrasEjeCadera;
  const psicologia = consultation.evaluacionClinica.pruebaPsicologica;
  const razonamiento = consultation.protocolo.razonamientoMedico;
  const progresoSemanas = consultation.protocolo.signosProgresoSemanas;

  return (
    <div className="max-w-4xl mx-auto bg-white border-2 border-[#003366] shadow-sm my-4">
      {/* BARRA SUPERIOR DEL REPORTE (PANTALLA 8 + SELECTOR FASE 5: PACIENTE / MÉDICO) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[#003366] text-white no-print">
        <div className="font-bold text-sm sm:text-base tracking-wide">
          📄 REPORTE PROFESIONAL - {consultation.pacienteNombre.toUpperCase()}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrintOrDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#27AE60] hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>[Guardar como PDF]</span>
          </button>
          <button
            type="button"
            onClick={handlePrintOrDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a5490] hover:bg-sky-800 text-white text-xs font-bold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>[Imprimir]</span>
          </button>
          <button
            type="button"
            disabled
            title="Requiere configurar un servicio de correo en el servidor"
            className="inline-flex cursor-not-allowed items-center gap-1.5 bg-slate-500 px-3 py-1.5 text-xs font-bold text-white opacity-70"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>[Email no configurado]</span>
          </button>
          <button
            type="button"
            disabled
            title="Los enlaces seguros requieren autenticación y almacenamiento protegidos"
            className="inline-flex cursor-not-allowed items-center gap-1.5 border border-white/40 px-3 py-1.5 text-xs font-bold text-white opacity-60"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>[Compartir no configurado]</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 bg-[#E74C3C] text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
            title="Cerrar y volver"
          >
            [X]
          </button>
        </div>
      </div>

      {/* Selector Fase 5: 5.1 Reporte para Paciente vs 5.2 Reporte Técnico para Médico */}
      <div className="px-6 py-3 bg-[#F8FAFC] border-b-2 border-[#E0E0E0] flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="text-xs font-bold text-[#003366]">
          FASE 5 — MODALIDAD DE DOCUMENTACIÓN CLÍNICA:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setReportMode('PACIENTE')}
            className={`px-3 py-1.5 text-xs font-bold border-2 flex items-center gap-1.5 cursor-pointer ${
              reportMode === 'PACIENTE'
                ? 'bg-[#1a5490] text-white border-[#1a5490]'
                : 'bg-white text-[#003366] border-[#E0E0E0]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>5.1 Reporte Paciente (Wireframe P.8)</span>
          </button>
          <button
            type="button"
            onClick={() => setReportMode('MEDICO')}
            className={`px-3 py-1.5 text-xs font-bold border-2 flex items-center gap-1.5 cursor-pointer ${
              reportMode === 'MEDICO'
                ? 'bg-[#1a5490] text-white border-[#1a5490]'
                : 'bg-white text-[#003366] border-[#E0E0E0]'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>5.2 Reporte Técnico Médico</span>
          </button>
          <button
            type="button"
            onClick={() => setReportMode('AMBOS')}
            className={`px-3 py-1.5 text-xs font-bold border-2 cursor-pointer ${
              reportMode === 'AMBOS'
                ? 'bg-[#27AE60] text-white border-[#27AE60]'
                : 'bg-white text-[#003366] border-[#E0E0E0]'
            }`}
          >
            <span>Ver Ambos (Expediente Completo)</span>
          </button>
        </div>
      </div>

      {actionStatus && (
        <div
          role="status"
          className="flex items-center justify-between border-b border-sky-300 bg-sky-50 px-6 py-2.5 text-xs font-bold text-sky-900 no-print"
        >
          <span>{actionStatus}</span>
          <button
            type="button"
            onClick={() => setActionStatus(null)}
            className="text-[#003366]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* CUERPO DEL DOCUMENTO */}
      <div className="p-8 space-y-6 text-[#003366]">
        {/* Encabezado de Clínica */}
        <div className="text-center border-b-2 border-[#E0E0E0] pb-5">
          <h1 className="text-xl font-bold tracking-wide text-[#003366]">
            🏥 {doctor.clinica.toUpperCase()}
          </h1>
          <div className="text-xs font-mono font-bold text-[#003366] mt-1">
            PROPIETARIO Y DIRECTOR CLÍNICO: {doctor.nombre.toUpperCase()} —{' '}
            {doctor.matriculaProfesional || 'MP 542'}
          </div>
          <div className="text-sm font-bold text-[#1a5490] mt-1">
            EVALUACIÓN QUIROPRÁCTICA INTEGRAL (PERFIL:{' '}
            {consultation.perfilGrupo || 'ADULTO'})
          </div>

          <div className="mt-4 text-left max-w-xl mx-auto bg-[#F8FAFC] border border-[#E0E0E0] p-4 text-xs sm:text-sm font-mono space-y-1">
            <div>
              <strong>PACIENTE:</strong> {consultation.pacienteNombre}
            </div>
            <div>
              <strong>EDAD:</strong> {consultation.pacienteEdad} años |{' '}
              <strong>GÉNERO:</strong> {consultation.pacienteGenero}
            </div>
            <div>
              <strong>PROFESIÓN:</strong> {consultation.anamnesis.profesion} (
              {consultation.anamnesis.ciudad})
            </div>
            <div>
              <strong>FECHA:</strong> {consultation.fechaConsulta}
            </div>
          </div>
        </div>

        {/* ===================================================================
            SECCIÓN 5.1: REPORTE PARA EL PACIENTE (PANTALLA 8 EXACTA)
           =================================================================== */}
        {(reportMode === 'PACIENTE' || reportMode === 'AMBOS') && (
          <div className="space-y-6">
            {/* 📋 RESUMEN CLÍNICO */}
            <section className="border-b-2 border-[#E0E0E0] pb-5 space-y-2">
              <h2 className="text-sm font-bold text-[#003366]">
                📋 RESUMEN CLÍNICO
              </h2>
              <p className="text-sm leading-relaxed text-slate-800">
                Se evalúa paciente {consultation.pacienteGenero.toLowerCase()}{' '}
                de {consultation.pacienteEdad} años (
                {consultation.anamnesis.profesion}) con cuadro de:{' '}
                {consultation.anamnesis.problemaDeHoy} Contexto diario:{' '}
                {consultation.anamnesis.horasSedentarioDia}h sedentario/día,{' '}
                {consultation.anamnesis.horasComputadoraDia}h frente a
                computadora y {consultation.anamnesis.horasSmartphoneDia}h en
                smartphone.
              </p>
              {consultation.diccionarioCliente &&
                consultation.diccionarioCliente.length > 0 && (
                  <div className="text-xs font-mono bg-[#F8FAFC] p-2.5 border border-[#E0E0E0] text-[#003366]">
                    <strong>Expresiones clave del paciente:</strong>{' '}
                    {consultation.diccionarioCliente.map((d) => `"${d}"`).join(' · ')}
                  </div>
                )}
            </section>

            {/* 🔍 HALLAZGOS PRINCIPALES */}
            <section className="border-b-2 border-[#E0E0E0] pb-5 space-y-3">
              <h2 className="text-sm font-bold text-[#003366]">
                🔍 HALLAZGOS PRINCIPALES
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="font-bold text-xs text-[#1a5490] mb-1.5">
                    EXAMEN FÍSICO Y EJE CADERA:
                  </div>
                  <ul className="space-y-1 text-xs sm:text-sm text-slate-800">
                    {consultation.evaluacionClinica.notasTiempoReal.map(
                      (n, i) => (
                        <li key={i}>• {n}</li>
                      )
                    )}
                  </ul>
                  {ejeCadera && (
                    <div className="mt-2 p-2 bg-[#F8FAFC] border border-[#E0E0E0] text-xs text-[#003366]">
                      <strong>Eje Cadera:</strong>{' '}
                      {ejeCadera.ejeCaderaCentroGravedad}
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-bold text-xs text-[#1a5490] mb-1.5">
                    IMÁGENES ({activeStudy?.estudio || 'Radiografía'} —{' '}
                    {activeStudy?.region || 'Columna'}):
                  </div>
                  <ul className="space-y-1 text-xs sm:text-sm text-slate-800">
                    {activeStudy?.hallazgos
                      .filter((h) => h.activo)
                      .map((h, i) => (
                        <li key={i}>• {h.texto}</li>
                      ))}
                    <li>• {activeStudy?.impresion}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 💊 DIAGNÓSTICO */}
            <section className="border-b-2 border-[#E0E0E0] pb-5 space-y-3">
              <h2 className="text-sm font-bold text-[#003366]">
                💊 DIAGNÓSTICO
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-bold text-xs text-[#1a5490] block">
                    DIAGNÓSTICO PRINCIPAL:
                  </span>
                  <span className="font-semibold text-[#003366]">
                    {consultation.protocolo.diagnosticoPrincipal} —{' '}
                    {consultation.protocolo.diagnosticoSecundario}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-xs text-[#1a5490] block">
                    ETIOLOGÍA:
                  </span>
                  <span className="text-slate-800">
                    {consultation.protocolo.etiologia}
                  </span>
                </div>
              </div>
            </section>

            {/* 📅 PLAN DE TRATAMIENTO (FASES 1 A 4) */}
            <section className="border-b-2 border-[#E0E0E0] pb-5 space-y-3">
              <h2 className="text-sm font-bold text-[#003366]">
                📅 PLAN DE TRATAMIENTO PERSONALIZADO
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="border border-[#E0E0E0] p-3.5 bg-[#F8FAFC] space-y-1">
                  <div className="font-bold text-[#003366]">
                    {consultation.protocolo.fase1.titulo}
                  </div>
                  <div>• Ajustes: {consultation.protocolo.fase1.ajustes}</div>
                  <div>
                    • Terapia: {consultation.protocolo.fase1.complementos}
                  </div>
                  <div>
                    • Restricciones: {consultation.protocolo.fase1.restriccion}
                  </div>
                </div>

                <div className="border border-[#E0E0E0] p-3.5 bg-[#F8FAFC] space-y-1">
                  <div className="font-bold text-[#003366]">
                    {consultation.protocolo.fase2.titulo}
                  </div>
                  <div>• Ajustes: {consultation.protocolo.fase2.ajustes}</div>
                  <div>
                    • Ejercicios: {consultation.protocolo.fase2.ejercicios}
                  </div>
                  <div>
                    • Ergonomía: {consultation.protocolo.fase2.ergonomia}
                  </div>
                </div>

                <div className="border border-[#E0E0E0] p-3.5 bg-[#F8FAFC] space-y-1">
                  <div className="font-bold text-[#003366]">
                    {consultation.protocolo.fase3.titulo}
                  </div>
                  <div>• Ajustes: {consultation.protocolo.fase3.ajustes}</div>
                  <div>
                    • Ejercicios en casa:{' '}
                    {consultation.protocolo.fase3.ejerciciosCasa}
                  </div>
                  <div>• Hábitos: {consultation.protocolo.fase3.educacion}</div>
                </div>

                {consultation.protocolo.fase4 && (
                  <div className="border border-[#E0E0E0] p-3.5 bg-[#F8FAFC] space-y-1">
                    <div className="font-bold text-[#003366]">
                      {consultation.protocolo.fase4.titulo}
                    </div>
                    <div>
                      • Optimización:{' '}
                      {consultation.protocolo.fase4.optimizacionRendimiento}
                    </div>
                    <div>
                      • Control Neuromuscular:{' '}
                      {consultation.protocolo.fase4.integracionNeuromuscular}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 🎯 OBJETIVOS TERAPÉUTICOS */}
            <section className="border-b-2 border-[#E0E0E0] pb-5 space-y-3">
              <h2 className="text-sm font-bold text-[#003366]">
                🎯 OBJETIVOS TERAPÉUTICOS Y SIGNOS DE PROGRESO
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div>
                  <div className="font-bold text-[#1a5490] mb-1">
                    CORTO PLAZO (4-6 semanas):
                  </div>
                  <ul className="space-y-1">
                    {consultation.protocolo.objetivosCortoPlazo.map((o, i) => (
                      <li key={i} className="text-[#27AE60] font-medium">
                        ✓ <span className="text-slate-800">{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="font-bold text-[#1a5490] mb-1">
                    MEDIANO PLAZO (8-12 semanas):
                  </div>
                  <ul className="space-y-1">
                    {consultation.protocolo.objetivosMedianoPlazo.map(
                      (o, i) => (
                        <li key={i} className="text-[#27AE60] font-medium">
                          ✓ <span className="text-slate-800">{o}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <div className="font-bold text-[#1a5490] mb-1">
                    LARGO PLAZO (3-6 meses):
                  </div>
                  <ul className="space-y-1">
                    {consultation.protocolo.objetivosLargoPlazo.map((o, i) => (
                      <li key={i} className="text-[#27AE60] font-medium">
                        ✓ <span className="text-slate-800">{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {progresoSemanas && (
                <div className="mt-3 pt-3 border-t border-[#E0E0E0] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F8FAFC] p-3">
                  <div>
                    <strong className="text-[#1a5490]">Semana 1-2:</strong>{' '}
                    {progresoSemanas.semana1a2}
                  </div>
                  <div>
                    <strong className="text-[#1a5490]">Semana 3-4:</strong>{' '}
                    {progresoSemanas.semana3a4}
                  </div>
                  <div>
                    <strong className="text-[#1a5490]">Semana 5-8:</strong>{' '}
                    {progresoSemanas.semana5a8}
                  </div>
                  <div>
                    <strong className="text-[#1a5490]">Semana 9-12:</strong>{' '}
                    {progresoSemanas.semana9a12}
                  </div>
                </div>
              )}
            </section>

            {/* 💪 EJERCICIOS EN CASA (5-7 min, 3x/semana) */}
            <section className="border-b-2 border-[#E0E0E0] pb-5 space-y-4">
              <h2 className="text-sm font-bold text-[#003366]">
                💪 EJERCICIOS EN CASA (5-7 min, 3x/semana)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. GLUTE BRIDGE */}
                <div className="border border-[#E0E0E0] p-3.5 space-y-2 bg-white">
                  <div className="font-bold text-[#003366]">
                    1. GLUTE BRIDGE (Fortalecimiento)
                  </div>
                  <div className="h-24 bg-[#F8FAFC] border border-[#E0E0E0] flex flex-col items-center justify-center p-2 text-center">
                    <svg
                      viewBox="0 0 120 50"
                      className="w-28 h-12 stroke-[#1a5490]"
                      fill="none"
                      strokeWidth="2.5"
                    >
                      <line
                        x1="10"
                        y1="42"
                        x2="110"
                        y2="42"
                        stroke="#CBD5E1"
                        strokeWidth="1.5"
                      />
                      <circle cx="24" cy="36" r="5" />
                      <polyline points="30,38 62,20 82,38 95,40" />
                      <line x1="62" y1="20" x2="82" y2="40" />
                    </svg>
                    <span className="text-[10px] font-mono text-[#1a5490]">
                      [FOTO: Posición correcta — Puente Glúteo]
                    </span>
                  </div>
                  <ul className="space-y-1 text-slate-700">
                    <li>• Acostado boca arriba, rodillas flexionadas</li>
                    <li>• Levanta cadera hasta formar línea recta</li>
                    <li>• Mantén 2 segundos, 15 repeticiones, 3 series</li>
                  </ul>
                </div>

                {/* 2. BIRD DOG */}
                <div className="border border-[#E0E0E0] p-3.5 space-y-2 bg-white">
                  <div className="font-bold text-[#003366]">
                    2. BIRD DOG (Core + estabilización)
                  </div>
                  <div className="h-24 bg-[#F8FAFC] border border-[#E0E0E0] flex flex-col items-center justify-center p-2 text-center">
                    <svg
                      viewBox="0 0 120 50"
                      className="w-28 h-12 stroke-[#1a5490]"
                      fill="none"
                      strokeWidth="2.5"
                    >
                      <line
                        x1="10"
                        y1="42"
                        x2="110"
                        y2="42"
                        stroke="#CBD5E1"
                        strokeWidth="1.5"
                      />
                      <circle cx="82" cy="18" r="4.5" />
                      <line x1="18" y1="22" x2="105" y2="22" />
                      <line x1="45" y1="22" x2="45" y2="42" />
                      <line x1="75" y1="22" x2="75" y2="42" />
                    </svg>
                    <span className="text-[10px] font-mono text-[#1a5490]">
                      [FOTO: Posición correcta — Cuadrupedia]
                    </span>
                  </div>
                  <ul className="space-y-1 text-slate-700">
                    <li>• Cuatro puntos de apoyo</li>
                    <li>• Extiende brazo derecho + pierna izquierda</li>
                    <li>• Alternancia, 10 repeticiones c/lado, 3 series</li>
                  </ul>
                </div>

                {/* 3. CAT-COW */}
                <div className="border border-[#E0E0E0] p-3.5 space-y-2 bg-white">
                  <div className="font-bold text-[#003366]">
                    3. CAT-COW (Movilidad de columna)
                  </div>
                  <div className="h-24 bg-[#F8FAFC] border border-[#E0E0E0] flex flex-col items-center justify-center p-2 text-center">
                    <svg
                      viewBox="0 0 120 50"
                      className="w-28 h-12 stroke-[#1a5490]"
                      fill="none"
                      strokeWidth="2.5"
                    >
                      <line
                        x1="10"
                        y1="42"
                        x2="110"
                        y2="42"
                        stroke="#CBD5E1"
                        strokeWidth="1.5"
                      />
                      <circle cx="86" cy="24" r="4.5" />
                      <path d="M 38 26 Q 60 10 80 26" />
                      <line x1="40" y1="26" x2="40" y2="42" />
                      <line x1="78" y1="26" x2="78" y2="42" />
                    </svg>
                    <span className="text-[10px] font-mono text-[#1a5490]">
                      [FOTO: Posición correcta — Gato-Camello]
                    </span>
                  </div>
                  <ul className="space-y-1 text-slate-700">
                    <li>• Cuatro puntos, arquea y redondea columna</li>
                    <li>• Movimiento fluido acompañado de respiración</li>
                    <li>• 10 repeticiones, 3 series</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 🏢 RECOMENDACIONES DE VIDA DIARIA */}
            <section className="border-b-2 border-[#E0E0E0] pb-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div>
                <h2 className="font-bold text-[#003366] mb-2">
                  🏢 RECOMENDACIONES DE VIDA DIARIA — ERGONOMÍA (
                  {consultation.perfilGrupo === 'NIÑO'
                    ? 'ESCUELA Y MOCHILA'
                    : consultation.perfilGrupo === 'MUJER_ADULTA'
                    ? 'TRABAJO Y HOGAR'
                    : 'OFICINA Y PANTALLAS'}
                  ):
                </h2>
                {consultation.perfilGrupo === 'NIÑO' ? (
                  <ul className="space-y-1 text-slate-800">
                    <li>
                      • Mochila escolar: Máximo 10% del peso corporal con dos
                      correas acolchadas
                    </li>
                    <li>
                      • Pantallas / Celular: A nivel de los ojos (30 cm), regla
                      20-20-20
                    </li>
                    <li>
                      • Pupitre: Pies apoyados y espalda recta sin inclinación
                      lateral
                    </li>
                    <li>• Deporte formativo y pausas activas cada 45 min</li>
                  </ul>
                ) : (
                  <ul className="space-y-1 text-slate-800">
                    <li>• Altura silla: Muslos paralelos al piso</li>
                    <li>
                      • Pantalla: A nivel de ojos, 70-80 cm de distancia
                    </li>
                    <li>• Respaldo: Con soporte lumbar (usar cojín)</li>
                    <li>• Pausas: Cada 45 minutos, camina 5 minutos</li>
                    <li>• Posición: Cambia cada 30 minutos</li>
                  </ul>
                )}
              </div>

              <div>
                <h2 className="font-bold text-[#E74C3C] mb-2">
                  ACTIVIDADES A EVITAR (TEMPORALMENTE):
                </h2>
                <ul className="space-y-1 text-slate-800">
                  <li>• Levantamiento de pesos &gt;10 kg</li>
                  <li>• Flexión extrema de columna</li>
                  <li>• Rotaciones bruscas</li>
                  <li>• Sedentarismo prolongado (&gt;2 horas seguidas)</li>
                </ul>
              </div>
            </section>

            {/* ⚠️ SEÑALES DE ALERTA */}
            <section className="border-b-2 border-[#E0E0E0] pb-5">
              <div className="border-l-4 border-[#E74C3C] bg-red-50/60 p-4 space-y-1.5 text-xs sm:text-sm">
                <h2 className="font-bold text-[#E74C3C]">
                  ⚠️ SEÑALES DE ALERTA — Llama al médico si:
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-800">
                  <li>• Aumento progresivo del dolor</li>
                  <li>• Adormecimiento/hormigueo en pierna</li>
                  <li>• Pérdida de fuerza</li>
                  <li>• Incontinencia urinaria/fecal</li>
                  <li>• Fiebre o cambios sistémicos</li>
                </ul>
              </div>
            </section>
          </div>
        )}

        {/* ===================================================================
            SECCIÓN 5.2: REPORTE TÉCNICO PARA EL MÉDICO (RAZONAMIENTO CLÍNICO)
           =================================================================== */}
        {(reportMode === 'MEDICO' || reportMode === 'AMBOS') && (
          <div className="space-y-6 pt-2">
            <div className="bg-[#003366] text-white px-4 py-2.5 text-xs font-bold tracking-wider">
              🩺 SECCIÓN 5.2 — REPORTE TÉCNICO PARA EL MÉDICO (HISTORIAL CLÍNICO Y RAZONAMIENTO)
            </div>

            {/* 1. Evaluación del Eje Cadera y Relato del Nervio Ciático */}
            <section className="border-2 border-[#1a5490] p-4 bg-[#F8FAFC] space-y-3 text-xs sm:text-sm">
              <h3 className="font-bold text-[#003366]">
                1. ANÁLISIS BIOMECÁNICO DEL EJE DE CADERA Y RECORRIDO CIÁTICO (FASE 2.4)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 border border-[#E0E0E0]">
                  <div className="font-bold text-xs text-[#1a5490] mb-1">
                    Eje Cadera (Centro de Gravedad):
                  </div>
                  <p className="text-slate-800">
                    {ejeCadera?.ejeCaderaCentroGravedad ||
                      'Desbalance pélvico primario evaluado en bipedestación y decúbito.'}
                  </p>
                </div>
                <div className="bg-white p-3 border border-[#E0E0E0]">
                  <div className="font-bold text-xs text-[#1a5490] mb-1">
                    Relato Clínico del Nervio Ciático:
                  </div>
                  <p className="text-slate-800">
                    {ejeCadera?.relatoNervioCiatico ||
                      'Se correlaciona raíz lumbosacra con recorrido de cintura a miembro inferior.'}
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Diagnóstico Diferencial Visual (3.3) */}
            <section className="border-2 border-[#E0E0E0] p-4 bg-white space-y-3 text-xs sm:text-sm">
              <h3 className="font-bold text-[#003366]">
                2. CORRELACIÓN IMAGEN-PACIENTE Y CERTEZA DIAGNÓSTICA (FASE 3.3)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50/60 border border-[#27AE60]">
                  <span className="font-bold text-[#27AE60] block">
                    ✓ PATOLOGÍA CONFIRMADA:
                  </span>
                  <span>
                    {ddVisual?.confirmada ||
                      consultation.protocolo.diagnosticoPrincipal}
                  </span>
                </div>
                <div className="p-3 bg-sky-50/60 border border-[#1a5490]">
                  <span className="font-bold text-[#1a5490] block">
                    • PATOLOGÍA PROBABLE:
                  </span>
                  <span>
                    {ddVisual?.probable ||
                      consultation.protocolo.diagnosticoSecundario}
                  </span>
                </div>
                <div className="p-3 bg-red-50/60 border border-[#E74C3C]">
                  <span className="font-bold text-[#E74C3C] block">
                    ✕ PATOLOGÍA DESCARTADA:
                  </span>
                  <span>
                    {ddVisual?.descartada ||
                      'Compresión medular aguda o fractura vertebral.'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-[#E0E0E0]">
                  <span className="font-bold text-slate-600 block">
                    ◌ PATOLOGÍA NO VISIBLE EN ESTUDIO ACTUAL:
                  </span>
                  <span>
                    {ddVisual?.noVisible ||
                      'Inestabilidad dinámica funcional.'}
                  </span>
                </div>
              </div>
            </section>

            {/* 3. Observación Psicológica y Medicación Psicótropa (2.2) */}
            <section className="border-2 border-[#E0E0E0] p-4 bg-white space-y-2 text-xs sm:text-sm">
              <h3 className="font-bold text-[#003366]">
                3. EVALUACIÓN PSICOLÓGICA INTEGRADA Y MEDICACIÓN (FASE 2.2)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E0E0E0]">
                  <strong>Actitud en consulta:</strong>{' '}
                  {psicologia?.actitud || 'Colaborador'}
                </div>
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E0E0E0]">
                  <strong>Psicofármacos:</strong>{' '}
                  {psicologia?.medicacionPsicotropa || 'Ninguno'}
                </div>
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E0E0E0]">
                  <strong>Implicación clínica:</strong>{' '}
                  {psicologia?.implicacionClinica ||
                    'Umbral de dolor y tono sin sesgo farmacológico.'}
                </div>
              </div>
            </section>

            {/* 4. Razonamiento Clínico, Puntos de Contacto y Criterios de Alta */}
            <section className="border-2 border-[#E0E0E0] p-4 bg-white space-y-3 text-xs sm:text-sm">
              <h3 className="font-bold text-[#003366]">
                4. RAZONAMIENTO CLÍNICO, TÉCNICA DE AJUSTE Y CRITERIOS DE ALTA
              </h3>
              <div className="space-y-2 text-slate-800">
                <div>
                  <strong className="text-[#1a5490]">
                    • Justificación biomecánica:
                  </strong>{' '}
                  {razonamiento?.porQuePatologia ||
                    consultation.protocolo.etiologia}
                </div>
                <div>
                  <strong className="text-[#1a5490]">
                    • Puntos de contacto y dirección de ajuste:
                  </strong>{' '}
                  {razonamiento?.puntosContactoDireccionAjuste ||
                    'Ajuste primario en eje de cadera/pelvis + segmento vertebral específico.'}
                </div>
                <div>
                  <strong className="text-[#E74C3C]">
                    • Precauciones y contraindicaciones:
                  </strong>{' '}
                  {razonamiento?.riesgosContraindicaciones ||
                    'Evitar vectores rotacionales forzados en segmentos con listesis.'}
                </div>
                <div>
                  <strong className="text-[#27AE60]">
                    • Criterios objetivos de alta:
                  </strong>{' '}
                  {razonamiento?.criteriosAlta ||
                    'EVA ≤ 1/10, rango articular normalizado y fuerza estabilizadora 5/5.'}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 🎙️ TRANSCRIPCIÓN COMPLETA E INFORME GENERADO DE LA CHARLA CLÍNICA */}
        {(consultation.transcripcionCharla ||
          consultation.informeCompletoCharla) && (
          <section className="border-2 border-[#1a5490] bg-[#F8FAFC] p-4 space-y-3 text-xs sm:text-sm">
            <h2 className="font-bold text-[#003366]">
              🎙️ INFORME COMPLETO Y TRANSCRIPCIÓN DE LA CHARLA CLÍNICA (
              {doctor.nombre.toUpperCase()} —{' '}
              {doctor.matriculaProfesional || 'MP 542'})
            </h2>

            {consultation.informeCompletoCharla && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-800">
                <div className="bg-white p-3 border border-[#E0E0E0]">
                  <strong className="text-[#1a5490] block mb-0.5">
                    Síntesis de la Conversación:
                  </strong>
                  {consultation.informeCompletoCharla.resumenConversacion}
                </div>
                <div className="bg-white p-3 border border-[#E0E0E0]">
                  <strong className="text-[#1a5490] block mb-0.5">
                    Anamnesis y Datos Autocompletados:
                  </strong>
                  {consultation.informeCompletoCharla.anamnesisNarrativa}
                </div>
                <div className="bg-white p-3 border border-[#E0E0E0]">
                  <strong className="text-[#1a5490] block mb-0.5">
                    Correlación Eje de Cadera y Nervio Ciático:
                  </strong>
                  {
                    consultation.informeCompletoCharla
                      .correlacionBiomecanicaEjeCadera
                  }
                </div>
                <div className="bg-white p-3 border border-[#E0E0E0]">
                  <strong className="text-[#1a5490] block mb-0.5">
                    Plan Terapéutico Propuesto:
                  </strong>
                  {consultation.informeCompletoCharla.planTerapeuticoDetallado}
                </div>
              </div>
            )}

            {consultation.transcripcionCharla && (
              <div className="bg-white p-3 border border-[#E0E0E0] space-y-1">
                <div className="font-bold text-xs text-[#003366]">
                  TRANSCRIPCIÓN TEXTUAL COMPLETA DE LA CHARLA:
                </div>
                <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 leading-relaxed">
                  {consultation.transcripcionCharla}
                </pre>
              </div>
            )}
          </section>
        )}

        {/* 📞 PRÓXIMA CITA Y FIRMA */}
        <section className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8FAFC] border border-[#E0E0E0] p-4">
            <div>
              <div className="font-bold text-[#003366]">📞 PRÓXIMA CITA</div>
              <div className="font-mono font-bold text-[#1a5490] mt-1">
                {consultation.protocolo.proximaCitaFechaHora}
              </div>
            </div>
            <div>
              <div className="font-bold text-[#003366]">CONTACTO:</div>
              <div className="font-mono text-xs mt-1">
                Teléfono: {doctor.telefono} | Email: {doctor.email}
              </div>
              <div className="font-mono text-xs">
                Emergencias 24/7: {doctor.emergencias}
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#E0E0E0]">
            <div className="font-mono text-xs text-[#003366]">
              Firma del Profesional Propietario:{' '}
              <span className="underline font-bold">
                {doctor.nombre} ({doctor.matriculaProfesional || 'MP 542'})
              </span>{' '}
              · Fecha: 10/10/2024
            </div>
            <div className="text-[11px] text-slate-500">
              🔐 Este documento es confidencial y para uso exclusivo del
              paciente y su médico. No debe ser compartido sin autorización.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
