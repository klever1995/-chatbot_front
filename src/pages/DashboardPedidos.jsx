import { useState, useEffect } from 'react'
import { DollarSign, Package, Calendar, TrendingUp, ShoppingBag } from 'lucide-react'
import { obtenerEstadisticasPedidos, listarPedidos, agruparPedidosPorDia, agruparPedidosPorCampania, obtenerPedidosRecientes } from '../services/pedidos'
import { listarDocumentos } from '../services/documentos'
import { getEmpresaIdFromToken } from '../services/auth'
import { useSocket } from '../hooks/useSocket'
import '../styles/DashboardPedidos.css'

export default function DashboardPedidos() {
  const [stats, setStats] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [pedidosRecientes, setPedidosRecientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroCampania, setFiltroCampania] = useState('todas')
  const [campanas, setCampanas] = useState([])
  const [todasLasCampanas, setTodasLasCampanas] = useState([])
  const [pedidosGlobales, setPedidosGlobales] = useState([])
  const [statsGlobales, setStatsGlobales] = useState(null)
  const [documentosMap, setDocumentosMap] = useState({})
  const [documentosList, setDocumentosList] = useState([])

  // WebSocket hook
  const { isConnected, joinEmpresa, onNuevoPedido, onPedidoActualizado } = useSocket()

  // Cargar documentos disponibles al inicio
  useEffect(() => {
    cargarDocumentos()
  }, [])

  // Cargar campañas disponibles y datos globales
  useEffect(() => {
    cargarCampanasDisponibles()
    cargarDatosGlobales()
  }, [documentosMap])

  // Conectar WebSocket y unirse a la sala de la empresa
  useEffect(() => {
    const empresaId = getEmpresaIdFromToken()
    if (empresaId && isConnected) {
      joinEmpresa(empresaId)
    }
  }, [isConnected, joinEmpresa])

  // Escuchar eventos de pedidos en tiempo real
  useEffect(() => {
    const unsubscribeNuevo = onNuevoPedido((nuevoPedido) => {
      console.log('📢 Nuevo pedido recibido en tiempo real:', nuevoPedido)
      cargarDatos(true)
      cargarCampanasDisponibles()
      cargarDatosGlobales()
      cargarDocumentos()
    })
    const unsubscribeActualizado = onPedidoActualizado((pedidoActualizado) => {
      console.log('📢 Pedido actualizado en tiempo real:', pedidoActualizado)
      cargarDatos(true)
      cargarCampanasDisponibles()
      cargarDatosGlobales()
    })
    return () => {
      unsubscribeNuevo()
      unsubscribeActualizado()
    }
  }, [onNuevoPedido, onPedidoActualizado])

  // Cargar datos filtrados cuando cambia el filtro
  useEffect(() => {
    cargarDatos()
  }, [filtroCampania])

  const cargarDocumentos = async () => {
    try {
      const empresaId = getEmpresaIdFromToken()
      const docs = await listarDocumentos(empresaId)
      const map = {}
      docs.forEach(doc => {
        if (doc.campania_id) {
          map[doc.campania_id] = doc.nombre
        }
      })
      setDocumentosMap(map)
      setDocumentosList(docs)
    } catch (error) {
      console.error('Error cargando documentos:', error)
    }
  }

  const cargarCampanasDisponibles = async () => {
    try {
      const campanasConNombre = documentosList
        .filter(doc => doc.campania_id && doc.tipo_campania === 'pedido_multiple')
        .map(doc => ({
          id: doc.campania_id,
          nombre: doc.nombre
        }))
      setTodasLasCampanas(campanasConNombre)
      setCampanas(campanasConNombre)
    } catch (error) {
      console.error('Error cargando campañas:', error)
    }
  }

  const cargarDatosGlobales = async () => {
    try {
      const empresaId = getEmpresaIdFromToken()
      const filtros = { empresa_id: empresaId }
      const [statsData, pedidosData] = await Promise.all([
        obtenerEstadisticasPedidos(filtros),
        listarPedidos({ ...filtros, limit: 1000, estado: 'confirmado' })
      ])
      setStatsGlobales(statsData)
      setPedidosGlobales(pedidosData)
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

      const [statsData, pedidosData] = await Promise.all([
        obtenerEstadisticasPedidos(filtros),
        listarPedidos({ ...filtros, limit: 100, estado: 'confirmado' })
      ])

      setStats(statsData)
      setPedidos(pedidosData)
      setPedidosRecientes(obtenerPedidosRecientes(pedidosData, 8))
    } catch (error) {
      console.error('Error cargando dashboard de pedidos:', error)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  // Calcular pedidos del día actual
  const calcularPedidosDelDia = () => {
    const hoy = new Date().toISOString().split('T')[0]
    const pedidosHoy = pedidos.filter(p => p.fecha_creacion.split('T')[0] === hoy)
    return pedidosHoy.length
  }

  const pedidosDelDia = calcularPedidosDelDia()

  // Calcular porcentajes de la campaña seleccionada respecto al total global
  const calcularPorcentajesCampaña = () => {
    if (filtroCampania === 'todas' || !statsGlobales) {
      return null
    }
    const pedidosCampania = pedidosGlobales.filter(p => p.campania_id === filtroCampania)
    const totalPedidosCampania = pedidosCampania.length
    const totalIngresosCampania = pedidosCampania.reduce((sum, p) => sum + p.monto_total, 0)
    
    const porcentajePedidos = statsGlobales.total_pedidos > 0 
      ? (totalPedidosCampania / statsGlobales.total_pedidos) * 100 
      : 0
    const porcentajeIngresos = statsGlobales.total_ingresos > 0 
      ? (totalIngresosCampania / statsGlobales.total_ingresos) * 100 
      : 0
      
    return { porcentajePedidos, porcentajeIngresos }
  }

  const porcentajes = calcularPorcentajesCampaña()

  // Procesar datos para gráficas
  const pedidosPorDiaOriginal = agruparPedidosPorDia(pedidos)
  const pedidosPorCampania = agruparPedidosPorCampania(pedidos).slice(0, 5)

  // Función para generar rango continuo de fechas (últimos 7 días)
  const generarRangoFechas = (datos, dias = 7) => {
    if (!datos.length) return []
    
    const mapaPorFecha = new Map()
    datos.forEach(d => {
      mapaPorFecha.set(d.fecha, d.cantidad)
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
        cantidad: mapaPorFecha.get(fechaStr) || 0
      })
    }
    return resultado
  }

  // Obtener los últimos 7 días con rango continuo
  const pedidosUltimos7Dias = generarRangoFechas(pedidosPorDiaOriginal, 7)
  
  // Calcular el máximo para la escala de las barras
  const maxCantidad = pedidosUltimos7Dias.length > 0 
    ? Math.max(...pedidosUltimos7Dias.map(d => d.cantidad)) 
    : 1

  if (loading) {
    return (
      <div className="dashboard-loading-pedidos">
        <div className="spinner-pedidos"></div>
        <p>Cargando dashboard de pedidos...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-pedidos">
      {/* Indicador de conexión WebSocket */}
      <div className="socket-status-pedidos" style={{ position: 'fixed', bottom: 10, right: 10, fontSize: 10, padding: '4px 8px', borderRadius: 4, background: '#1a1c24', color: isConnected ? '#10b981' : '#ef4444', zIndex: 9999 }}>
        {isConnected ? '🟢 Tiempo real activo' : '🔴 Conectando...'}
      </div>

      {/* Filtro de campaña */}
      <div className="dashboard-filtros-pedidos">
        <label>Campaña:</label>
        <select 
          value={filtroCampania} 
          onChange={(e) => setFiltroCampania(e.target.value)}
          className="filtro-select-pedidos"
        >
          <option value="todas">Todas las campañas</option>
          {todasLasCampanas.map(camp => (
            <option key={camp.id} value={camp.id}>
              {camp.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* KPIs */}
      <div className="dashboard-kpis-pedidos">
        <div className="kpi-card-pedidos">
          <div className="kpi-icon-pedidos blue">
            <DollarSign size={24} />
          </div>
          <div className="kpi-info-pedidos">
            <span className="kpi-label-pedidos">Ingresos por Pedidos</span>
            <span className="kpi-value-pedidos">${stats?.total_ingresos?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="kpi-card-pedidos">
          <div className="kpi-icon-pedidos green">
            <ShoppingBag size={24} />
          </div>
          <div className="kpi-info-pedidos">
            <span className="kpi-label-pedidos">Total Pedidos</span>
            <span className="kpi-value-pedidos">{stats?.total_pedidos || 0}</span>
          </div>
        </div>

        <div className="kpi-card-pedidos">
          <div className="kpi-icon-pedidos purple">
            <Calendar size={24} />
          </div>
          <div className="kpi-info-pedidos">
            <span className="kpi-label-pedidos">Pedidos del día</span>
            <span className="kpi-value-pedidos">{pedidosDelDia}</span>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="dashboard-graficas-pedidos">
        <div className="grafica-card-pedidos">
          <h3>Pedidos por Día</h3>
          <div className="barras-container-pedidos">
            {pedidosUltimos7Dias.map((dia, idx) => {
              const alturaPorcentaje = maxCantidad > 0 ? (dia.cantidad / maxCantidad) * 100 : 0
              const fechaMostrar = dia.fechaStr.slice(5).replace('-', '/')
              return (
                <div key={idx} className="barra-item-pedidos">
                  <div 
                    className="barra-pedidos" 
                    style={{ 
                      height: `${Math.max(alturaPorcentaje, 4)}px`,
                      backgroundColor: dia.cantidad > 0 ? '#3b82f6' : '#e5e7eb'
                    }}
                  ></div>
                  <span className="barra-label-pedidos">{fechaMostrar}</span>
                  {dia.cantidad > 0 && (
                    <span className="barra-valor-pedidos">{dia.cantidad} pedido{dia.cantidad !== 1 ? 's' : ''}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* GRÁFICA DINÁMICA: Top Campañas o Porcentajes según filtro */}
        <div className="grafica-card-pedidos">
          <h3>{filtroCampania === 'todas' ? 'Top Campañas (ingresos)' : `Impacto de la campaña`}</h3>
          {filtroCampania === 'todas' ? (
            <div className="campanas-lista-pedidos">
              {pedidosPorCampania.map((camp, idx) => (
                <div key={idx} className="campana-item-pedidos">
                  <span className="campana-nombre-pedidos">{documentosMap[camp.campania] || camp.campania}</span>
                  <div className="campana-barra-fondo-pedidos">
                    <div 
                      className="campana-barra-pedidos" 
                      style={{ width: `${(camp.total / pedidosPorCampania[0].total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="campana-valor-pedidos">${camp.total.toFixed(0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="porcentajes-container-pedidos">
              <div className="porcentaje-item-pedidos">
                <svg width="120" height="120" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#2a2a30" strokeWidth="3" />
                  <circle 
                    cx="20" 
                    cy="20" 
                    r="16" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="3" 
                    strokeDasharray={`${(porcentajes?.porcentajePedidos / 100) * 100} 100`}
                    strokeDashoffset="0"
                    transform="rotate(-90 20 20)"
                  />
                  <text x="20" y="24" textAnchor="middle" fill="#e0e2e8" fontSize="10" fontWeight="bold">
                    {porcentajes?.porcentajePedidos.toFixed(0)}%
                  </text>
                </svg>
                <span className="porcentaje-label-pedidos">Pedidos</span>
              </div>
              <div className="porcentaje-item-pedidos">
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
                <span className="porcentaje-label-pedidos">Ingresos</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pedidos recientes */}
      <div className="dashboard-recientes-pedidos">
        <h3>Pedidos Recientes</h3>
        <div className="tabla-wrapper-pedidos">
          <table className="tabla-recientes-pedidos">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Pedido</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pedidosRecientes.map(pedido => (
                <tr key={pedido.id}>
                  <td className="campania-nombre-tabla-pedidos">{documentosMap[pedido.campania_id] || pedido.campania_id || '—'}</td>
                  <td className="pedido-texto-pedidos" title={pedido.texto_pedido}>
                    {pedido.texto_pedido.length > 60 
                      ? pedido.texto_pedido.substring(0, 60) + '...' 
                      : pedido.texto_pedido}
                  </td>
                  <td className="monto-pedidos">${pedido.monto_total.toFixed(2)}</td>
                  <td className="fecha-pedidos">{new Date(pedido.fecha_creacion).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}