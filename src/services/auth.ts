const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginCredentials {
  username: string  // email
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface Usuario {
  id: number
  empresa_id: number
  email: string
  nombre: string
  rol: string
  activo: boolean
  ultimo_acceso: string | null
  fecha_registro: string
  fecha_actualizacion: string | null
}

// Guardar token en localStorage
export function setToken(token: string): void {
  localStorage.setItem('auth_token', token)
}

// Obtener token de localStorage
export function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

// Eliminar token (logout)
export function removeToken(): void {
  localStorage.removeItem('auth_token')
}

// Verificar si hay usuario autenticado
export function isAuthenticated(): boolean {
  return !!getToken()
}

// Decodificar token (sin verificar firma, solo para obtener datos)
export function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decodificando token:', error)
    return null
  }
}

// Obtener empresa_id del token actual
export function getEmpresaIdFromToken(): number | null {
  const token = getToken()
  if (!token) return null
  const decoded = decodeToken(token)
  return decoded?.empresa_id || null
}

// Obtener rol del token actual
export function getRolFromToken(): string | null {
  const token = getToken()
  if (!token) return null
  const decoded = decodeToken(token)
  return decoded?.rol || null
}

// Login: envía credenciales y guarda token
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const formData = new URLSearchParams()
  formData.append('username', credentials.username)
  formData.append('password', credentials.password)

  const response = await fetch(`${API_URL}/api/v1/usuarios/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'ngrok-skip-browser-warning': 'true'
    },
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Error al iniciar sesión')
  }

  const data = await response.json()
  setToken(data.access_token)
  return data
}

// Obtener datos del usuario actual (endpoint /me)
export async function getCurrentUser(): Promise<Usuario> {
  const token = getToken()
  if (!token) throw new Error('No hay token')

  const response = await fetch(`${API_URL}/api/v1/usuarios/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true'
    }
  })

  if (!response.ok) {
    throw new Error('Error al obtener usuario')
  }

  return response.json()
}

// Logout: elimina token
export function logout(): void {
  removeToken()
  window.location.href = '/login'
}

// Header de autorización para usar en fetch/axios
export function authHeader(): HeadersInit {
  const token = getToken()
  const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
  return {
    ...headers,
    'ngrok-skip-browser-warning': 'true'
  }
}

// Login con Google
export async function loginGoogle(credential: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify({ credential })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Error al iniciar sesión con Google')
  }

  const data = await response.json()
  setToken(data.access_token)
  return data
}

// Obtener teléfono de la empresa del token actual
export function getEmpresaTelefonoFromToken(): string | null {
  const token = getToken()
  if (!token) return null
  const decoded = decodeToken(token)
  return decoded?.empresa_telefono || null
}

// Obtener nombre de la empresa del token actual
export function getEmpresaNombreFromToken(): string | null {
  const token = getToken()
  if (!token) return null
  const decoded = decodeToken(token)
  return decoded?.empresa_nombre || null
}