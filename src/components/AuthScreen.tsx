import React, { useState } from 'react';
import { Mail, UserPlus } from 'lucide-react';
import { DoctorProfile } from '../types/wireframeTypes';

interface AuthScreenProps {
  doctor: DoctorProfile;
  onLoginSuccess: (updatedDoctor?: DoctorProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  doctor,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'registro' | 'recuperar'>('login');
  const [email, setEmail] = useState(doctor.email || 'doctor@quiropraxia.com');
  const [nombreRegistro, setNombreRegistro] = useState('Dr. Juan García');
  const [clinicaRegistro, setClinicaRegistro] = useState(
    'Mi Clínica — ATLAS Columna Vertebral'
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess({
      ...doctor,
      email: email.trim(),
    });
  };

  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess({
      ...doctor,
      nombre: nombreRegistro.trim(),
      email: email.trim(),
      clinica: clinicaRegistro.trim(),
    });
  };

  const handleSubmitRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(
      'La recuperación de contraseña no está configurada. No se envió ningún correo.'
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-4">
      {/* PANTALLA 1: LOGIN / REGISTRO (Wireframe Exacto) */}
      <div className="w-full max-w-md bg-white border-2 border-[#E0E0E0] shadow-xs">
        {/* Cabecera del recuadro del wireframe */}
        <div className="border-b-2 border-[#E0E0E0] py-5 px-6 text-center bg-white">
          <h1 className="text-xl font-bold tracking-wide text-[#003366]">
            🏥 SISTEMA QUIROPRÁCTICO
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ATLAS Columna Vertebral · Gestión Clínica Profesional
          </p>
          <p
            role="note"
            className="mt-3 border border-amber-300 bg-amber-50 px-3 py-2 text-left text-xs font-semibold text-amber-900"
          >
            MODO DEMOSTRACIÓN: esta vista no autentica usuarios ni protege datos clínicos.
          </p>
        </div>

        {/* Contenido según modo: Login / Registro / Recuperar / 2FA */}
        {mode === 'login' && (
          <form onSubmit={handleSubmitLogin} className="p-6 space-y-5">
            {statusMessage && (
              <div role="status" className="border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                {statusMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[#003366] mb-1.5">
                Email:
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@quiropraxia.com"
                  className="w-full border-2 border-[#E0E0E0] px-3.5 py-2.5 text-sm text-[#003366] font-mono focus:border-[#1a5490] focus:outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#1a5490] hover:bg-[#003366] text-white font-bold text-sm tracking-wide transition-colors cursor-pointer"
            >
              INGRESAR A LA DEMOSTRACIÓN
            </button>

            <div className="pt-2 border-t border-[#E0E0E0] text-center text-sm text-[#003366]">
              ¿Necesitas actualizar el perfil local?{' '}
              <button
                type="button"
                onClick={() => {
                  setStatusMessage(null);
                  setMode('registro');
                }}
                className="font-bold text-[#1a5490] hover:underline ml-1"
              >
                CONFIGURAR PERFIL
              </button>
            </div>
          </form>
        )}

        {mode === 'registro' && (
          <form onSubmit={handleSubmitRegister} className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#003366]">
              <UserPlus className="w-4 h-4 text-[#1a5490]" />
              <span>CONFIGURAR PERFIL LOCAL</span>
            </div>
            <p className="border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              Esto solo actualiza el perfil guardado en este navegador; no crea una cuenta ni configura autenticación.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#003366] mb-1">
                Nombre del Profesional:
              </label>
              <input
                type="text"
                required
                value={nombreRegistro}
                onChange={(e) => setNombreRegistro(e.target.value)}
                className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#003366] mb-1">
                Nombre de la Clínica:
              </label>
              <input
                type="text"
                required
                value={clinicaRegistro}
                onChange={(e) => setClinicaRegistro(e.target.value)}
                className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#003366] mb-1">
                Email Profesional:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366] font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#27AE60] hover:bg-emerald-700 text-white font-bold text-sm tracking-wide transition-colors"
            >
              GUARDAR PERFIL LOCAL Y CONTINUAR
            </button>

            <div className="text-center text-xs pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-semibold text-[#1a5490] hover:underline"
              >
                ← Volver a Iniciar Sesión
              </button>
            </div>
          </form>
        )}

        {mode === 'recuperar' && (
          <form onSubmit={handleSubmitRecovery} className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#003366]">
              RECUPERAR CONTRASEÑA
            </h2>
            <p className="text-xs text-slate-600">
              El servicio de recuperación todavía no está configurado.
            </p>
            <div>
              <label className="block text-xs font-semibold text-[#003366] mb-1">
                Email:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366] font-mono"
              />
            </div>

            {statusMessage && (
              <div role="status" className="border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-900">
                {statusMessage}
              </div>
            )}

            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500"
            >
              RECUPERACIÓN NO DISPONIBLE
            </button>

            <div className="text-center text-xs pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-semibold text-[#003366] hover:underline"
              >
                ← Volver al Login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
