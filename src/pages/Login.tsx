import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { LoginPayload } from '../api/medicalApi';

// ──────────────────────────────────────────────
// TIPOS DE CAMPO DEL FORMULARIO
// ──────────────────────────────────────────────
interface LoginForm {
  dni: string;
  password: string;
}

interface FieldErrors {
  dni?: string;
  password?: string;
}

// ──────────────────────────────────────────────
// COMPONENTE
// ──────────────────────────────────────────────
const Login: React.FC = () => {
  const { login } = useAuth();

  const [form, setForm] = useState<LoginForm>({ dni: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ──────────────────────────────────────────────
  // VALIDACIÓN
  // ──────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FieldErrors = {};

    if (!/^\d{8}$/.test(form.dni)) {
      newErrors.dni = 'El DNI debe tener exactamente 8 dígitos numéricos.';
    }
    if (form.password.length < 1) {
      newErrors.password = 'La contraseña es requerida.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ──────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;

  // 🔥 Filtro anti-letras: Si es el campo del DNI, solo permite números
  if (name === 'dni') {
    const soloNumeros = value.replace(/\D/g, ''); // Elimina cualquier letra o símbolo al instante
    setForm((prev) => ({ ...prev, [name]: soloNumeros }));
  } else {
    // Comportamiento normal para la contraseña (password) u otros campos
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Limpiar error del campo al escribir
  if (errors[name as keyof FieldErrors]) {
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }
  setApiError(null);
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const payload: LoginPayload = { dni: form.dni, password: form.password };
      await login(payload);
      // La redirección la maneja AuthContext
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const detail = error?.response?.data?.detail;
      setApiError(
        typeof detail === 'string'
          ? detail
          : 'Credenciales incorrectas. Verifica tu DNI y contraseña.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden">
      {/* ── PANEL IZQUIERDO (decorativo) ── */}
      <div className="hidden lg:flex lg:flex-1 relative items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950">
        {/* Orbs decorativos */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-12 animate-fade-in-up">
          <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-2xl shadow-sky-500/30 mb-8">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 4v4m0 8v4M4 12h4m8 0h4M6.343 6.343l2.829 2.829m5.656 5.656 2.829 2.829M6.343 17.657l2.829-2.829m5.656-5.656 2.829-2.829" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Tu salud,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
              organizada.
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xs mx-auto leading-relaxed">
            Reserva citas médicas con los mejores especialistas en segundos.
          </p>

          {/* Features */}
          <div className="mt-10 space-y-3 text-left">
            {[
              { icon: '🏥', text: 'Accede a múltiples hospitales' },
              { icon: '🕐', text: 'Elige el horario que prefieras' },
              { icon: '📱', text: 'QR de confirmación instantáneo' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-xl">{icon}</span>
                <span className="text-slate-300 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO (formulario) ── */}
      <div className="flex-1 lg:max-w-md flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 4v4m0 8v4M4 12h4m8 0h4M6.343 6.343l2.829 2.829m5.656 5.656 2.829 2.829M6.343 17.657l2.829-2.829m5.656-5.656 2.829-2.829" />
              </svg>
            </div>
            <span className="text-2xl font-bold"><span className="text-white">Smart</span><span className="text-sky-400">Shift</span></span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Bienvenido de vuelta</h2>
          <p className="text-slate-400 text-sm mb-8">
            Ingresa con tu DNI para acceder a tu cuenta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* DNI */}
            <div>
              <label htmlFor="dni" className="block text-sm font-medium text-slate-300 mb-1.5">
                Número de DNI
              </label>
              <input
                id="dni"
                name="dni"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={8}
                value={form.dni}
                onChange={handleChange}
                placeholder="12345678"
                className={`w-full px-4 py-3 rounded-xl bg-slate-800/60 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200
                  ${errors.dni
                    ? 'border-red-500/70 focus:ring-red-500/30'
                    : 'border-slate-700 focus:ring-sky-500/30 focus:border-sky-500/50'
                  }`}
                autoComplete="username"
              />
              {errors.dni && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.dni}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-11 rounded-xl bg-slate-800/60 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200
                    ${errors.password
                      ? 'border-red-500/70 focus:ring-red-500/30'
                      : 'border-slate-700 focus:ring-sky-500/30 focus:border-sky-500/50'
                    }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword
                    ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  }
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Error de API */}
            {apiError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-300">{apiError}</p>
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              className="text-sky-400 font-medium hover:text-sky-300 transition-colors"
            >
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
