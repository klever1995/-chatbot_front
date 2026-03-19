import { authHeader } from './auth'
const API_URL = import.meta.env.VITE_API_URL

export interface Empresa {
  id: number
  nombre: string
  telefono_whatsapp: string
  prompt_personalizado: string
  telefono_dueño: string
  activa: boolean
  token_api: string
  fecha_registro: string
  fecha_actualizacion: string
}

export interface EmpresaUpdate {
  nombre: string
  telefono_whatsapp: string
  prompt_personalizado: string
  telefono_dueño: string
  activa: boolean
}

export async function obtenerEmpresa(id: number): Promise<Empresa> {
  const res = await fetch(`${API_URL}/api/v1/empresas/${id}`, {
    headers: authHeader()
  })
  
  if (!res.ok) throw new Error('Error al cargar la empresa')
  return res.json()
}

export async function actualizarEmpresa(id: number, data: EmpresaUpdate): Promise<Empresa> {
  const res = await fetch(`${API_URL}/api/v1/empresas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader()
    },
    body: JSON.stringify(data)
  })
  
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Error ${res.status}: ${error}`)
  }
  
  return res.json()
}

export async function listarEmpresas(skip: number = 0, limit: number = 100): Promise<Empresa[]> {
  const res = await fetch(`${API_URL}/api/v1/empresas?skip=${skip}&limit=${limit}`, {
    headers: authHeader()
  })
  
  if (!res.ok) throw new Error('Error al listar empresas')
  return res.json()
}