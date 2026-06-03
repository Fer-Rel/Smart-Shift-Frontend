import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, paciente, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg
     ${isActive
       ? 'text-sky-400 bg-sky-400/10'
       : 'text-slate-300 hover:text-white hover:bg-white/5'
     }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── LOGO ── */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-lg shadow-sky-500/25 group-hover:shadow-sky-500/40 transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 4v4m0 8v4M4 12h4m8 0h4M6.343 6.343l2.829 2.829m5.656 5.656 2.829 2.829M6.343 17.657l2.829-2.829m5.656-5.656 2.829-2.829" />
              </svg>
            </div>
            <div>
              <span className="text-white font-bold text-base tracking-tight">Smart</span>
              <span className="text-sky-400 font-bold text-base tracking-tight">Shift</span>
            </div>
          </Link>

          {/* ── NAVEGACIÓN DESKTOP ── */}
          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/reservar" className={navLinkClass}>
                  Reservar Cita
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Iniciar Sesión
                </NavLink>
                <NavLink to="/register" className={navLinkClass}>
                  Registrarse
                </NavLink>
              </>
            )}
          </nav>

          {/* ── ACCIONES DERECHA ── */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Avatar + nombre */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {paciente?.nombres?.charAt(0) ?? 'P'}
                  </div>
                  <span className="text-sm text-slate-200 font-medium max-w-[120px] truncate">
                    {paciente?.nombres ?? 'Paciente'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 rounded-lg shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 transition-all duration-200 active:scale-95"
              >
                Empezar ahora
              </button>
            )}
          </div>

          {/* ── HAMBURGER MOBILE ── */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* ── MENÚ MOBILE ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-fade-in">
          {isAuthenticated ? (
            <>
              {paciente && (
                <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-sm font-bold text-white uppercase">
                    {paciente.nombres?.charAt(0) ?? 'P'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{paciente.nombres} {paciente.apellidos}</p>
                    <p className="text-xs text-slate-400">{paciente.email}</p>
                  </div>
                </div>
              )}
              <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Dashboard
              </NavLink>
              <NavLink to="/reservar" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Reservar Cita
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Iniciar Sesión
              </NavLink>
              <NavLink to="/register" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Registrarse
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
