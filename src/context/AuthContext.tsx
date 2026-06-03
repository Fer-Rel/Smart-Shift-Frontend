import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, loginUser, registerUser } from '../api/medicalApi';
import type {
  AuthResponse,
  LoginPayload,
  PacienteProfile,
  RegisterPayload,
} from '../api/medicalApi';

const TOKEN_KEY = 'smart_shift_token';

// ──────────────────────────────────────────────
// TIPOS DEL CONTEXTO
// ──────────────────────────────────────────────

interface AuthContextValue {
  token: string | null;
  paciente: PacienteProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginPayload) => Promise<void>;
  registerAndLogin: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
}

// ──────────────────────────────────────────────
// CREACIÓN DEL CONTEXTO
// ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ──────────────────────────────────────────────
// PROVIDER
// ──────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [paciente, setPaciente] = useState<PacienteProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Evita race conditions si el componente se desmonta
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  /**
   * Guarda el token en estado y localStorage, luego carga el perfil del paciente.
   */
  const persistToken = useCallback(async (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    try {
      const profile = await getMyProfile();
      if (isMounted.current) setPaciente(profile);
    } catch {
      // Si el token ya no es válido, limpiar
      if (isMounted.current) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setPaciente(null);
      }
    }
  }, []);

  /**
   * Al montar, si hay un token guardado, lo valida cargando el perfil.
   */
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        await persistToken(savedToken);
      }
      if (isMounted.current) setIsLoading(false);
    };

    initAuth();
  }, [persistToken]);

  /**
   * Escucha el evento de 401 emitido por el interceptor de Axios.
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setPaciente(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener('smart_shift_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('smart_shift_unauthorized', handleUnauthorized);
  }, [navigate]);

  // ──────────────────────────────────────────────
  // ACCIONES PÚBLICAS
  // ──────────────────────────────────────────────

  const login = useCallback(
    async (data: LoginPayload) => {
      const authResponse: AuthResponse = await loginUser(data);
      await persistToken(authResponse.access_token);
      navigate('/dashboard', { replace: true });
    },
    [persistToken, navigate]
  );

  const registerAndLogin = useCallback(
    async (data: RegisterPayload) => {
      const authResponse: AuthResponse = await registerUser(data);
      await persistToken(authResponse.access_token);
      navigate('/dashboard', { replace: true });
    },
    [persistToken, navigate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setPaciente(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value: AuthContextValue = {
    token,
    paciente,
    isLoading,
    isAuthenticated: !!token,
    login,
    registerAndLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ──────────────────────────────────────────────
// HOOK PERSONALIZADO
// ──────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return context;
};

export default AuthContext;
