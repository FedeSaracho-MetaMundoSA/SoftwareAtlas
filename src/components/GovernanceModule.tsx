import React, { useState } from 'react';
import {
  Download,
  EyeOff,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  ROLE_PERMISSIONS,
  RolePermissionMatrix,
} from '../engine/clinicalEvaluationEngine';
import {
  AuditLogEvent,
  ClinicalCaseRecord,
  UserRole,
} from '../types/clinical';

interface GovernanceModuleProps {
  currentRole: UserRole;
  permissions: RolePermissionMatrix;
  piiMasked: boolean;
  cases: ClinicalCaseRecord[];
  auditLogs: AuditLogEvent[];
  onChangeRole: (role: UserRole) => void;
  onTogglePiiMask: () => void;
  onImportBackup: (cases: ClinicalCaseRecord[], logs: AuditLogEvent[]) => void;
  onResetDemoData: () => void;
}

export const GovernanceModule: React.FC<GovernanceModuleProps> = ({
  currentRole,
  permissions,
  piiMasked,
  cases,
  auditLogs,
  onChangeRole,
  onTogglePiiMask,
  onImportBackup,
  onResetDemoData,
}) => {
  const [auditSearch, setAuditSearch] = useState('');
  const [backupStatusMsg, setBackupStatusMsg] = useState<string | null>(null);

  const handleExportJSON = () => {
    if (!permissions.puedeExportarRespaldo) return;
    const payload = {
      sistema: 'ATLAS Columna Vertebral — Sistema Clínico Quiropráctico',
      fechaRespaldo: new Date().toISOString(),
      versionEsquema: '1.0-OFFLINE-FIRST',
      totalCasos: cases.length,
      casosClinicos: cases,
      trazabilidadAuditoria: auditLogs,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-respaldo-clinico-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatusMsg(
      'Copia de seguridad clínica descargada correctamente en formato JSON estructurado.'
    );
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.casosClinicos) && parsed.casosClinicos.length > 0) {
          onImportBackup(
            parsed.casosClinicos,
            Array.isArray(parsed.trazabilidadAuditoria)
              ? parsed.trazabilidadAuditoria
              : auditLogs
          );
          setBackupStatusMsg(
            `Respaldo restaurado con éxito (${parsed.casosClinicos.length} expedientes clínicos cargados).`
          );
        } else {
          setBackupStatusMsg(
            'El archivo seleccionado no contiene una estructura válida de expedientes clínicos.'
          );
        }
      } catch {
        setBackupStatusMsg(
          'Error al leer el archivo JSON de respaldo. Verifique la integridad del archivo.'
        );
      }
    };
    reader.readAsText(file);
  };

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.expedienteCodigo.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.accion.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.detalleClinico.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.usuario.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabecera de Gobernanza, Roles y Confidencialidad */}
      <div className="border border-slate-200 bg-white p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Fase 6: Controles de Acceso, Trazabilidad y Respaldo Offline-First</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {cases.length} Expedientes en Almacenamiento Local
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {auditLogs.length} Eventos Auditados
            </span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mt-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-900" />
            <span>Gobernanza de Datos de Salud, Permisos por Rol y Respaldo Clínico</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Arquitectura Offline-First con persistencia local inmediata, control de acceso basado en rol (RBAC) y protección de datos personales sensibles (PII).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onTogglePiiMask}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 border text-xs font-medium transition-colors whitespace-nowrap ${
              piiMasked
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>
              {piiMasked
                ? 'Modo Confidencial PII: ACTIVO'
                : 'Enmascarar Datos Sensibles (PII)'}
            </span>
          </button>

          {permissions.puedeExportarRespaldo && (
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Copia de Seguridad (.JSON)</span>
            </button>
          )}

          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 cursor-pointer transition-colors whitespace-nowrap">
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Respaldo</span>
            <input
              type="file"
              accept="application/json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onResetDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
            title="Restaurar casos semilla de demostración"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Base Inicial</span>
          </button>
        </div>
      </div>

      {backupStatusMsg && (
        <div className="p-3.5 border border-slate-300 bg-slate-100 text-xs font-medium text-slate-900 flex items-center justify-between">
          <span>{backupStatusMsg}</span>
          <button
            type="button"
            onClick={() => setBackupStatusMsg(null)}
            className="text-slate-500 hover:text-slate-900"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Matriz de Roles y Permisos Clínicos */}
      <div className="border border-slate-200 bg-white p-6 space-y-4">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Matriz de Control de Acceso Basado en Roles (RBAC Clínico)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecciona un rol activo para verificar en tiempo real las restricciones sobre anamnesis, imágenes, diagnóstico y protocolo.
            </p>
          </div>
          <span className="text-xs text-slate-600">
            Rol Activo: <strong className="text-slate-900">{permissions.titulo}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-3 font-medium">Rol del Sistema</th>
                <th className="py-2.5 px-3 font-medium">Anamnesis</th>
                <th className="py-2.5 px-3 font-medium">Examen Físico / SOAP</th>
                <th className="py-2.5 px-3 font-medium">Calibrar RX/RMN</th>
                <th className="py-2.5 px-3 font-medium">Firmar Diagnóstico</th>
                <th className="py-2.5 px-3 font-medium">Prescribir Protocolo</th>
                <th className="py-2.5 pl-3 text-right font-medium">Simular Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map((rKey) => {
                const rp = ROLE_PERMISSIONS[rKey];
                const isSelected = currentRole === rKey;
                return (
                  <tr
                    key={rKey}
                    className={isSelected ? 'bg-slate-100/90' : 'hover:bg-slate-50'}
                  >
                    <td className="py-3 pr-3">
                      <span className="font-semibold text-slate-900 block">
                        {rp.titulo}
                      </span>
                      <span className="text-slate-500">{rp.descripcion}</span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {rp.puedeEditarAnamnesis ? 'AUTORIZADO' : 'LECTURA'}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {rp.puedeRegistrarExamenFisico ? 'AUTORIZADO' : 'LECTURA'}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {rp.puedeCalibrarImagenes ? 'AUTORIZADO' : 'RESTRINGIDO'}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {rp.puedeFirmarDiagnostico ? 'FIRMA CLÍNICA' : 'RESTRINGIDO'}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {rp.puedeModificarProtocolo ? 'AUTORIZADO' : 'RESTRINGIDO'}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => onChangeRole(rKey)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                          isSelected
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? 'Rol en Uso' : 'Activar Rol'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registro de Trazabilidad y Auditoría Clínica */}
      <div className="border border-slate-200 bg-white p-6 space-y-4">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Bitácora Inmutable de Trazabilidad y Auditoría Clínica
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada modificación sobre datos clínicos, imágenes, diagnósticos o protocolos registra fecha, autor, rol y huella de integridad.
            </p>
          </div>
          <input
            type="text"
            placeholder="Filtrar por expediente, acción o profesional..."
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            className="border border-slate-300 px-3 py-1.5 text-xs w-full sm:w-72"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-3 font-medium">Fecha y Hora</th>
                <th className="py-2.5 px-3 font-medium">Profesional / Rol</th>
                <th className="py-2.5 px-3 font-medium">Expediente</th>
                <th className="py-2.5 px-3 font-medium">Operación Clínica</th>
                <th className="py-2.5 pl-3 font-medium text-right">Hash Integridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-3 pr-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-900">{log.usuario}</span>
                    <span className="text-slate-500"> · {log.rol.toUpperCase()}</span>
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                    {log.expedienteCodigo}
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    <span className="font-mono text-slate-900 font-medium">
                      {log.accion}
                    </span>{' '}
                    — {log.detalleClinico}
                  </td>
                  <td className="py-3 pl-3 text-right font-mono tabular-nums text-slate-400 whitespace-nowrap">
                    {log.hashIntegridad}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
