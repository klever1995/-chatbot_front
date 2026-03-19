import { useState, useEffect } from 'react'
import { Edit2, Save, X, Copy, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { obtenerEmpresa, actualizarEmpresa } from '../services/empresa'
import { getEmpresaIdFromToken } from '../services/auth'
import '../styles/Configuracion.css'

export default function Configuracion() {
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [form, setForm] = useState({
    nombre: '',
    prompt_personalizado: '',
    telefono_dueño: '',
    activa: true
  })

  useEffect(() => {
    cargarEmpresa()
  }, [])

  const cargarEmpresa = async () => {
    try {
      const empresaId = getEmpresaIdFromToken()
      const data = await obtenerEmpresa(empresaId)
      setEmpresa(data)
      setForm({
        nombre: data.nombre,
        prompt_personalizado: data.prompt_personalizado,
        telefono_dueño: data.telefono_dueño,
        activa: data.activa
      })
    } catch (error) {
      console.error('Error cargando empresa:', error)
      setMensaje({ tipo: 'error', texto: 'Error al cargar los datos' })
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    setSaving(true)
    try {
      const empresaId = getEmpresaIdFromToken()
      await actualizarEmpresa(empresaId, {
        nombre: form.nombre,
        telefono_whatsapp: empresa.telefono_whatsapp,
        prompt_personalizado: form.prompt_personalizado,
        telefono_dueño: form.telefono_dueño,
        activa: form.activa
      })
      setEmpresa({ ...empresa, ...form })
      setMensaje({ tipo: 'exito', texto: 'Datos guardados correctamente' })
      setEditMode(false)
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
    } catch (error) {
      console.error('Error guardando:', error)
      setMensaje({ tipo: 'error', texto: 'Error al guardar los datos' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelar = () => {
    setForm({
      nombre: empresa.nombre,
      prompt_personalizado: empresa.prompt_personalizado,
      telefono_dueño: empresa.telefono_dueño,
      activa: empresa.activa
    })
    setEditMode(false)
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(empresa.token_api)
    setMensaje({ tipo: 'exito', texto: 'Token copiado al portapapeles' })
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000)
  }

  if (loading) {
    return (
      <div className="config-loading">
        <div className="spinner"></div>
        <p>Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="configuracion">
      <div className="config-header">
        <h1>Configuración de la empresa</h1>
        {!editMode ? (
          <button className="btn-editar" onClick={() => setEditMode(true)}>
            <Edit2 size={16} />
            Editar información
          </button>
        ) : (
          <div className="header-acciones">
            <button className="btn-cancelar" onClick={handleCancelar}>
              <X size={16} />
              Cancelar
            </button>
            <button 
              className="btn-guardar" 
              onClick={handleGuardar}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>

      {mensaje.texto && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="config-contenido">
        {/* Sección 1: Información general */}
        <div className="config-seccion">
          <h2>Información general</h2>
          <div className="seccion-grid">
            <div className="campo">
              <label>Nombre de la empresa</label>
              {editMode ? (
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              ) : (
                <div className="campo-valor">{empresa.nombre}</div>
              )}
            </div>

            <div className="campo">
              <label>Teléfono del dueño</label>
              {editMode ? (
                <input
                  type="text"
                  value={form.telefono_dueño}
                  onChange={(e) => setForm({ ...form, telefono_dueño: e.target.value })}
                />
              ) : (
                <div className="campo-valor">{empresa.telefono_dueño}</div>
              )}
              <small>Número con código de país, sin +</small>
            </div>

            <div className="campo full-width">
              <label>Prompt personalizado</label>
              {editMode ? (
                <textarea
                  value={form.prompt_personalizado}
                  onChange={(e) => setForm({ ...form, prompt_personalizado: e.target.value })}
                  rows={4}
                />
              ) : (
                <div className="campo-valor prompt">{empresa.prompt_personalizado}</div>
              )}
              <small>Mensaje que usará el asistente para responder</small>
            </div>

            <div className="campo full-width">
              <label>Estado de la empresa</label>
              {editMode ? (
                <div className="toggle-container">
                  <span className={form.activa ? 'activo' : 'inactivo'}>
                    {form.activa ? 'Activa' : 'Inactiva'}
                  </span>
                  <div 
                    className={`toggle ${form.activa ? 'activo' : ''}`}
                    onClick={() => setForm({ ...form, activa: !form.activa })}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              ) : (
                <div className={`estado-badge ${empresa.activa ? 'activo' : 'inactivo'}`}>
                  {empresa.activa ? 'Activa' : 'Inactiva'}
                </div>
              )}
              <small>Desactivar detiene todas las operaciones</small>
            </div>
          </div>
        </div>

        {/* Sección 2: Datos sensibles */}
        <div className="config-seccion">
          <h2>Datos de integración</h2>
          <div className="seccion-grid">
            <div className="campo">
              <label>ID de empresa</label>
              <div className="campo-valor">{empresa.id}</div>
            </div>

            <div className="campo">
              <label>Token API</label>
              <div className="token-container">
                <span className="token-valor">
                  {showToken ? empresa.token_api : '•'.repeat(40)}
                </span>
                <button onClick={() => setShowToken(!showToken)} className="btn-icono" title={showToken ? 'Ocultar' : 'Mostrar'}>
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={handleCopyToken} className="btn-icono" title="Copiar">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="campo">
              <label>WhatsApp Business</label>
              <div className="campo-valor">{empresa.telefono_whatsapp}</div>
              <div className="aviso">
                <AlertCircle size={14} />
                <small>Para cambiar este número contacta a soporte</small>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 3: Fechas */}
        <div className="config-seccion fechas">
          <h2>Registro</h2>
          <div className="seccion-grid">
            <div className="campo">
              <label>Fecha de registro</label>
              <div className="campo-valor">
                {new Date(empresa.fecha_registro).toLocaleDateString()}
              </div>
            </div>

            <div className="campo">
              <label>Última actualización</label>
              <div className="campo-valor">
                {new Date(empresa.fecha_actualizacion).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}