import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { RegisterPayload } from '../api/medicalApi';

// ──────────────────────────────────────────────
// TIPOS DEL FORMULARIO
// ──────────────────────────────────────────────
interface RegisterForm {
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono: string;
  fecha_nacimiento: string;
  direccion: string;
}

type FormErrors = Partial<Record<keyof RegisterForm, string>>;

// ──────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────
const Register: React.FC = () => {
  const { registerAndLogin } = useAuth();

  const [form, setForm] = useState<RegisterForm>({
    dni: '',
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    fecha_nacimiento: '',
    direccion: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Calcular la fecha máxima permitida para "fecha de nacimiento" (debe tener al menos 1 año)
  const maxBirthDate = new Date();
  maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 1);
  const maxBirthDateStr = maxBirthDate.toISOString().split('T')[0];

  // ──────────────────────────────────────────────
  // VALIDACIÓN
  // ──────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!/^\d{8}$/.test(form.dni)) {
      newErrors.dni = 'El DNI debe tener exactamente 8 dígitos numéricos.';
    }
    if (form.nombres.trim().length < 2) {
      newErrors.nombres = 'Ingresa un nombre válido (mínimo 2 caracteres).';
    }
    if (form.apellidos.trim().length < 2) {
      newErrors.apellidos = 'Ingresa apellidos válidos (mínimo 2 caracteres).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
    }
    if (form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }
    if (!/^\d{9}$/.test(form.telefono.replace(/\s/g, ''))) {
      newErrors.telefono = 'El teléfono debe tener 9 dígitos.';
    }
    if (!form.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'Selecciona tu fecha de nacimiento.';
    }
    if (form.direccion.trim().length < 5) {
      newErrors.direccion = 'Ingresa una dirección válida (mínimo 5 caracteres).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ──────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;

  // 🔥 Filtro anti-letras para Teléfono y DNI
  if (name === 'telefono' || name === 'dni') {
    const soloNumeros = value.replace(/\D/g, ''); // Borra al instante cualquier letra o símbolo
    setForm((prev) => ({ ...prev, [name]: soloNumeros }));
  } else {
    // Comportamiento normal para los demás campos (nombres, email, etc.)
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Limpia los errores de validación del campo actual si el usuario ya empezó a corregirlo
  if (errors[name as keyof FormErrors]) {
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
      const payload: RegisterPayload = {
        dni: form.dni,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        telefono: form.telefono.trim(),
        fecha_nacimiento: form.fecha_nacimiento,
        direccion: form.direccion.trim(),
      };
      await registerAndLogin(payload);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | { msg: string }[] } }; message?: string };
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setApiError(detail.map((d) => d.msg).join('. '));
      } else if (typeof detail === 'string') {
        setApiError(detail);
      } else {
        setApiError('Ocurrió un error al registrar. Verifica tus datos e intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16">
      {/* Orbs decorativos */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-96 bg-gradient-to-b from-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl animate-fade-in-up">
        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-lg shadow-sky-500/25 mb-4">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Crear tu cuenta</h1>
            <p className="text-slate-400 text-sm mt-1">Únete a SmartShift para gestionar tus citas médicas</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Fila 1: DNI */}
            <Field id="dni" label="Número de DNI" placeholder="12345678" inputMode="numeric" maxLength={8} autoComplete="off" form={form} errors={errors} handleChange={handleChange} />

            {/* Fila 2: Nombres y Apellidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="nombres" label="Nombres" placeholder="Ana María" autoComplete="given-name" form={form} errors={errors} handleChange={handleChange} />
              <Field id="apellidos" label="Apellidos" placeholder="García López" autoComplete="family-name" form={form} errors={errors} handleChange={handleChange} />
            </div>

            {/* Fila 3: Email */}
            <Field id="email" label="Correo electrónico" type="email" placeholder="ana@email.com" autoComplete="email" form={form} errors={errors} handleChange={handleChange} />

            {/* Fila 4: Contraseñas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mín. 6 caracteres"
                    autoComplete="new-password"
                    className={`w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-800/60 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200
                      ${errors.password ? 'border-red-500/70 focus:ring-red-500/30' : 'border-slate-700 focus:ring-sky-500/30 focus:border-sky-500/50'}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <EyeButton show={showPassword} toggle={() => setShowPassword(!showPassword)} />
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar Contraseña</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    className={`w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-800/60 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200
                      ${errors.confirmPassword ? 'border-red-500/70 focus:ring-red-500/30' : 'border-slate-700 focus:ring-sky-500/30 focus:border-sky-500/50'}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <EyeButton show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Fila 5: Teléfono y Fecha de Nacimiento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="telefono" label="Teléfono" type="tel" placeholder="987654321" inputMode="tel" maxLength={9} autoComplete="tel" form={form} errors={errors} handleChange={handleChange} />
              <Field id="fecha_nacimiento" label="Fecha de Nacimiento" type="date" max={maxBirthDateStr} autoComplete="bday" form={form} errors={errors} handleChange={handleChange} />
            </div>

            {/* Fila 6: Dirección */}
            <Field id="direccion" label="Dirección" placeholder="Jr. Los Álamos 123, Lima" autoComplete="street-address" form={form} errors={errors} handleChange={handleChange} />

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
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-sky-400 font-medium hover:text-sky-300 transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// COMPONENTES AUXILIARES (AFUERA DEL PRINCIPAL)
// ──────────────────────────────────────────────
interface FieldProps {
  id: keyof RegisterForm;
  label: string;
  type?: string;
  placeholder?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  min?: string;
  max?: string;
  extraRight?: React.ReactNode;
  autoComplete?: string;
  form: RegisterForm;
  errors: FormErrors;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const Field: React.FC<FieldProps> = ({
  id,
  label,
  type = 'text',
  placeholder,
  inputMode,
  maxLength,
  min,
  max,
  extraRight,
  autoComplete,
  form,
  errors,
  handleChange,
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        min={min}
        max={max}
        value={form[id]}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200
          ${extraRight ? 'pr-11' : ''}
          ${errors[id]
            ? 'border-red-500/70 focus:ring-red-500/30'
            : 'border-slate-700 focus:ring-sky-500/30 focus:border-sky-500/50'
          }`}
      />
      {extraRight && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{extraRight}</div>
      )}
    </div>
    {errors[id] && (
      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[id]}
      </p>
    )}
  </div>
);

const EyeButton = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
  <button type="button" onClick={toggle} className="text-slate-400 hover:text-slate-200 transition-colors">
    {show ? (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )}
  </button>
);

export default Register;