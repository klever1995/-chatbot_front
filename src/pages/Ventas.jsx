import { useState, useEffect } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import { listarVentas } from '../services/ventas'
import { getEmpresaIdFromToken } from '../services/auth'
import { useSocket } from '../hooks/useSocket'
import '../styles/Ventas.css'

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    campania_id: '',
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
  const { isConnected, joinEmpresa, onNuevaVenta } = useSocket()

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

  // Escuchar evento de nueva venta (actualización silenciosa)
  useEffect(() => {
    const unsubscribe = onNuevaVenta((nuevaVenta) => {
      console.log('📢 Nueva venta recibida en tiempo real (Ventas):', nuevaVenta)
      cargarVentas(true) // true = actualización silenciosa sin loading
    })
    return unsubscribe
  }, [onNuevaVenta])

  // Cargar ventas cuando cambian filtros o paginación
  useEffect(() => {
    cargarVentas()
  }, [paginacion.skip, paginacion.limit, filtros.campania_id, filtros.fecha_desde, filtros.fecha_hasta])

  const cargarCampanasDisponibles = async () => {
    try {
      const empresaId = getEmpresaIdFromToken()
      const data = await listarVentas({ 
        empresa_id: empresaId, 
        limit: 1000
      })
      const campanasUnicas = [...new Set(data.map(v => v.campania_id).filter(Boolean))]
      setCampanas(campanasUnicas)
    } catch (error) {
      console.error('Error cargando campañas:', error)
    }
  }

  const cargarVentas = async (silent = false) => {
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

      if (filtros.campania_id) params.campania_id = filtros.campania_id
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta

      const data = await listarVentas(params)
      setVentas(data)
      
      setPaginacion(prev => ({ ...prev, total: data.length < prev.limit ? prev.skip + data.length : prev.skip + prev.limit + 1 }))
    } catch (error) {
      console.error('Error cargando ventas:', error)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const handleLimpiarFiltros = () => {
    setFiltros({
      campania_id: '',
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
  const ventasFiltradas = ventas.filter(venta => {
    if (!filtros.busqueda) return true
    const busqueda = filtros.busqueda.toLowerCase()
    return (
      venta.producto_nombre?.toLowerCase().includes(busqueda) ||
      venta.campania_id?.toLowerCase().includes(busqueda) ||
      venta.cliente_telefono?.toLowerCase().includes(busqueda) ||
      venta.cliente_nombre?.toLowerCase().includes(busqueda) ||
      venta.cliente_id?.toString().includes(busqueda)
    )
  })

  const totalPaginas = Math.ceil(paginacion.total / paginacion.limit)
  const paginaActual = Math.floor(paginacion.skip / paginacion.limit)

  return (
    <div className="ventas">
      {/* Indicador de conexión WebSocket */}
      <div className="socket-status" style={{ position: 'fixed', bottom: 10, right: 10, fontSize: 10, padding: '4px 8px', borderRadius: 4, background: '#1a1c24', color: isConnected ? '#10b981' : '#ef4444', zIndex: 9999 }}>
        {isConnected ? '🟢 Tiempo real activo' : '🔴 Conectando...'}
      </div>

      <div className="ventas-header">
        <h1>Ventas</h1>
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
          placeholder="Buscar por producto, campaña o cliente..."
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

      {/* Tabla de ventas */}
      <div className="ventas-table-container">
        {loading ? (
          <div className="loading-spinner">Cargando...</div>
        ) : (
          <>
            <table className="ventas-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Producto</th>
                  <th>Campaña</th>
                  <th>Precio Unit.</th>
                  <th>Fecha</th>
                  <th>Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.map(venta => (
                  <tr key={venta.id}>
                    <td className="cliente-col">{venta.cliente_nombre || `#${venta.cliente_id}`}</td>
                    <td className="telefono-col">{venta.cliente_telefono || '—'}</td>
                    <td className="producto-col">{venta.producto_nombre}</td>
                    <td>{venta.campania_id || '—'}</td>
                    <td>${venta.precio_unitario.toFixed(2)}</td>
                    <td>{venta.fecha_venta.split('T')[0].split('-').reverse().join('/')}</td>
                    <td>
                      {venta.comprobante_url ? (
                        <a 
                          href={venta.comprobante_url} 
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

            {ventasFiltradas.length === 0 && (
              <div className="sin-resultados">
                <p>No se encontraron ventas</p>
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