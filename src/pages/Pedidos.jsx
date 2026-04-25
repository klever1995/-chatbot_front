import { useState, useEffect } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, Download, X, CheckCircle, XCircle, Clock } from 'lucide-react'
import { listarPedidos } from '../services/pedidos'
import { getEmpresaIdFromToken } from '../services/auth'
import { useSocket } from '../hooks/useSocket'
import '../styles/Pedidos.css'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    busqueda: ''
  })
  const [paginacion, setPaginacion] = useState({
    skip: 0,
    limit: 20,
    total: 0
  })
  const [showFiltros, setShowFiltros] = useState(false)
  const [campanas, setCampanas] = useState([])

  // WebSocket hook
  const { isConnected, joinEmpresa, onNuevoPedido, onPedidoActualizado } = useSocket()

  // Cargar campañas disponibles UNA SOLA VEZ al inicio
  useEffect(() => {
    cargarCampanasDisponibles()
  }, [])

  // Conectar WebSocket y unirse a la sala de la empresa
  useEffect(() => {
    const empresaId = getEmpresaIdFromToken()
    if (empresaId && isConnected) {
      joinEmpresa(empresaId)
    }
  }, [isConnected, joinEmpresa])

  // Escuchar evento de nuevo pedido
  useEffect(() => {
    const unsubscribe = onNuevoPedido((nuevoPedido) => {
      console.log('📢 Nuevo pedido recibido en tiempo real:', nuevoPedido)
      cargarPedidos(true)
    })
    return unsubscribe
  }, [onNuevoPedido])

  // Escuchar evento de pedido actualizado
  useEffect(() => {
    const unsubscribe = onPedidoActualizado((pedidoActualizado) => {
      console.log('📢 Pedido actualizado en tiempo real:', pedidoActualizado)
      cargarPedidos(true)
    })
    return unsubscribe
  }, [onPedidoActualizado])

  // Cargar pedidos cuando cambian filtros o paginación
  useEffect(() => {
    cargarPedidos()
  }, [paginacion.skip, paginacion.limit, filtros.estado, filtros.fecha_desde, filtros.fecha_hasta])

  const cargarCampanasDisponibles = async () => {
    try {
      const empresaId = getEmpresaIdFromToken()
      const data = await listarPedidos({ 
        empresa_id: empresaId, 
        limit: 1000
      })
      const campanasUnicas = [...new Set(data.map(p => p.campania_id).filter(Boolean))]
      setCampanas(campanasUnicas)
    } catch (error) {
      console.error('Error cargando campañas:', error)
    }
  }

  const cargarPedidos = async (silent = false) => {
    if (!silent) {
      setLoading(true)
    }
    try {
      const empresaId = getEmpresaIdFromToken()
      
      const params = {
        empresa_id: empresaId,
        skip: paginacion.skip,
        limit: paginacion.limit
      }

      if (filtros.estado) params.estado = filtros.estado
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta

      const data = await listarPedidos(params)
      setPedidos(data)
      
      setPaginacion(prev => ({ ...prev, total: data.length < prev.limit ? prev.skip + data.length : prev.skip + prev.limit + 1 }))
    } catch (error) {
      console.error('Error cargando pedidos:', error)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const handleLimpiarFiltros = () => {
    setFiltros({
      estado: '',
      fecha_desde: '',
      fecha_hasta: '',
      busqueda: ''
    })
    setPaginacion(prev => ({ ...prev, skip: 0 }))
  }

  const handlePageChange = (nuevaPagina) => {
    setPaginacion(prev => ({ ...prev, skip: nuevaPagina * prev.limit }))
  }

  // Filtrar por búsqueda en frontend
  const pedidosFiltrados = pedidos.filter(pedido => {
    if (!filtros.busqueda) return true
    const busqueda = filtros.busqueda.toLowerCase()
    return (
      pedido.texto_pedido?.toLowerCase().includes(busqueda) ||
      pedido.campania_id?.toLowerCase().includes(busqueda) ||
      pedido.cliente_telefono?.toLowerCase().includes(busqueda) ||
      pedido.cliente_nombre?.toLowerCase().includes(busqueda)
    )
  })

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'confirmado':
        return <span className="estado-badge confirmado"><CheckCircle size={12} /> Confirmado</span>
      case 'rechazado':
        return <span className="estado-badge rechazado"><XCircle size={12} /> Rechazado</span>
      default:
        return <span className="estado-badge pendiente"><Clock size={12} /> Pendiente</span>
    }
  }

  const totalPaginas = Math.ceil(paginacion.total / paginacion.limit)
  const paginaActual = Math.floor(paginacion.skip / paginacion.limit)

  return (
    <div className="pedidos">
      {/* Indicador de conexión WebSocket */}
      <div className="socket-status" style={{ position: 'fixed', bottom: 10, right: 10, fontSize: 10, padding: '4px 8px', borderRadius: 4, background: '#1a1c24', color: isConnected ? '#10b981' : '#ef4444', zIndex: 9999 }}>
        {isConnected ? '🟢 Tiempo real activo' : '🔴 Conectando...'}
      </div>

      <div className="pedidos-header">
        <h1>Pedidos</h1>
        <button className="btn-filtro" onClick={() => setShowFiltros(!showFiltros)}>
          <Filter size={16} />
          Filtros
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="busqueda-container">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por pedido, campaña o cliente..."
          value={filtros.busqueda}
          onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
          className="busqueda-input"
        />
        {filtros.busqueda && (
          <button className="limpiar-busqueda" onClick={() => setFiltros({ ...filtros, busqueda: '' })}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Panel de filtros */}
      {showFiltros && (
        <div className="filtros-panel">
          <div className="filtros-grid">
            <div className="filtro-item">
              <label>Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>

            <div className="filtro-item">
              <label>Campaña</label>
              <select
                value={filtros.campania_id}
                onChange={(e) => setFiltros({ ...filtros, campania_id: e.target.value })}
              >
                <option value="">Todas</option>
                {campanas.map(camp => (
                  <option key={camp} value={camp}>{camp}</option>
                ))}
              </select>
            </div>

            <div className="filtro-item">
              <label>Fecha desde</label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
              />
            </div>

            <div className="filtro-item">
              <label>Fecha hasta</label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
              />
            </div>
          </div>

          <div className="filtros-acciones">
            <button className="btn-limpiar" onClick={handleLimpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabla de pedidos */}
      <div className="pedidos-table-container">
        {loading ? (
          <div className="loading-spinner">Cargando...</div>
        ) : (
          <>
            <table className="pedidos-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Campaña</th>
                  <th>Pedido</th>
                  <th>Total</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map(pedido => (
                  <tr key={pedido.id}>
                    <td className="cliente-col">{pedido.cliente_nombre || `#${pedido.cliente_id}`}</td>
                    <td className="telefono-col">{pedido.cliente_telefono || '—'}</td>
                    <td className="campania-col">{pedido.campania_id || '—'}</td>
                    <td className="pedido-col" title={pedido.texto_pedido}>
                      {pedido.texto_pedido.length > 60 
                        ? pedido.texto_pedido.substring(0, 60) + '...' 
                        : pedido.texto_pedido}
                    </td>
                    <td className="total-col">${pedido.monto_total.toFixed(2)}</td>
                    <td className="fecha-col">
                      {new Date(pedido.fecha_creacion).toLocaleDateString()}
                    </td>
                    <td className="estado-col">{getEstadoBadge(pedido.estado)}</td>
                    <td className="comprobante-col">
                      {pedido.comprobante_url ? (
                        <a 
                          href={pedido.comprobante_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-comprobante"
                          title="Ver comprobante"
                        >
                          <Download size={16} />
                        </a>
                      ) : (
                        <span className="sin-comprobante">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pedidosFiltrados.length === 0 && (
              <div className="sin-resultados">
                <p>No se encontraron pedidos</p>
              </div>
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="paginacion">
                <button
                  onClick={() => handlePageChange(paginaActual - 1)}
                  disabled={paginaActual === 0}
                >
                  <ChevronLeft size={16} />
                </button>
                
                {[...Array(totalPaginas)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={paginaActual === i ? 'active' : ''}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(paginaActual + 1)}
                  disabled={paginaActual >= totalPaginas - 1}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}