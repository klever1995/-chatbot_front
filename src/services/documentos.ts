const API_URL = import.meta.env.VITE_API_URL
import { authHeader } from './auth'

export interface Documento {
  id: number
  nombre: string
  fecha_subida: string
  campania_id: string | null
  mensaje_entrega: string | null
  precio: number | null
  total_chunks: number
}

export async function listarDocumentos(empresaId: number): Promise<Documento[]> {
  const res = await fetch(`${API_URL}/api/v1/documentos/listar/${empresaId}`, {
    headers: authHeader()
  })
  if (!res.ok) throw new Error('Error al cargar documentos')
  return res.json()
}

export async function subirDocumento(
  empresaId: number,
  archivo: File,
  campania_id: string,
  mensaje_entrega: string,
  precio: number
): Promise<Documento> {
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('campania_id', campania_id)
  formData.append('mensaje_entrega', mensaje_entrega)
  formData.append('precio', precio.toString())

  const res = await fetch(`${API_URL}/api/v1/documentos/subir/${empresaId}`, {
    method: 'POST',
    headers: authHeader(),
    body: formData
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Error ${res.status}: ${error}`)
  }

  return res.json()
}

export async function eliminarDocumento(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/documentos/${id}`, {
    method: 'DELETE',
    headers: authHeader()
  })
  if (!res.ok) throw new Error('Error al eliminar documento')
}

export async function actualizarPrecio(id: number, precio: number): Promise<void> {
  const formData = new FormData()
  formData.append('precio', precio.toString())
  
  const res = await fetch(`${API_URL}/api/v1/documentos/${id}/precio`, {
    method: 'PUT',
    headers: authHeader(),
    body: formData
  })
  if (!res.ok) throw new Error('Error al actualizar precio')
}

export async function actualizarMensaje(id: number, mensaje_entrega: string): Promise<void> {
  const formData = new FormData()
  formData.append('mensaje_entrega', mensaje_entrega)
  
  const res = await fetch(`${API_URL}/api/v1/documentos/${id}/mensaje`, {
    method: 'PUT',
    headers: authHeader(),
    body: formData
  })
  if (!res.ok) throw new Error('Error al actualizar mensaje')
}