import axiosClient from './axiosClient';

// ══════════════════════════════════════════════
// TIPOS / INTERFACES
// ══════════════════════════════════════════════

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  telefono: string;
  fecha_nacimiento: string; // YYYY-MM-DD
  direccion: string;
}

export interface LoginPayload {
  dni: string;
  password: string;
}

export interface Hospital {
  id_hospital: number;
  nombre: string;
  distrito: string;
  provincia: string;
}

export interface Especialidad {
  id_especialidad: number;
  nombre: string;
  descripcion: string;
}

export interface SlotDisponible {
  hora_inicio: string; // HH:MM
  hora_fin: string;    // HH:MM
}

export interface Medico {
  id_medico: number;
  nombres: string;
  apellidos: string;
  slots_disponibles: SlotDisponible[];
}

export interface PacienteProfile {
  id_paciente?: number;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  fecha_nacimiento?: string;
  direccion?: string;
}

export interface CrearCitaPayload {
  id_medico: number;
  fecha_cita: string; // YYYY-MM-DD
  hora_cita: string;  // HH:MM
}

export type EstadoCita = 'reservada' | 'confirmada' | 'pendiente' | 'cancelada' | 'completada';

export interface Cita {
  id_cita: number;
  fecha_cita: string;
  hora_cita: string;
  estado: EstadoCita;
  codigo_qr?: string;        // Valor alfanumérico del QR (ej. "A1B2C3D4")
  medico_nombre?: string;
  medico_apellidos?: string;
  nombres?: string;
  apellidos?: string;
  especialidad?: string;
  hospital?: string;
  // El backend puede retornar distintos nombres de campo; se acepta cualquiera
  [key: string]: unknown;
}

// ══════════════════════════════════════════════
// 🔓 RUTAS PÚBLICAS
// ══════════════════════════════════════════════

/**
 * Registra un nuevo paciente.
 * POST /api/auth/register
 */
export const registerUser = async (data: RegisterPayload): Promise<AuthResponse> => {
  const response = await axiosClient.post<AuthResponse>('/api/auth/register', data);
  return response.data;
};

/**
 * Inicia sesión con DNI y contraseña.
 * POST /api/auth/login
 */
export const loginUser = async (data: LoginPayload): Promise<AuthResponse> => {
  const response = await axiosClient.post<AuthResponse>('/api/auth/login', data);
  return response.data;
};

/**
 * Obtiene la lista de hospitales disponibles.
 * GET /api/public/hospitales
 */
export const getHospitales = async (): Promise<Hospital[]> => {
  const response = await axiosClient.get<Hospital[]>('/api/hospitales');
  return response.data;
};

/**
 * Obtiene la lista de especialidades médicas disponibles.
 * GET /api/public/especialidades
 */
export const getEspecialidades = async (): Promise<Especialidad[]> => {
  const response = await axiosClient.get<Especialidad[]>('/api/especialidades');
  return response.data;
};

// ══════════════════════════════════════════════
// 🔒 RUTAS PROTEGIDAS (requieren Bearer Token)
// ══════════════════════════════════════════════

/**
 * Obtiene los datos del perfil del paciente autenticado.
 * GET /api/paciente/me
 */
export const getMyProfile = async (): Promise<PacienteProfile> => {
  const response = await axiosClient.get<PacienteProfile>('/api/paciente/me');
  return response.data;
};

/**
 * Busca médicos disponibles según filtros de hospital, especialidad y fecha.
 * GET /api/paciente/medicos-disponibles?hospital_id=X&especialidad_id=Y&fecha=YYYY-MM-DD
 */
export const getMedicosDisponibles = async (
  hospitalId: number,
  especialidadId: number,
  fecha: string
): Promise<Medico[]> => {
  const response = await axiosClient.get<Medico[]>('/api/paciente/medicos-disponibles', {
    params: {
      hospital_id: hospitalId,
      especialidad_id: especialidadId,
      fecha,
    },
  });
  return response.data;
};

/**
 * Crea una nueva cita médica para el paciente autenticado.
 * POST /api/paciente/citas
 */
export const crearCita = async (data: CrearCitaPayload): Promise<Cita> => {
  const response = await axiosClient.post<Cita>('/api/paciente/citas', data);
  return response.data;
};

/**
 * Obtiene todas las citas del paciente autenticado.
 * GET /api/paciente/mis-citas
 */
export const getMisCitas = async (): Promise<Cita[]> => {
  const response = await axiosClient.get<Cita[]>('/api/paciente/mis-citas');
  return response.data;
};

/**
 * Cancela (elimina) una cita por su ID.
 * DELETE /api/paciente/citas/{id_cita}
 */
export const cancelarCita = async (idCita: number): Promise<void> => {
  await axiosClient.delete(`/api/paciente/citas/${idCita}`);
};

/**
 * Obtiene el string del código QR de una cita específica.
 * GET /api/paciente/citas/{id_cita}/qr
 */
export const getCitaQR = async (idCita: number): Promise<string> => {
  const response = await axiosClient.get<string | { qr_code?: string; codigo?: string }>(
    `/api/paciente/citas/${idCita}/qr`
  );
  // El backend puede devolver el string directo o dentro de un objeto
  if (typeof response.data === 'string') {
    return response.data;
  }
  return response.data.qr_code ?? response.data.codigo ?? String(response.data);
};
