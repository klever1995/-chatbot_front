import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { login, loginGoogle } from './services/auth'
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
      const response = await login({ username: email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true)
      await loginGoogle(credentialResponse.credential)
      navigate('/dashboard')
    } catch (err) {
      setError('Error al iniciar sesión con Google')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Error en la autenticación con Google')
  }

  return (
    <div className="login-page">

      {/* IZQUIERDA */}
      <div className="login-branding">
        <div className="login-branding__content">
          <div className="login-branding__logo">A</div>
          <h1 className="login-branding__title">Aurelia</h1>
          <p className="login-branding__subtitle">
            Panel de administración de ventas
          </p>
        </div>

        <div className="login-branding__orb login-branding__orb--1" />
        <div className="login-branding__orb login-branding__orb--2" />
      </div>

      {/* DERECHA */}
      <div className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit}>

          <div className="login-form__header">
            <h2>Iniciar Sesión</h2>
            <p>Ingresa tus credenciales</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <div className="login-form__field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="correo@ejemplo.com"
              disabled={loading}
            />
          </div>

          <div className="login-form__field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Iniciando...' : 'Ingresar'}
          </button>

          <div className="login-divider">
            <span>o</span>
          </div>

          <div className="login-google">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
            />
          </div>

        </form>
      </div>
    </div>
  )
}