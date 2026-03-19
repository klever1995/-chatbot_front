import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, googleLogin } from './services/auth'
import { GoogleLogin } from '@react-oauth/google'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login({ username: email, password })
      // Si el login es exitoso, redirige a dashboard
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError('')
    try {
      await googleLogin(credentialResponse.credential)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>📊 Sublimados Admin</h1>
        <h2>Iniciar Sesión</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="correo@ejemplo.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Iniciando...' : 'Ingresar'}
          </button>
          
          <div className="login-divider">
            <span>o continúa con</span>
          </div>

          <div className="login-google-btn">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Error al conectar con Google')}
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="signin_with"
              locale="es"
              width="100%"
            />
          </div>
        </form>
      </div>
    </div>
  )
}