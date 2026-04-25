import { useState, useEffect } from 'react'
import { Upload, Copy, Check } from 'lucide-react'
import { listarDocumentos, subirDocumento, eliminarDocumento, actualizarPrecio, actualizarMensaje, actualizarTipoCampania } from '../services/documentos'
import { getEmpresaIdFromToken, getEmpresaTelefonoFromToken } from '../services/auth'
import '../styles/Campanas.css'

export default function Campanas() {
  const [showModal, setShowModal] = useState(false)
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editingType, setEditingType] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos') // 'todos', 'producto_unico', 'pedido_multiple', 'informativo'
  const [form, setForm] = useState({
    archivo: null,
    mensaje_entrega: '',
    precio: '',
    tipo_campania: 'producto_unico'  // 🔥 NUEVO: tipo de campaña
  })

  const whatsappNumber = getEmpresaTelefonoFromToken()

  useEffect(() => {
    cargarDocumentos()
  }, [])

  const cargarDocumentos = async () => {
    try {
      const empresaId = getEmpresaIdFromToken()
      if (!empresaId) return
      const data = await listarDocumentos(empresaId)
      setDocumentos(data)
    } catch (error) {
      console.error('Error al cargar:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubir = async () => {
    if (!form.archivo) return
    
    // Validar precio solo para producto_unico
    if (form.tipo_campania === 'producto_unico' && !form.precio) {
      setUploadError('❌ El precio es obligatorio para campañas de producto único')
      return
    }
    
    setUploading(true)
    setUploadError('')
    try {
      const empresaId = getEmpresaIdFromToken()
      await subirDocumento(
        empresaId,
        form.archivo,
        undefined, // campania_id se genera automáticamente
        form.tipo_campania === 'producto_unico' ? form.mensaje_entrega : null, // solo enviar mensaje para producto_unico
        form.tipo_campania === 'producto_unico' ? parseFloat(form.precio) : null, // solo enviar precio para producto_unico
        form.tipo_campania  // 🔥 enviar tipo_campania
      )
      setShowModal(false)
      setForm({ archivo: null, mensaje_entrega: '', precio: '', tipo_campania: 'producto_unico' })
      setUploadError('')
      cargarDocumentos()
    } catch (error) {
      console.error('Error al subir:', error)
      if (error.message && (
          error.message.includes('duplicate key value violates unique constraint') ||
          error.message.includes('UniqueViolation') ||
          error.message.includes('already exists')
      )) {
        setUploadError('❌ Este archivo ya fue subido anteriormente. No puedes subir el mismo documento dos veces.')
      } else if (error.message) {
        setUploadError('❌ Error al subir el documento. Verifica los datos e intenta nuevamente.')
      } else {
        setUploadError('❌ Error al subir el documento. Intenta nuevamente.')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar documento?')) return
    try {
      await eliminarDocumento(id)
      cargarDocumentos()
    } catch (error) {
      console.error('Error al eliminar:', error)
    }
  }

  const handleEditClick = (id, type, value) => {
    setEditingId(id)
    setEditingType(type)
    setEditValue(value)
  }

  const handleSavePrecio = async (id) => {
    try {
      await actualizarPrecio(id, parseFloat(editValue))
      setEditingId(null)
      setEditingType(null)
      cargarDocumentos()
    } catch (error) {
      console.error('Error al actualizar precio:', error)
    }
  }

  const handleSaveMensaje = async (id) => {
    try {
      await actualizarMensaje(id, editValue)
      setEditingId(null)
      setEditingType(null)
      cargarDocumentos()
    } catch (error) {
      console.error('Error al actualizar mensaje:', error)
    }
  }

  const handleSaveTipoCampania = async (id, nuevoTipo) => {
    try {
      await actualizarTipoCampania(id, nuevoTipo)
      setEditingId(null)
      setEditingType(null)
      cargarDocumentos()
    } catch (error) {
      console.error('Error al actualizar tipo de campaña:', error)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingType(null)
  }

  const generarEnlaceWhatsApp = (campaniaId) => {
    if (!whatsappNumber || !campaniaId) return ''
    return `https://wa.me/${whatsappNumber}?text=campaña=${encodeURIComponent(campaniaId)}`
  }

  const copiarEnlace = async (enlace, id) => {
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Error al copiar:', error)
    }
  }

  const handleCloseModal = () => {
    if (uploading) return
    setShowModal(false)
    setUploadError('')
    setForm({ archivo: null, mensaje_entrega: '', precio: '', tipo_campania: 'producto_unico' })
  }

  // Filtrar documentos por tipo
  const documentosFiltrados = filtroTipo === 'todos' 
    ? documentos 
    : documentos.filter(doc => doc.tipo_campania === filtroTipo)

  // Obtener el texto legible para el tipo de campaña
  const getTipoTexto = (tipo) => {
    switch(tipo) {
      case 'producto_unico': return 'Producto único'
      case 'pedido_multiple': return 'Pedido múltiple'
      case 'informativo': return 'Informativo'
      default: return tipo || 'Producto único'
    }
  }

  // Obtener la clase CSS para el badge según el tipo
  const getTipoBadgeClass = (tipo) => {
    switch(tipo) {
      case 'producto_unico': return 'tipo-badge producto-unico'
      case 'pedido_multiple': return 'tipo-badge pedido-multiple'
      case 'informativo': return 'tipo-badge informativo'
      default: return 'tipo-badge'
    }
  }

  if (loading) return <div className="campanas">Cargando...</div>

  return (
    <div className="campanas">
      <div className="camp-header">
        <h1 className="camp-titulo">Documentos</h1>
        <button className="camp-btn-nuevo" onClick={() => setShowModal(true)}>
          <Upload size={16} />
          Nuevo
        </button>
      </div>

      {/* 🔥 Filtro por tipo de campaña */}
      <div className="filtro-tipo-container">
        <label>Filtrar por tipo:</label>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="filtro-tipo-select">
          <option value="todos">Todos</option>
          <option value="producto_unico">Producto único</option>
          <option value="pedido_multiple">Pedido múltiple</option>
          <option value="informativo">Informativo</option>
        </select>
      </div>

      {/* Tabla de documentos */}
      <div className="camp-tabla-contenedor">
        <table className="camp-tabla">
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Identificador</th>
              <th>Tipo</th>
              <th>Precio</th>
              <th>Mensaje</th>
              <th>Fecha</th>
              <th>Enlace WhatsApp</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documentosFiltrados.map(doc => {
              const enlace = generarEnlaceWhatsApp(doc.campania_id)
              return (
                <tr key={doc.id}>
                  <td className="camp-archivo">📄 {doc.nombre}     </td>
                  <td className="camp-campania">{doc.campania_id || '—'}     </td>
                  <td className="camp-tipo">
                    <span className={getTipoBadgeClass(doc.tipo_campania)}>
                      {getTipoTexto(doc.tipo_campania)}
                    </span>
                  </td>
                  <td className="camp-precio">
                    {doc.tipo_campania === 'producto_unico' ? (
                      editingId === doc.id && editingType === 'precio' ? (
                        <div className="camp-edit-container">
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="camp-edit-input-precio"
                            autoFocus
                          />
                          <button className="camp-btn-icono camp-btn-guardar" onClick={() => handleSavePrecio(doc.id)}>✓</button>
                          <button className="camp-btn-icono camp-btn-cancelar" onClick={handleCancel}>✗</button>
                        </div>
                      ) : (
                        <div className="camp-display-container">
                          <span>${doc.precio?.toFixed(2) || '0.00'}</span>
                          <button 
                            className="camp-btn-icono camp-btn-editar"
                            onClick={() => handleEditClick(doc.id, 'precio', doc.precio?.toString() || '0')}
                          >✎</button>
                        </div>
                      )
                    ) : (
                      <span className="camp-no-aplica">—</span>
                    )}
                   </td>
                  <td className="camp-mensaje">
                    {doc.tipo_campania === 'producto_unico' ? (
                      editingId === doc.id && editingType === 'mensaje' ? (
                        <div className="camp-edit-container">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="camp-edit-input-mensaje"
                            autoFocus
                          />
                          <button className="camp-btn-icono camp-btn-guardar" onClick={() => handleSaveMensaje(doc.id)}>✓</button>
                          <button className="camp-btn-icono camp-btn-cancelar" onClick={handleCancel}>✗</button>
                        </div>
                      ) : (
                        <div className="camp-display-container">
                          <span className="camp-mensaje-texto">{doc.mensaje_entrega ? doc.mensaje_entrega.substring(0, 40) + '...' : '—'}</span>
                          <button 
                            className="camp-btn-icono camp-btn-editar"
                            onClick={() => handleEditClick(doc.id, 'mensaje', doc.mensaje_entrega || '')}
                          >✎</button>
                        </div>
                      )
                    ) : (
                      <span className="camp-no-aplica">—</span>
                    )}
                   </td>
                  <td className="camp-fecha">{new Date(doc.fecha_subida).toLocaleDateString()}     </td>
                  <td className="camp-enlace">
                    {enlace ? (
                      <div className="camp-enlace-container">
                        <span className="camp-enlace-texto" title={enlace}>
                          {enlace.substring(0, 35)}...
                        </span>
                        <button
                          className="camp-btn-icono camp-btn-copiar"
                          onClick={() => copiarEnlace(enlace, doc.id)}
                          title="Copiar enlace"
                        >
                          {copiedId === doc.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    ) : (
                      <span className="camp-sin-enlace">—</span>
                    )}
                   </td>
                  <td className="camp-acciones">
                    <button className="camp-btn-icono" onClick={() => handleEliminar(doc.id)}>🗑️</button>
                    <button className="camp-btn-icono">📄</button>
                   </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="camp-modal-overlay" onClick={uploading ? undefined : handleCloseModal}>
          <div className="camp-modal" onClick={e => e.stopPropagation()}>
            <div className="camp-modal-header">
              <h2>Nuevo documento</h2>
              <button className="camp-modal-cerrar" onClick={uploading ? undefined : handleCloseModal}>×</button>
            </div>
            <div className="camp-modal-body">
              {uploadError && (
                <div className="camp-error-message" style={{ marginBottom: '16px', padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '6px', fontSize: '13px' }}>
                  {uploadError}
                </div>
              )}
              <div className="camp-campo">
                <label>Tipo de campaña *</label>
                <select
                  value={form.tipo_campania}
                  onChange={(e) => {
                    setForm({...form, tipo_campania: e.target.value})
                    setUploadError('')
                  }}
                  disabled={uploading}
                  className="camp-select"
                >
                  <option value="producto_unico">Producto único (venta individual)</option>
                  <option value="pedido_multiple">Pedido múltiple (restaurante/tienda)</option>
                  <option value="informativo">Informativo (solo consultas)</option>
                </select>
              </div>
              <div className="camp-campo">
                <label>Archivo PDF *</label>
                <input 
                  type="file" 
                  accept=".pdf" 
                  disabled={uploading}
                  onChange={e => {
                    setForm({...form, archivo: e.target.files[0]})
                    setUploadError('')
                  }}
                />
              </div>
              {(form.tipo_campania === 'producto_unico') && (
                <>
                  <div className="camp-campo">
                    <label>Precio (USD) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      value={form.precio}
                      disabled={uploading}
                      onChange={e => {
                        setForm({...form, precio: e.target.value})
                        setUploadError('')
                      }}
                    />
                  </div>
                  <div className="camp-campo">
                    <label>Mensaje de entrega *</label>
                    <textarea 
                      rows={3} 
                      placeholder="Mensaje para el cliente al confirmar el pago..."
                      value={form.mensaje_entrega}
                      disabled={uploading}
                      onChange={e => {
                        setForm({...form, mensaje_entrega: e.target.value})
                        setUploadError('')
                      }}
                    />
                  </div>
                </>
              )}
              {(form.tipo_campania === 'pedido_multiple' || form.tipo_campania === 'informativo') && (
                <div className="camp-campo-info">
                  <p className="info-texto">
                    {form.tipo_campania === 'pedido_multiple' 
                      ? '📦 Los pedidos múltiples no requieren precio ni mensaje de entrega. El bot calculará el total y notificará al dueño.'
                      : 'ℹ️ Los documentos informativos son solo para consulta. No generan ventas ni pedidos.'}
                  </p>
                </div>
              )}
            </div>
            <div className="camp-modal-footer">
              <button 
                className="camp-btn-secundario" 
                onClick={handleCloseModal}
                disabled={uploading}
              >
                Cancelar
              </button>
              <button 
                className="camp-btn-primario" 
                onClick={handleSubir}
                disabled={!form.archivo || uploading || (form.tipo_campania === 'producto_unico' && (!form.precio || !form.mensaje_entrega))}
              >
                {uploading ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}