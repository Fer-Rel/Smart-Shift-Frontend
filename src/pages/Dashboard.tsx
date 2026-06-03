import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { cancelarCita, getMisCitas } from '../api/medicalApi';
import type { Cita, EstadoCita } from '../api/medicalApi';

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════

/** Devuelve YYYY-MM-DD de hoy sin depender de la zona horaria del servidor */
const getTodayStr = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** "Próxima" = estado estrictamente 'reservada' Y fecha >= hoy */
const isProxima = (cita: Cita): boolean => {
  const today = getTodayStr();
  const citaDate = cita.fecha_cita.split('T')[0]; // por si viene con timestamp
  return cita.estado === 'reservada' && citaDate >= today;
};

const formatDate = (dateStr: string): string => {
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
  } catch {
    return dateStr;
  }
};

const formatTime = (timeStr: string): string => (timeStr ? timeStr.substring(0, 5) : '');

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

// ══════════════════════════════════════════════════════
// STATUS BADGE
// ══════════════════════════════════════════════════════

const statusConfig: Record<EstadoCita, { label: string; classes: string }> = {
  reservada:   { label: 'Reservada',   classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  confirmada:  { label: 'Confirmada',  classes: 'bg-sky-500/15     text-sky-400     border-sky-500/30' },
  pendiente:   { label: 'Pendiente',   classes: 'bg-amber-500/15   text-amber-400   border-amber-500/30' },
  cancelada:   { label: 'Cancelada',   classes: 'bg-red-500/15     text-red-400     border-red-500/30' },
  completada:  { label: 'Completada',  classes: 'bg-slate-500/15   text-slate-400   border-slate-500/30' },
};

const StatusBadge: React.FC<{ estado: EstadoCita }> = ({ estado }) => {
  const { label, classes } = statusConfig[estado] ?? {
    label: estado,
    classes: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
      {/* Dot pulsante solo para estado activo */}
      {estado === 'reservada' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
      )}
      {label}
    </span>
  );
};

// ══════════════════════════════════════════════════════
// HELPERS PARA EXTRAER CAMPOS DEL BACKEND
// (el backend puede usar distintos nombres de campo)
// ══════════════════════════════════════════════════════

const getMedicoNombre = (cita: Cita): string => {
  const nombre = (cita.medico_nombre as string) ?? (cita.nombre_medico as string) ?? (cita.medico as string) ?? '';
  const apellidos = (cita.medico_apellidos as string) ?? (cita.apellidos_medico as string) ?? '';
  return `${nombre} ${apellidos}`.trim() || 'Médico';
};

const getEspecialidad = (cita: Cita): string =>
  ((cita.especialidad as string) ?? (cita.nombre_especialidad as string) ?? '');

const getHospital = (cita: Cita): string =>
  ((cita.hospital as string) ?? (cita.nombre_hospital as string) ?? '');

const getQrValue = (cita: Cita): string | null => {
  if (cita.codigo_qr) return cita.codigo_qr;
  // fallback a otros nombres posibles
  const alt = (cita.qr_code as string) ?? (cita.codigo as string) ?? null;
  return alt;
};

// ══════════════════════════════════════════════════════
// MODAL DE DETALLES (con QR y botón cancelar)
// ══════════════════════════════════════════════════════

interface DetailModalProps {
  cita: Cita;
  onClose: () => void;
  onCancelSuccess: (idCita: number) => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ cita, onClose, onCancelSuccess }) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const qrValue = getQrValue(cita);
  const proxima = isProxima(cita);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelarCita(cita.id_cita);
      onCancelSuccess(cita.id_cita);
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const detail = error?.response?.data?.detail;
      setCancelError(
        typeof detail === 'string' ? detail : 'No se pudo cancelar la cita. Intenta nuevamente.'
      );
    } finally {
      setIsCancelling(false);
      setShowConfirm(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 animate-fade-in-up overflow-hidden">

        {/* ── Header del modal ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400/20 to-indigo-400/20 border border-sky-500/20 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">Detalles de la Cita</h2>
              <p className="text-slate-400 text-xs">ID #{cita.id_cita}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Cuerpo del modal ── */}
        <div className="px-6 py-5 space-y-5">

          {/* Badge de estado */}
          <div className="flex justify-center">
            <StatusBadge estado={cita.estado} />
          </div>

          {/* Info estructurada */}
          <div className="space-y-3">
            {/* Médico */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-white/6">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Médico</p>
                <p className="text-white font-semibold">{getMedicoNombre(cita)}</p>
                {getEspecialidad(cita) && (
                  <p className="text-sky-400 text-sm">{getEspecialidad(cita)}</p>
                )}
              </div>
            </div>

            {/* Hospital */}
            {getHospital(cita) && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-white/6">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Hospital</p>
                  <p className="text-white font-semibold">{getHospital(cita)}</p>
                </div>
              </div>
            )}

            {/* Fecha y Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-800/50 border border-white/6">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Fecha</p>
                  <p className="text-white text-sm font-semibold">{formatDate(cita.fecha_cita)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-800/50 border border-white/6">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Hora</p>
                  <p className="text-white text-sm font-semibold">{formatTime(cita.hora_cita)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── QR Code (solo para citas 'reservada') ── */}
          {proxima && qrValue && (
            <div className="flex flex-col items-center gap-3 pt-1">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Código QR de acceso</p>
              <div className="p-4 bg-white rounded-2xl shadow-lg shadow-black/30">
                <QRCodeSVG
                  value={qrValue}
                  size={180}
                  level="H"
                  marginSize={1}
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 border border-white/10 rounded-xl">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                </svg>
                <span className="text-sky-400 font-mono font-bold text-base tracking-widest">{qrValue}</span>
              </div>
              <p className="text-xs text-slate-500 text-center">Muestra este código en recepción el día de tu cita</p>
            </div>
          )}

          {/* ── Sin QR disponible (reservada pero sin campo) ── */}
          {proxima && !qrValue && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-800/40 border border-white/6 text-slate-400 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              El código QR estará disponible una vez confirmada la cita por el centro médico.
            </div>
          )}

          {/* ── Error de cancelación ── */}
          {cancelError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-300">{cancelError}</p>
            </div>
          )}
        </div>

        {/* ── Footer con acciones (solo para citas 'reservada') ── */}
        {proxima && (
          <div className="px-6 pb-6">
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 hover:border-red-500/40 rounded-xl transition-all duration-200 active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cancelar esta Cita
              </button>
            ) : (
              /* Mini-confirmación inline */
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-xs text-red-300 font-medium">
                    Esta acción no se puede deshacer. La cita quedará como <strong>cancelada</strong>.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isCancelling}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50"
                  >
                    Mantener cita
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-400 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-all"
                  >
                    {isCancelling ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Cancelando...
                      </>
                    ) : (
                      'Sí, cancelar'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// TARJETA DE CITA (clickable si es próxima)
// ══════════════════════════════════════════════════════

interface CitaCardProps {
  cita: Cita;
  onClick?: () => void;
  dimmed?: boolean;
}

const CitaCard: React.FC<CitaCardProps> = ({ cita, onClick, dimmed = false }) => {
  const proxima = isProxima(cita);
  const medicoNombre = getMedicoNombre(cita);
  const especialidad = getEspecialidad(cita);
  const hospital = getHospital(cita);

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-slate-900/60 border rounded-2xl p-5 transition-all duration-200
        ${proxima && onClick
          ? 'border-white/10 hover:border-sky-500/40 hover:bg-slate-900/80 cursor-pointer hover:shadow-lg hover:shadow-sky-500/5'
          : 'border-white/5'
        }
        ${dimmed ? 'opacity-55 hover:opacity-75' : ''}
      `}
    >
      <div className="flex flex-col gap-3">
        {/* Médico + estado */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
              ${proxima
                ? 'bg-gradient-to-br from-sky-400/20 to-indigo-400/20 border border-sky-500/20'
                : 'bg-slate-800/60 border border-white/8'
              }`}
            >
              <svg
                className={`w-4.5 h-4.5 ${proxima ? 'text-sky-400' : 'text-slate-500'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className={`font-semibold text-sm truncate ${proxima ? 'text-white' : 'text-slate-400'}`}>
                {medicoNombre}
              </p>
              {especialidad && (
                <p className={`text-xs truncate ${proxima ? 'text-sky-400' : 'text-slate-500'}`}>
                  {especialidad}
                </p>
              )}
              {hospital && (
                <p className="text-xs text-slate-500 truncate">{hospital}</p>
              )}
            </div>
          </div>
          <StatusBadge estado={cita.estado} />
        </div>

        {/* Fecha y hora */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-400">
            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            {formatDate(cita.fecha_cita)}
          </div>
          {cita.hora_cita && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(cita.hora_cita)}
            </div>
          )}
        </div>

        {/* CTA visual solo para próximas */}
        {proxima && onClick && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5 border-t border-white/5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
            </svg>
            Haz clic para ver QR y opciones
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ══════════════════════════════════════════════════════

const Dashboard: React.FC = () => {
  const { paciente } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchCitas = useCallback(async () => {
    setError(null);
    try {
      const data = await getMisCitas();
      if (isMounted.current) setCitas(data);
    } catch {
      if (isMounted.current) setError('No se pudieron cargar tus citas. Intenta recargar la página.');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCitas(); }, [fetchCitas]);

  /** Se llama desde el modal tras una cancelación exitosa: actualiza estado local */
  const handleCancelSuccess = useCallback((idCita: number) => {
    setCitas((prev) =>
      prev.map((c) =>
        c.id_cita === idCita ? { ...c, estado: 'cancelada' as EstadoCita } : c
      )
    );
  }, []);

  // ── Clasificación ──────────────────────────────────
  const proximasCitas = citas.filter(isProxima);
  const historialCitas = citas.filter((c) => !isProxima(c));

  return (
    <>
      {/* ── Modal de detalles ── */}
      {selectedCita && (
        <DetailModal
          cita={selectedCita}
          onClose={() => setSelectedCita(null)}
          onCancelSuccess={(id) => {
            handleCancelSuccess(id);
            setSelectedCita(null);
          }}
        />
      )}

      <div className="min-h-screen bg-slate-950 pt-20 pb-16">
        {/* Orb decorativo */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-80 bg-gradient-to-b from-sky-500/6 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── HEADER ── */}
          <div className="mb-8 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-slate-400 text-sm font-medium">{greeting()},</p>
                <h1 className="text-3xl font-bold text-white mt-0.5">
                  {paciente?.nombres ?? 'Paciente'}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                    {paciente?.apellidos ?? ''}
                  </span>
                </h1>
              </div>
              <Link
                to="/reservar"
                className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all duration-200 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nueva Cita
              </Link>
            </div>

            {/* Stats */}
            {!loading && citas.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { label: 'Citas Próximas',  value: proximasCitas.length, color: 'text-emerald-400' },
                  { label: 'Total',            value: citas.length,          color: 'text-sky-400' },
                  { label: 'Historial',        value: historialCitas.length, color: 'text-slate-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-900/60 border border-white/8 rounded-xl px-4 py-3">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── LOADING ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
                <div className="absolute inset-0 rounded-full border-4 border-t-sky-400 animate-spin" />
              </div>
              <p className="text-slate-400 text-sm animate-pulse">Cargando tus citas...</p>
            </div>
          )}

          {/* ── ERROR ── */}
          {error && !loading && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* ── CONTENIDO ── */}
          {!loading && !error && (
            <>
              {citas.length === 0 ? (
                /* ── Estado vacío ── */
                <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in-up">
                  <div className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-white/10 flex items-center justify-center mb-6">
                    <svg className="w-9 h-9 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Sin citas registradas</h2>
                  <p className="text-slate-400 text-sm mb-6 max-w-xs">
                    Aún no tienes citas médicas. Reserva tu primera cita con un especialista.
                  </p>
                  <Link
                    to="/reservar"
                    className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-indigo-500 rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Reservar Primera Cita
                  </Link>
                </div>
              ) : (
                <div className="space-y-10 animate-fade-in-up">

                  {/* ── MIS CITAS PRÓXIMAS ── */}
                  <section>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-sky-400" />
                      <h2 className="text-lg font-bold text-white">Mis Citas Próximas</h2>
                      {proximasCitas.length > 0 && (
                        <span className="px-2 py-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 rounded-full">
                          {proximasCitas.length}
                        </span>
                      )}
                    </div>

                    {proximasCitas.length === 0 ? (
                      <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 text-center">
                        <p className="text-slate-500 text-sm">No tienes citas próximas con estado <span className="text-emerald-400 font-medium">reservada</span>.</p>
                        <Link to="/reservar" className="text-sky-400 text-sm font-medium hover:text-sky-300 transition-colors mt-1.5 inline-block">
                          Reservar una cita →
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {proximasCitas.map((cita) => (
                          <CitaCard
                            key={cita.id_cita}
                            cita={cita}
                            onClick={() => setSelectedCita(cita)}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* ── HISTORIAL ── */}
                  {historialCitas.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-1.5 h-5 rounded-full bg-slate-600" />
                        <h2 className="text-lg font-bold text-slate-400">Historial</h2>
                        <span className="px-2 py-0.5 text-xs font-semibold text-slate-500 bg-slate-700/40 border border-white/5 rounded-full">
                          {historialCitas.length}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mb-4">
                        Citas pasadas, completadas o canceladas.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {historialCitas.map((cita) => (
                          <CitaCard
                            key={cita.id_cita}
                            cita={cita}
                            dimmed={cita.estado === 'cancelada'}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
