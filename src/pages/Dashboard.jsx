import { useState, useEffect } from 'react'
import { DollarSign, Package, TrendingUp, Calendar, Star, ShoppingCart } from 'lucide-react'
import { obtenerEstadisticas, listarVentas, agruparVentasPorDia, agruparVentasPorCampania, obtenerVentasRecientes } from '../services/ventas'
import { getEmpresaIdFromToken } from '../services/auth'
import { useSocket } from '../hooks/useSocket'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [ventas, setVentas] = useState([])
  const [ventasRecientes, setVentasRecientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroCampania, setFiltroCampania] = useState('todas')
  const [campanas, setCampanas] = useState([])
  const [todasLasCampanas, setTodasLasCampanas] = useState([])
  const [ventasGlobales, setVentasGlobales] = useState([])
  const [statsGlobales, setStatsGlobales] = useState(null)

  // WebSocket hook
  const { isConnected, joinEmpresa, onNuevaVenta } = useSocket()

  // Cargar campañas disponibles y datos globales solo una vez al inicio
  useEffect(() => {
    cargarCampanasDisponibles()
    cargarDatosGlobales()
  }, [])

  // Conectar WebSocket y unirse a la sala de la empresa
  useEffect(() => {
    const empresaId = getEmpresaIdFromToken()
    if (empresaId && isConnected) {
      joinEmpresa(empresaId)
    }
  }, [isConnected, joinEmpresa])

  // Escuchar evento de nueva venta (actualización silenciosa)
  useEffect(() => {
    const unsubscribe = onNuevaVenta((nuevaVenta) => {
      console.log('📢 Nueva venta recibida en tiempo real:', nuevaVenta)
      cargarDatos(true)
      cargarCampanasDisponibles()
      cargarDatosGlobales()
    })
    return unsubscribe
  }, [onNuevaVenta])

  // Cargar datos filtrados cuando cambia el filtro
  useEffect(() => {
    cargarDatos()
  }, [filtroCampania])

  const cargarCampanasDisponibles = async () => {
    try {
      const empresaId = getEmpresaIdFromToken()
      const ventasData = await listarVentas({ 
        empresa_id: empresaId, 
        limit: 1000, 
        estado: 'confirmada' 
      })
      
      const campanasUnicas = [...new Set(ventasData.map(v => v.campania_id).filter(Boolean))]
      setTodasLasCampanas(campanasUnicas)
      setCampanas(campanasUnicas)
    } catch (error) {
      console.error('Error cargando campañas:', error)
    }
  }

  // Cargar datos globales (sin filtro de campaña)
  const cargarDatosGlobales = async () => {
    try {
      const empresaId = getEmpresaIdFromToken()
      const filtros = { empresa_id: empresaId }
      const [statsData, ventasData] = await Promise.all([
        obtenerEstadisticas(filtros),
        listarVentas({ ...filtros, limit: 1000, estado: 'confirmada' })
      ])
      setStatsGlobales(statsData)
      setVentasGlobales(ventasData)
    } catch (error) {
      console.error('Error cargando datos globales:', error)
    }
  }

  const cargarDatos = async (silent = false) => {
    if (!silent) {
      setLoading(true)
    }
    try {
      const empresaId = getEmpresaIdFromToken()
      
      const filtros = { empresa_id: empresaId }
      if (filtroCampania !== 'todas') {
        filtros.campania_id = filtroCampania
      }

      const [statsData, ventasData] = await Promise.all([
        obtenerEstadisticas(filtros),
        listarVentas({ ...filtros, limit: 100, estado: 'confirmada' })
      ])

      setStats(statsData)
      setVentas(ventasData)
      setVentasRecientes(obtenerVentasRecientes(ventasData, 8))
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  // Calcular ventas del día actual
  const calcularVentasDelDia = () => {
    const hoy = new Date().toISOString().split('T')[0]
    const ventasHoy = ventas.filter(v => v.fecha_venta.split('T')[0] === hoy)
    const totalVentasHoy = ventasHoy.reduce((sum, v) => sum + v.cantidad, 0)
    return totalVentasHoy
  }

  const ventasDelDia = calcularVentasDelDia()

  // Calcular porcentajes de la campaña seleccionada respecto al total global
  const calcularPorcentajesCampaña = () => {
    if (filtroCampania === 'todas' || !statsGlobales) {
      return null
    }
    const ventasCampania = ventasGlobales.filter(v => v.campania_id === filtroCampania)
    const totalVentasCampania = ventasCampania.reduce((sum, v) => sum + v.cantidad, 0)
    const totalIngresosCampania = ventasCampania.reduce((sum, v) => sum + v.monto_total, 0)
    
    const porcentajeVentas = statsGlobales.total_ventas > 0 
      ? (totalVentasCampania / statsGlobales.total_ventas) * 100 
      : 0
    const porcentajeIngresos = statsGlobales.total_ingresos > 0 
      ? (totalIngresosCampania / statsGlobales.total_ingresos) * 100 
      : 0
      
    return { porcentajeVentas, porcentajeIngresos }
  }

  const porcentajes = calcularPorcentajesCampaña()

  // Procesar datos para gráficas
  const ventasPorDiaOriginal = agruparVentasPorDia(ventas)
  const ventasPorCampania = agruparVentasPorCampania(ventas).slice(0, 5)

  // Función para generar rango continuo de fechas (últimos 7 días)
  const generarRangoFechas = (datos, dias = 7) => {
    if (!datos.length) return []
    
    const mapaPorFecha = new Map()
    datos.forEach(d => {
      mapaPorFecha.set(d.fecha, d.total)
    })
    
    const fechasOrdenadas = [...datos.map(d => d.fecha)].sort()
    const ultimaFechaStr = fechasOrdenadas[fechasOrdenadas.length - 1]
    
    const resultado = []
    for (let i = dias - 1; i >= 0; i--) {
      const fechaBase = new Date(ultimaFechaStr)
      fechaBase.setUTCDate(fechaBase.getUTCDate() - i)
      
      const año = fechaBase.getUTCFullYear()
      const mes = String(fechaBase.getUTCMonth() + 1).padStart(2, '0')
      const dia = String(fechaBase.getUTCDate()).padStart(2, '0')
      const fechaStr = `${año}-${mes}-${dia}`
      
      resultado.push({
        fecha: fechaBase,
        fechaStr: fechaStr,
        total: mapaPorFecha.get(fechaStr) || 0
      })
    }
    return resultado
  }

  // Obtener los últimos 7 días con rango continuo
  const ventasUltimos7Dias = generarRangoFechas(ventasPorDiaOriginal, 7)
  
  // Calcular el máximo total para la escala de las barras
  const maxTotal = ventasUltimos7Dias.length > 0 
    ? Math.max(...ventasUltimos7Dias.map(d => d.total)) 
    : 1

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
      {/* Indicador de conexión WebSocket */}
      <div className="socket-status" style={{ position: 'fixed', bottom: 10, right: 10, fontSize: 10, padding: '4px 8px', borderRadius: 4, background: '#1a1c24', color: isConnected ? '#10b981' : '#ef4444', zIndex: 9999 }}>
        {isConnected ? '🟢 Tiempo real activo' : '🔴 Conectando...'}
      </div>

      {/* Filtro de campaña */}
      <div className="dashboard-filtros">
        <label>Campaña:</label>
        <select 
          value={filtroCampania} 
          onChange={(e) => setFiltroCampania(e.target.value)}
          className="filtro-select"
        >
          <option value="todas">Todas las campañas</option>
          {todasLasCampanas.map(camp => (
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

        {/* NUEVO KPI: Ventas del día (reemplaza promedio) */}
        <div className="kpi-card">
          <div className="kpi-icon purple">
            <Calendar size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ventas del día</span>
            <span className="kpi-value">{ventasDelDia}</span>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="dashboard-graficas">
        <div className="grafica-card">
          <h3>Ventas por Día</h3>
          <div className="barras-container">
            {ventasUltimos7Dias.map((dia, idx) => {
              const alturaPorcentaje = maxTotal > 0 ? (dia.total / maxTotal) * 100 : 0
              const fechaMostrar = dia.fechaStr.slice(5).replace('-', '/')
              return (
                <div key={idx} className="barra-item">
                  <div 
                    className="barra" 
                    style={{ 
                      height: `${Math.max(alturaPorcentaje, 4)}px`,
                      backgroundColor: dia.total > 0 ? '#3b82f6' : '#e5e7eb'
                    }}
                  ></div>
                  <span className="barra-label">{fechaMostrar}</span>
                  {dia.total > 0 && (
                    <span className="barra-valor">${dia.total.toFixed(2)}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* GRÁFICA DINÁMICA: Top Campañas o Porcentajes según filtro */}
        <div className="grafica-card">
          <h3>{filtroCampania === 'todas' ? 'Top Campañas' : `Impacto de la campaña`}</h3>
          {filtroCampania === 'todas' ? (
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
          ) : (
            <div className="porcentajes-container">
              <div className="porcentaje-item">
                <svg width="120" height="120" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#2a2a30" strokeWidth="3" />
                  <circle 
                    cx="20" 
                    cy="20" 
                    r="16" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="3" 
                    strokeDasharray={`${(porcentajes?.porcentajeVentas / 100) * 100} 100`}
                    strokeDashoffset="0"
                    transform="rotate(-90 20 20)"
                  />
                  <text x="20" y="24" textAnchor="middle" fill="#e0e2e8" fontSize="10" fontWeight="bold">
                    {porcentajes?.porcentajeVentas.toFixed(0)}%
                  </text>
                </svg>
                <span className="porcentaje-label">Ventas</span>
                </div>
              <div className="porcentaje-item">
                <svg width="120" height="120" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#2a2a30" strokeWidth="3" />
                  <circle 
                    cx="20" 
                    cy="20" 
                    r="16" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="3" 
                    strokeDasharray={`${(porcentajes?.porcentajeIngresos / 100) * 100} 100`}
                    strokeDashoffset="0"
                    transform="rotate(-90 20 20)"
                  />
                  <text x="20" y="24" textAnchor="middle" fill="#e0e2e8" fontSize="10" fontWeight="bold">
                    {porcentajes?.porcentajeIngresos.toFixed(0)}%
                  </text>
                </svg>
                <span className="porcentaje-label">Ingresos</span>
                </div>
            </div>
          )}
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
                  <td className="producto-nombre">{venta.producto_nombre}       </td>
                  <td>{venta.campania_id || '—'}</td>
                  <td>{venta.cantidad}</td>
                  <td className="monto">${venta.monto_total.toFixed(2)}</td>
                  <td>{venta.fecha_venta.split('T')[0].split('-').reverse().join('/')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}