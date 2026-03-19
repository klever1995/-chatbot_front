import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Campanas from './pages/Campanas'
import Ventas from './pages/Ventas'
import Configuracion from './pages/Configuracion'
import './Principal.css'

export default function Principal() {
  return (
    <div className="principal-container">
      <header className="principal-header">
        <span className="principal-logo">📊 Sublimados Admin</span>
        <nav className="principal-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
          <NavLink to="/dashboard/campanas" className={({ isActive }) => isActive ? 'active' : ''}>Campañas</NavLink>
          <NavLink to="/dashboard/ventas" className={({ isActive }) => isActive ? 'active' : ''}>Ventas</NavLink>
          <NavLink to="/dashboard/configuracion" className={({ isActive }) => isActive ? 'active' : ''}>Configuración</NavLink>
        </nav>
      </header>
      <main className="principal-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/campanas" element={<Campanas />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </main>
    </div>
  )
}