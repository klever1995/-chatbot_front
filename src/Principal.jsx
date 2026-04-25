import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Campanas from './pages/Campanas'
import Ventas from './pages/Ventas'
import Configuracion from './pages/Configuracion'
import Pedidos from './pages/Pedidos'
import DashboardPedidos from './pages/DashboardPedidos'
import { getEmpresaNombreFromToken } from './services/auth'
import './Principal.css'

export default function Principal() {
  const [seccionActual, setSeccionActual] = useState('dashboard')
  const navigate = useNavigate()

  const empresaNombre = getEmpresaNombreFromToken() || 'Sublimados Admin'

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    navigate('/login')
  }

  const renderSeccion = () => {
    switch(seccionActual) {
      case 'dashboard':
        return <Dashboard />
      case 'campanas':
        return <Campanas />
      case 'ventas':
        return <Ventas />
      case 'configuracion':
        return <Configuracion />
      case 'pedidos':
        return <Pedidos />
      case 'dashboard_pedidos':
        return <DashboardPedidos />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="principal-container">
      <header className="principal-header">
        <div className="principal-logo">
          <img src="/Logo-blanco.png" alt="Aurelia" className="principal-logo-icon" />
          <span>{empresaNombre}</span>
        </div>

        <nav className="principal-nav">
          <a onClick={() => setSeccionActual('dashboard')} className={seccionActual === 'dashboard' ? 'active' : ''}>Dashboard Ventas</a>
          <a onClick={() => setSeccionActual('ventas')} className={seccionActual === 'ventas' ? 'active' : ''}>Ventas</a>
          <a onClick={() => setSeccionActual('dashboard_pedidos')} className={seccionActual === 'dashboard_pedidos' ? 'active' : ''}>Dashboard Pedidos</a>
          <a onClick={() => setSeccionActual('pedidos')} className={seccionActual === 'pedidos' ? 'active' : ''}>Pedidos</a>
          <a onClick={() => setSeccionActual('campanas')} className={seccionActual === 'campanas' ? 'active' : ''}>Campañas</a>
        </nav>

        <div className="header-right">
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>

      </header>

      <main className="principal-content">
        {renderSeccion()}
      </main>
    </div>
  )
}