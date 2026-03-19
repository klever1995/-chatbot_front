import { useState, useEffect } from 'react'
import { DollarSign, Package, TrendingUp, Calendar, Star, ShoppingCart } from 'lucide-react'
import { obtenerEstadisticas, listarVentas, agruparVentasPorDia, agruparVentasPorCampania, obtenerVentasRecientes } from '../services/ventas'
import { getEmpresaIdFromToken } from '../services/auth'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [ventas, setVentas] = useState([])
  const [ventasRecientes, setVentasRecientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroCampania, setFiltroCampania] = useState('todas')
  const [campanas, setCampanas] = useState([])
  const [todasLasCampanas, setTodasLasCampanas] = useState([]) // Nuevo estado

  // Cargar campañas disponibles solo una vez al inicio
  useEffect(() => {
    cargarCampanasDisponibles()
  }, [])

  // Cargar datos filtrados cuando cambia el filtro
  useEffect(() => {
    cargarDatos()
  }, [filtroCampania])

  const cargarCampanasDisponibles = async () => {
    try {
      const empresaId = getEmpresaIdFromToken()
      // Cargar ventas sin filtro de campaña para obtener todas las campañas
      const ventasData = await listarVentas({ 
        empresa_id: empresaId, 
        limit: 1000, 
        estado: 'confirmada' 
      })
      
      const campanasUnicas = [...new Set(ventasData.map(v => v.campania_id).filter(Boolean))]
      setTodasLasCampanas(campanasUnicas) // Guardamos la lista completa
      setCampanas(campanasUnicas) // Inicializamos el estado original
    } catch (error) {
      console.error('Error cargando campañas:', error)
    }
  }

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const empresaId = getEmpresaIdFromToken()
      
      // Preparar filtros
      const filtros = { empresa_id: empresaId }
      if (filtroCampania !== 'todas') {
        filtros.campania_id = filtroCampania
      }

      // Cargar estadísticas y ventas en paralelo
      const [statsData, ventasData] = await Promise.all([
        obtenerEstadisticas(filtros),
        listarVentas({ ...filtros, limit: 100, estado: 'confirmada' })
      ])

      setStats(statsData)
      setVentas(ventasData)
      setVentasRecientes(obtenerVentasRecientes(ventasData, 8))
      
      // NO actualizamos campanas aquí para mantener la lista completa

    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Procesar datos para gráficas
  const ventasPorDia = agruparVentasPorDia(ventas)
  const ventasPorCampania = agruparVentasPorCampania(ventas).slice(0, 5) // Top 5

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Filtro de campaña */}
      <div className="dashboard-filtros">
        <label>Campaña:</label>
        <select 
          value={filtroCampania} 
          onChange={(e) => setFiltroCampania(e.target.value)}
          className="filtro-select"
        >
          <option value="todas">Todas las campañas</option>
          {todasLasCampanas.map(camp => ( // Usamos todasLasCampanas en lugar de campanas
            <option key={camp} value={camp}>{camp}</option>
          ))}
        </select>
      </div>

      {/* KPIs */}
      <div className="dashboard-kpis">
        <div className="kpi-card">
          <div className="kpi-icon blue">
            <DollarSign size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ingresos Totales</span>
            <span className="kpi-value">${stats?.total_ingresos?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green">
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ventas Totales</span>
            <span className="kpi-value">{stats?.total_ventas || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Promedio por Venta</span>
            <span className="kpi-value">${stats?.promedio_venta?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="dashboard-graficas">
        <div className="grafica-card">
          <h3>Ventas por Día</h3>
          <div className="barras-container">
            {ventasPorDia.slice(-7).map((dia, idx) => (
              <div key={idx} className="barra-item">
                <div 
                  className="barra" 
                  style={{ height: `${(dia.total / Math.max(...ventasPorDia.map(d => d.total)) * 100)}px` }}
                ></div>
                <span className="barra-label">{new Date(dia.fecha).toLocaleDateString().slice(0,5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grafica-card">
          <h3>Top Campañas</h3>
          <div className="campanas-lista">
            {ventasPorCampania.map((camp, idx) => (
              <div key={idx} className="campana-item">
                <span className="campana-nombre">{camp.campania}</span>
                <div className="campana-barra-fondo">
                  <div 
                    className="campana-barra" 
                    style={{ width: `${(camp.total / ventasPorCampania[0].total) * 100}%` }}
                  ></div>
                </div>
                <span className="campana-valor">${camp.total.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ventas recientes */}
      <div className="dashboard-recientes">
        <h3>Ventas Recientes</h3>
        <div className="tabla-wrapper">
          <table className="tabla-recientes">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Campaña</th>
                <th>Cantidad</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ventasRecientes.map(venta => (
                <tr key={venta.id}>
                  <td className="producto-nombre">{venta.producto_nombre}</td>
                  <td>{venta.campania_id || '—'}</td>
                  <td>{venta.cantidad}</td>
                  <td className="monto">${venta.monto_total.toFixed(2)}</td>
                  <td>{new Date(venta.fecha_venta).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}