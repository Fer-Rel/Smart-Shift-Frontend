import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  crearCita,
  getEspecialidades,
  getHospitales,
  getMedicosDisponibles,
} from '../api/medicalApi';
import type { Especialidad, Hospital, Medico, SlotDisponible } from '../api/medicalApi';
import { ChatWidget } from '../components/ChatWidget';

// ──────────────────────────────────────────────
// TIPOS DE ESTADO DE SELECCIÓN
// ──────────────────────────────────────────────
interface Selection {
  hospitalId: number | null;
  especialidadId: number | null;
  fecha: string;
}

interface SelectedSlot {
  medicoId: number;
  medicoNombre: string;
  slot: SlotDisponible;
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
const getTodayStr = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
};

// ──────────────────────────────────────────────
// COMPONENTE SELECT
// ──────────────────────────────────────────────
interface SelectFieldProps {
  id: string;
  label: string;
  value: number | string | null;
  onChange: (value: number) => void;
  options: { value: number; label: string }[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  id, label, value, onChange, options, placeholder, disabled, loading
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled || loading}
        className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-800/60 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 appearance-none"
      >
        <option value="" disabled className="text-slate-500 bg-slate-900">
          {loading ? 'Cargando...' : placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        {loading
          ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        }
      </div>
    </div>
  </div>
);

// ──────────────────────────────────────────────
// TARJETA DE MÉDICO
// ──────────────────────────────────────────────
interface MedicoCardProps {
  medico: Medico;
  selectedSlot: SelectedSlot | null;
  onSlotSelect: (slot: SelectedSlot) => void;
  isConfirming: boolean;
}

const MedicoCard: React.FC<MedicoCardProps> = ({ medico, selectedSlot, onSlotSelect, isConfirming }) => {
  const isThisSelected = selectedSlot?.medicoId === medico.id_medico;

  // Generar color de avatar determinístico
  const colors = [
    'from-sky-400 to-cyan-400',
    'from-indigo-400 to-violet-400',
    'from-emerald-400 to-teal-400',
    'from-amber-400 to-orange-400',
    'from-rose-400 to-pink-400',
  ];
  const colorClass = colors[medico.id_medico % colors.length];

  return (
    <div
      className={`bg-slate-900/60 border rounded-2xl p-5 transition-all duration-200
        ${isThisSelected
          ? 'border-sky-500/50 bg-sky-500/5 shadow-lg shadow-sky-500/10'
          : 'border-white/10 hover:border-white/20'
        }`}
    >
      {/* Header del médico */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg`}>
          {medico.nombres.charAt(0)}{medico.apellidos.charAt(0)}
        </div>
        <div>
          <p className="text-white font-semibold">Dr. {medico.nombres} {medico.apellidos}</p>
          {medico.slots_disponibles.length > 0 && (
            <p className="text-slate-400 text-xs mt-0.5">
              {medico.slots_disponibles.length} horario{medico.slots_disponibles.length !== 1 ? 's' : ''} disponible{medico.slots_disponibles.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Slots */}
      {medico.slots_disponibles.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-2">Sin horarios disponibles</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {medico.slots_disponibles.map((slot) => {
            const isSlotSelected = isThisSelected && selectedSlot?.slot.hora_inicio === slot.hora_inicio;
            return (
              <button
                key={`${slot.hora_inicio}-${slot.hora_fin}`}
                onClick={() => onSlotSelect({
                  medicoId: medico.id_medico,
                  medicoNombre: `Dr. ${medico.nombres} ${medico.apellidos}`,
                  slot,
                })}
                disabled={isConfirming}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-150 active:scale-95 disabled:cursor-not-allowed
                  ${isSlotSelected
                    ? 'bg-sky-500 border-sky-400 text-white shadow-md shadow-sky-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-sky-500/50 hover:text-sky-300 hover:bg-sky-500/10'
                  }`}
              >
                {slot.hora_inicio.substring(0, 5)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────
const ReservarCita: React.FC = () => {
  const navigate = useNavigate();

  // Datos catálogo
  const [hospitales, setHospitales] = useState<Hospital[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Selección de filtros
  const [selection, setSelection] = useState<Selection>({
    hospitalId: null,
    especialidadId: null,
    fecha: '',
  });

  // Médicos disponibles
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [medicosError, setMedicosError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Slot seleccionado y confirmación
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [successCita, setSuccessCita] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ──────────────────────────────────────────────
  // CARGA DEL CATÁLOGO
  // ──────────────────────────────────────────────
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [hosp, espec] = await Promise.all([getHospitales(), getEspecialidades()]);
        if (isMounted.current) {
          setHospitales(hosp);
          setEspecialidades(espec);
        }
      } catch {
        if (isMounted.current) {
          setCatalogError('No se pudo cargar el catálogo. Verifica tu conexión e intenta recargar.');
        }
      } finally {
        if (isMounted.current) setLoadingCatalog(false);
      }
    };
    loadCatalog();
  }, []);

  // ──────────────────────────────────────────────
  // BÚSQUEDA DE MÉDICOS — se dispara cuando los 3 filtros están completos
  // ──────────────────────────────────────────────
  const searchMedicos = useCallback(async (sel: Selection) => {
    if (!sel.hospitalId || !sel.especialidadId || !sel.fecha) return;

    setLoadingMedicos(true);
    setMedicosError(null);
    setMedicos([]);
    setSelectedSlot(null);
    setHasSearched(true);

    try {
      const data = await getMedicosDisponibles(sel.hospitalId, sel.especialidadId, sel.fecha);
      if (isMounted.current) setMedicos(data);
    } catch {
      if (isMounted.current) {
        setMedicosError('No se pudieron cargar los médicos disponibles. Intenta con otra fecha o especialidad.');
      }
    } finally {
      if (isMounted.current) setLoadingMedicos(false);
    }
  }, []);

  const handleFilterChange = (key: keyof Selection, value: number | string) => {
    const newSelection = { ...selection, [key]: value };
    setSelection(newSelection);
    setSelectedSlot(null);
    setConfirmError(null);

    // Disparar búsqueda si los 3 filtros están listos
    if (
      newSelection.hospitalId &&
      newSelection.especialidadId &&
      newSelection.fecha
    ) {
      searchMedicos(newSelection);
    }
  };

  // ──────────────────────────────────────────────
  // CONFIRMACIÓN DE CITA
  // ──────────────────────────────────────────────
  const handleConfirmCita = async () => {
    if (!selectedSlot || !selection.fecha) return;

    setIsConfirming(true);
    setConfirmError(null);

    try {
      await crearCita({
        id_medico: selectedSlot.medicoId,
        fecha_cita: selection.fecha,
        hora_cita: selectedSlot.slot.hora_inicio,
      });
      if (isMounted.current) {
        setSuccessCita(true);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const detail = error?.response?.data?.detail;
      if (isMounted.current) {
        setConfirmError(typeof detail === 'string' ? detail : 'No se pudo reservar la cita. Intenta nuevamente.');
      }
    } finally {
      if (isMounted.current) setIsConfirming(false);
    }
  };

  // ──────────────────────────────────────────────
  // PANTALLA DE ÉXITO
  // ──────────────────────────────────────────────
  if (successCita && selectedSlot) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fade-in-up">
          <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Cita Reservada!</h2>
          <p className="text-slate-400 mb-6">Tu cita ha sido confirmada exitosamente.</p>

          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 mb-8 text-left space-y-3">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <p className="text-white font-medium">{selectedSlot.medicoNombre}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
              <p className="text-slate-300">{formatDisplayDate(selection.fecha)}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-300">{selectedSlot.slot.hora_inicio.substring(0, 5)} — {selectedSlot.slot.hora_fin.substring(0, 5)}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95"
            >
              Ver mis citas
            </button>
            <button
              onClick={() => {
                setSuccessCita(false);
                setSelectedSlot(null);
                setSelection({ hospitalId: null, especialidadId: null, fecha: '' });
                setMedicos([]);
                setHasSearched(false);
              }}
              className="px-6 py-2.5 font-semibold text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl transition-all active:scale-95"
            >
              Reservar otra cita
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canSearch = !!(selection.hospitalId && selection.especialidadId && selection.fecha);

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16">
      {/* Fondo decorativo */}
      <div className="fixed top-0 right-0 w-[600px] h-96 bg-gradient-to-bl from-indigo-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── HEADER ── */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-white">Reservar Cita</h1>
          <p className="text-slate-400 mt-1 text-sm">Selecciona hospital, especialidad y fecha para ver los médicos disponibles.</p>
        </div>

        {/* ── ERROR DE CATÁLOGO ── */}
        {catalogError && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-red-300 text-sm">{catalogError}</p>
          </div>
        )}

        {/* ── PASO 1: FILTROS ── */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-xs font-bold">1</div>
            <h2 className="text-base font-semibold text-white">Selecciona tus preferencias</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField
              id="hospital"
              label="Hospital"
              value={selection.hospitalId}
              onChange={(v) => handleFilterChange('hospitalId', v)}
              options={hospitales.map((h) => ({ value: h.id_hospital, label: h.nombre }))}
              placeholder="Selecciona un hospital"
              loading={loadingCatalog}
            />
            <SelectField
              id="especialidad"
              label="Especialidad"
              value={selection.especialidadId}
              onChange={(v) => handleFilterChange('especialidadId', v)}
              options={especialidades.map((e) => ({ value: e.id_especialidad, label: e.nombre }))}
              placeholder="Selecciona especialidad"
              loading={loadingCatalog}
            />
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-slate-300 mb-1.5">
                Fecha de la Cita
              </label>
              <input
                id="fecha"
                type="date"
                min={getTodayStr()}
                value={selection.fecha}
                onChange={(e) => handleFilterChange('fecha', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 disabled:opacity-50 transition-all duration-200"
              />
            </div>
          </div>

          {/* Indicador de progreso */}
          <div className="flex items-center gap-2 mt-5">
            {[
              { done: !!selection.hospitalId, label: 'Hospital' },
              { done: !!selection.especialidadId, label: 'Especialidad' },
              { done: !!selection.fecha, label: 'Fecha' },
            ].map(({ done, label }, i) => (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-1.5 text-xs transition-all ${done ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full border ${done ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'} flex items-center justify-center`}>
                    {done && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                  </div>
                  {label}
                </div>
                {i < 2 && <div className={`flex-1 h-px ${done && i === 0 ? 'bg-slate-600' : 'bg-slate-800'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── PASO 2: MÉDICOS ── */}
        {(canSearch || hasSearched) && (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-xs font-bold">2</div>
              <h2 className="text-base font-semibold text-white">Elige tu médico y horario</h2>
              {selection.fecha && (
                <span className="ml-1 text-xs text-slate-400 font-normal">— {formatDisplayDate(selection.fecha)}</span>
              )}
            </div>

            {loadingMedicos && (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-sky-400 animate-spin" />
                </div>
                <p className="text-slate-400 text-sm">Buscando médicos disponibles...</p>
              </div>
            )}

            {medicosError && !loadingMedicos && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-4">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <p className="text-amber-300 text-sm">{medicosError}</p>
              </div>
            )}

            {!loadingMedicos && !medicosError && hasSearched && medicos.length === 0 && (
              <div className="text-center py-16 bg-slate-900/40 border border-white/5 rounded-2xl">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/60 border border-white/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-1">Sin médicos disponibles</p>
                <p className="text-slate-400 text-sm">No hay horarios libres para esta combinación. Intenta con otra fecha.</p>
              </div>
            )}

            {!loadingMedicos && medicos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicos.map((medico) => (
                  <MedicoCard
                    key={medico.id_medico}
                    medico={medico}
                    selectedSlot={selectedSlot}
                    onSlotSelect={setSelectedSlot}
                    isConfirming={isConfirming}
                  />
                ))}
              </div>
            )}

            {/* Panel de confirmación sticky */}
            {selectedSlot && (
              <div className="mt-6 p-5 bg-slate-900/80 border border-sky-500/30 rounded-2xl shadow-xl shadow-sky-500/5 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Confirmar Reserva</p>
                    <p className="text-white font-semibold">{selectedSlot.medicoNombre}</p>
                    <p className="text-slate-300 text-sm">
                      {formatDisplayDate(selection.fecha)} · {selectedSlot.slot.hora_inicio.substring(0, 5)} — {selectedSlot.slot.hora_fin.substring(0, 5)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {confirmError && (
                      <p className="text-xs text-red-400 text-right">{confirmError}</p>
                    )}
                    <button
                      onClick={handleConfirmCita}
                      disabled={isConfirming}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all active:scale-[0.98]"
                    >
                      {isConfirming ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Reservando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Confirmar Cita
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <ChatWidget 
        hospitalId={selection.hospitalId}
        especialidadId={selection.especialidadId}
        fecha={selection.fecha}
      />
    </div>
  );
};

export default ReservarCita;
