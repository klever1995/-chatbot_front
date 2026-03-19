import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { listarDocumentos, subirDocumento, eliminarDocumento, actualizarPrecio, actualizarMensaje } from '../services/documentos'
import { getEmpresaIdFromToken } from '../services/auth'
import '../styles/Campanas.css'

export default function Campanas() {
  const [showModal, setShowModal] = useState(false)
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editingType, setEditingType] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [form, setForm] = useState({
    archivo: null,
    campania_id: '',
    mensaje_entrega: '',
    precio: ''
  })

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
      cargarDocumentos()
    } catch (error) {
      console.error('Error al subir:', error)
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map(doc => (
              <tr key={doc.id}>
                <td className="camp-archivo">📄 {doc.nombre}</td>
                <td className="camp-campania">{doc.campania_id || '—'}</td>
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
                <td className="camp-fecha">{new Date(doc.fecha_subida).toLocaleDateString()}</td>
                <td className="camp-acciones">
                  <button className="camp-btn-icono" onClick={() => handleEliminar(doc.id)}>🗑️</button>
                  <button className="camp-btn-icono">📄</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="camp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="camp-modal" onClick={e => e.stopPropagation()}>
            <div className="camp-modal-header">
              <h2>Nuevo documento</h2>
              <button className="camp-modal-cerrar" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="camp-modal-body">
              <div className="camp-campo">
                <label>Archivo PDF</label>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={e => setForm({...form, archivo: e.target.files[0]})}
                />
              </div>
              <div className="camp-campo">
                <label>Campaña</label>
                <input 
                  type="text" 
                  placeholder="ej: lettering"
                  value={form.campania_id}
                  onChange={e => setForm({...form, campania_id: e.target.value})}
                />
              </div>
              <div className="camp-campo">
                <label>Precio (€)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={form.precio}
                  onChange={e => setForm({...form, precio: e.target.value})}
                />
              </div>
              <div className="camp-campo">
                <label>Mensaje</label>
                <textarea 
                  rows={3} 
                  placeholder="Mensaje para el cliente..."
                  value={form.mensaje_entrega}
                  onChange={e => setForm({...form, mensaje_entrega: e.target.value})}
                />
              </div>
            </div>
            <div className="camp-modal-footer">
              <button className="camp-btn-secundario" onClick={() => setShowModal(false)}>Cancelar</button>
              <button 
                className="camp-btn-primario" 
                onClick={handleSubir}
                disabled={!form.archivo || !form.campania_id || !form.precio}
              >Subir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}