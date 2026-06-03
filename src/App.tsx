import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReservarCita from './pages/ReservarCita';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* ── Ruta raíz: redirige al login ── */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Rutas públicas ── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Rutas protegidas (requieren token) ── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reservar"  element={<ReservarCita />} />
        </Route>

        {/* ── Catch-all: cualquier ruta no definida → login ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
