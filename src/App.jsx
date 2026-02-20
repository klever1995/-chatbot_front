import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [empresaId, setEmpresaId] = useState(1)
  const [mensaje, setMensaje] = useState('')
  const [chat, setChat] = useState([])
  const [cargando, setCargando] = useState(false)
  const [documentos, setDocumentos] = useState([])
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [subiendo, setSubiendo] = useState(false)

  // Cargar documentos al iniciar o cambiar empresa
  useEffect(() => {
    cargarDocumentos()
  }, [empresaId])

  const cargarDocumentos = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/documentos/listar/${empresaId}`)
      const data = await response.json()
      setDocumentos(data)
    } catch (error) {
      console.error('Error cargando documentos:', error)
    }
  }

  const subirDocumento = async () => {
    if (!archivoSeleccionado) return
    
    setSubiendo(true)
    const formData = new FormData()
    formData.append('archivo', archivoSeleccionado)

    try {
      const response = await fetch(`http://localhost:8000/api/v1/documentos/subir/${empresaId}`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        setArchivoSeleccionado(null)
        cargarDocumentos() // Recargar la lista
      }
    } catch (error) {
      console.error('Error subiendo documento:', error)
    } finally {
      setSubiendo(false)
    }
  }

  const eliminarDocumento = async (documentoId) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return

    try {
      const response = await fetch(`http://localhost:8000/api/v1/documentos/${documentoId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        cargarDocumentos() // Recargar la lista
      }
    } catch (error) {
      console.error('Error eliminando documento:', error)
    }
  }

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return

    setChat([...chat, { tipo: 'usuario', texto: mensaje }])
    setCargando(true)

    try {
      const response = await fetch('http://localhost:8000/api/v1/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: [{
            changes: [{
              value: {
                metadata: { display_phone_number: "+1234567890" },
                messages: [{
                  from: "+0987654321",
                  text: { body: mensaje },
                  profile: { name: "Usuario Prueba" }
                }]
              }
            }]
          }]
        })
      })

      const data = await response.json()
      setChat(prev => [...prev, { tipo: 'bot', texto: data.respuesta }])
    } catch (error) {
      setChat(prev => [...prev, { tipo: 'bot', texto: '❌ Error al conectar con el bot' }])
    } finally {
      setCargando(false)
      setMensaje('')
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 Chatbot Sublimados - Simulador</h1>
        <div className="empresa-info">
          <label>Empresa ID:</label>
          <input 
            type="number" 
            value={empresaId} 
            onChange={(e) => setEmpresaId(e.target.value)}
            min="1"
          />
        </div>
      </header>

      <div className="main-container">
        <div className="sidebar">
          <h3>📁 Documentos de empresa {empresaId}</h3>
          
          <div className="subir-documento">
            <input
              type="file"
              accept=".pdf,.odf"
              onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
              disabled={subiendo}
            />
            <button 
              onClick={subirDocumento} 
              disabled={!archivoSeleccionado || subiendo}
              className="btn-subir"
            >
              {subiendo ? 'Subiendo...' : '+ Subir documento'}
            </button>
          </div>

          <div className="documentos-lista">
            {documentos.length === 0 ? (
              <p>No hay documentos aún</p>
            ) : (
              documentos.map(doc => (
                <div key={doc.id} className="documento-item">
                  <div className="documento-info">
                    <strong>{doc.nombre}</strong>
                    <small>{new Date(doc.fecha_subida).toLocaleDateString()}</small>
                    <small>{doc.total_chunks} chunks</small>
                  </div>
                  <button 
                    onClick={() => eliminarDocumento(doc.id)}
                    className="btn-eliminar"
                    title="Eliminar documento"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-container">
          <div className="chat-mensajes">
            {chat.map((msg, idx) => (
              <div key={idx} className={`mensaje ${msg.tipo}`}>
                <strong>{msg.tipo === 'usuario' ? '🧑 Tú' : '🤖 Bot'}:</strong>
                <p>{msg.texto}</p>
              </div>
            ))}
            {cargando && <div className="mensaje bot">🤖 Escribiendo...</div>}
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
              placeholder="Escribe tu mensaje..."
              disabled={cargando}
            />
            <button onClick={enviarMensaje} disabled={cargando}>
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App