import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { DoctorProfile } from '../types/wireframeTypes';

interface AuthScreenProps {
  doctor: DoctorProfile;
  onLoginSuccess: (updatedDoctor?: DoctorProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  doctor,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'registro' | 'recuperar' | '2fa'>(
    'login'
  );
  const [email, setEmail] = useState(doctor.email || 'doctor@quiropraxia.com');
  const [password, setPassword] = useState('••••••••••');
  const [nombreRegistro, setNombreRegistro] = useState('Dr. Juan García');
  const [clinicaRegistro, setClinicaRegistro] = useState(
    'Mi Clínica — ATLAS Columna Vertebral'
  );
  const [twoFactorCode, setTwoFactorCode] = useState('482910');
  const [require2FA, setRequire2FA] = useState(doctor.twoFactorEnabled);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (require2FA) {
      setMode('2fa');
      return;
    }
    onLoginSuccess({
      ...doctor,
      email: email.trim() || 'doctor@quiropraxia.com',
    });
  };

  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess({
      ...doctor,
      nombre: nombreRegistro.trim() || 'Dr. Juan García',
      email: email.trim() || 'doctor@quiropraxia.com',
      clinica: clinicaRegistro.trim() || 'Mi Clínica',
    });
  };

  const handleSubmitRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(
      `Se ha enviado un enlace de recuperación de acceso a ${email}.`
    );
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.trim().length >= 4) {
      onLoginSuccess();
    }
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
        </div>

        {/* Contenido según modo: Login / Registro / Recuperar / 2FA */}
        {mode === 'login' && (
          <form onSubmit={handleSubmitLogin} className="p-6 space-y-5">
            {statusMessage && (
              <div className="p-3 bg-emerald-50 border border-[#27AE60] text-xs text-[#003366]">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-[#003366]">
                  Contraseña:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStatusMessage(null);
                    setMode('recuperar');
                  }}
                  className="text-xs text-[#3498DB] hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-[#E0E0E0] px-3.5 py-2.5 text-sm text-[#003366] focus:border-[#1a5490] focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#003366]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={require2FA}
                  onChange={(e) => setRequire2FA(e.target.checked)}
                  className="w-4 h-4 accent-[#1a5490]"
                />
                <span>Verificar con 2FA (Dos Factores)</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#1a5490] hover:bg-[#003366] text-white font-bold text-sm tracking-wide transition-colors cursor-pointer"
            >
              INICIAR SESIÓN
            </button>

            <div className="pt-2 border-t border-[#E0E0E0] text-center text-sm text-[#003366]">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setStatusMessage(null);
                  setMode('registro');
                }}
                className="font-bold text-[#1a5490] hover:underline ml-1"
              >
                CREAR CUENTA
              </button>
            </div>
          </form>
        )}

        {mode === 'registro' && (
          <form onSubmit={handleSubmitRegister} className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#003366]">
              <UserPlus className="w-4 h-4 text-[#1a5490]" />
              <span>CREAR CUENTA PROFESIONAL</span>
            </div>

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

            <div>
              <label className="block text-xs font-semibold text-[#003366] mb-1">
                Contraseña:
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-[#E0E0E0] px-3 py-2 text-sm text-[#003366]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#27AE60] hover:bg-emerald-700 text-white font-bold text-sm tracking-wide transition-colors"
            >
              REGISTRAR Y ACCEDER AL DASHBOARD
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
              Ingresa tu correo registrado para recibir un código de restablecimiento seguro.
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
              <div className="p-3 bg-emerald-50 border border-[#27AE60] text-xs text-[#27AE60] font-medium">
                {statusMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#1a5490] text-white font-bold text-xs"
            >
              ENVIAR ENLACE DE RECUPERACIÓN
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

        {mode === '2fa' && (
          <form onSubmit={handleVerify2FA} className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#003366]">
              <ShieldCheck className="w-5 h-5 text-[#27AE60]" />
              <span>VERIFICACIÓN EN DOS FACTORES (2FA)</span>
            </div>
            <p className="text-xs text-slate-600">
              Ingresa el código de seguridad de 6 dígitos enviado al dispositivo de{' '}
              <strong>{email}</strong>:
            </p>
            <input
              type="text"
              maxLength={6}
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              className="w-full border-2 border-[#1a5490] px-4 py-3 text-center text-lg font-mono tracking-widest font-bold text-[#003366]"
            />
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#27AE60] text-white font-bold text-sm"
            >
              VERIFICAR Y ENTRAR
            </button>
            <div className="text-center text-xs">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-slate-500 hover:text-[#003366]"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
