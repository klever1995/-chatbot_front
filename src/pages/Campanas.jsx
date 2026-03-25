import { useState, useEffect } from 'react'
import { Upload, Copy, Check } from 'lucide-react'
import { listarDocumentos, subirDocumento, eliminarDocumento, actualizarPrecio, actualizarMensaje } from '../services/documentos'
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
  const [uploadError, setUploadError] = useState('') // 🔥 NUEVO: estado de error
  const [form, setForm] = useState({
    archivo: null,
    campania_id: '',
    mensaje_entrega: '',
    precio: ''
  })

  // Obtener el número de WhatsApp de la empresa desde el token
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
    if (!form.archivo || !form.campania_id || !form.precio) return
    
    setUploading(true)
    setUploadError('') // Limpiar error anterior
    try {
      const empresaId = getEmpresaIdFromToken()
      await subirDocumento(
        empresaId,
        form.archivo,
        form.campania_id,
        form.mensaje_entrega,
        parseFloat(form.precio)
      )
      setShowModal(false)
      setForm({ archivo: null, campania_id: '', mensaje_entrega: '', precio: '' })
      setUploadError('')
      cargarDocumentos()
    } catch (error) {
      console.error('Error al subir:', error)
      // 🔥 Manejar error de documento duplicado
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

  const handleCancel = () => {
    setEditingId(null)
    setEditingType(null)
  }

  // Función para generar el enlace de WhatsApp
  const generarEnlaceWhatsApp = (campaniaId) => {
    if (!whatsappNumber || !campaniaId) return ''
    return `https://wa.me/${whatsappNumber}?text=campaña=${encodeURIComponent(campaniaId)}`
  }

  // Función para copiar al portapapeles
  const copiarEnlace = async (enlace, id) => {
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Error al copiar:', error)
    }
  }

  // Limpiar error al cerrar el modal
  const handleCloseModal = () => {
    setShowModal(false)
    setUploadError('')
    setForm({ archivo: null, campania_id: '', mensaje_entrega: '', precio: '' })
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

      {/* Tabla de documentos */}
      <div className="camp-tabla-contenedor">
        <table className="camp-tabla">
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Campaña</th>
              <th>Precio</th>
              <th>Mensaje</th>
              <th>Fecha</th>
              <th>Enlace WhatsApp</th>
              <th>Acciones</th>
              </tr>
            </thead>
          <tbody>
            {documentos.map(doc => {
              const enlace = generarEnlaceWhatsApp(doc.campania_id)
              return (
                <tr key={doc.id}>
                  <td className="camp-archivo">📄 {doc.nombre}   </td>
                  <td className="camp-campania">{doc.campania_id || '—'}   </td>
                  <td className="camp-precio">
                    {editingId === doc.id && editingType === 'precio' ? (
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
                    )}
                    </td>
                  <td className="camp-mensaje">
                    {editingId === doc.id && editingType === 'mensaje' ? (
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
                    )}
                    </td>
                  <td className="camp-fecha">{new Date(doc.fecha_subida).toLocaleDateString()}   </td>
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
        <div className="camp-modal-overlay" onClick={handleCloseModal}>
          <div className="camp-modal" onClick={e => e.stopPropagation()}>
            <div className="camp-modal-header">
              <h2>Nuevo documento</h2>
              <button className="camp-modal-cerrar" onClick={handleCloseModal}>×</button>
            </div>
            <div className="camp-modal-body">
              {/* 🔥 MOSTRAR ERROR SI EXISTE */}
              {uploadError && (
                <div className="camp-error-message" style={{ marginBottom: '16px', padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '6px', fontSize: '13px' }}>
                  {uploadError}
                </div>
              )}
              <div className="camp-campo">
                <label>Archivo PDF</label>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={e => {
                    setForm({...form, archivo: e.target.files[0]})
                    setUploadError('') // Limpiar error al cambiar archivo
                  }}
                />
              </div>
              <div className="camp-campo">
                <label>Campaña</label>
                <input 
                  type="text" 
                  placeholder="ej: lettering"
                  value={form.campania_id}
                  onChange={e => {
                    setForm({...form, campania_id: e.target.value})
                    setUploadError('')
                  }}
                />
              </div>
              <div className="camp-campo">
                <label>Precio (€)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={form.precio}
                  onChange={e => {
                    setForm({...form, precio: e.target.value})
                    setUploadError('')
                  }}
                />
              </div>
              <div className="camp-campo">
                <label>Mensaje</label>
                <textarea 
                  rows={3} 
                  placeholder="Mensaje para el cliente..."
                  value={form.mensaje_entrega}
                  onChange={e => {
                    setForm({...form, mensaje_entrega: e.target.value})
                    setUploadError('')
                  }}
                />
              </div>
            </div>
            <div className="camp-modal-footer">
              <button className="camp-btn-secundario" onClick={handleCloseModal}>Cancelar</button>
              <button 
                className="camp-btn-primario" 
                onClick={handleSubir}
                disabled={!form.archivo || !form.campania_id || !form.precio || uploading}
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