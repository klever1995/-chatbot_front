import { authHeader } from './auth'
const API_URL = import.meta.env.VITE_API_URL

export interface Pedido {
  id: number
  empresa_id: number
  cliente_id: number
  cliente_nombre: string | null
  cliente_telefono: string | null
  campania_id: string | null
  texto_pedido: string
  monto_total: number
  comprobante_url: string | null
  estado: 'pendiente' | 'confirmado' | 'rechazado'
  notas: string | null
  fecha_creacion: string
  fecha_confirmacion: string | null
}

export interface EstadisticasPedidosResumen {
  total_pedidos: number
  total_ingresos: number
  promedio_pedido: number
  fecha_desde: string | null
  fecha_hasta: string | null
}

export async function listarPedidos(params?: {
  empresa_id?: number
  cliente_id?: number
  campania_id?: string
  estado?: string
  fecha_desde?: string
  fecha_hasta?: string
  skip?: number
  limit?: number
}): Promise<Pedido[]> {
  const queryParams = new URLSearchParams()
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })
  }
  
  const url = `${API_URL}/api/v1/pedidos/?${queryParams.toString()}`
  const headers = {
    ...authHeader(),
    'ngrok-skip-browser-warning': 'true'
  }
  const res = await fetch(url, {
    headers
  })
  
  if (!res.ok) throw new Error('Error al cargar pedidos')
  return res.json()
}

export async function obtenerPedido(id: number): Promise<Pedido> {
  const headers = {
    ...authHeader(),
    'ngrok-skip-browser-warning': 'true'
  }
  const res = await fetch(`${API_URL}/api/v1/pedidos/${id}`, {
    headers
  })
  
  if (!res.ok) throw new Error('Error al cargar el pedido')
  return res.json()
}

export async function actualizarPedido(id: number, data: { estado?: string; notas?: string }): Promise<Pedido> {
  const headers = {
    ...authHeader(),
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
  
  const res = await fetch(`${API_URL}/api/v1/pedidos/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data)
  })
  
  if (!res.ok) throw new Error('Error al actualizar el pedido')
  return res.json()
}

export async function obtenerEstadisticasPedidos(params?: {
  empresa_id?: number
  campania_id?: string
  fecha_desde?: string
  fecha_hasta?: string
}): Promise<EstadisticasPedidosResumen> {
  const queryParams = new URLSearchParams()
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })
  }
  
  const url = `${API_URL}/api/v1/pedidos/estadisticas/resumen?${queryParams.toString()}`
  const headers = {
    ...authHeader(),
    'ngrok-skip-browser-warning': 'true'
  }
  const res = await fetch(url, {
    headers
  })
  
  if (!res.ok) throw new Error('Error al cargar estadísticas de pedidos')
  return res.json()
}

// Función para agrupar pedidos por día
export function agruparPedidosPorDia(pedidos: Pedido[]): { fecha: string; total: number; cantidad: number }[] {
  const agrupado: Record<string, { total: number; cantidad: number }> = {}
  
  pedidos.forEach(pedido => {
    if (pedido.estado !== 'confirmado') return
    
    const fecha = pedido.fecha_creacion.split('T')[0]
    if (!agrupado[fecha]) {
      agrupado[fecha] = { total: 0, cantidad: 0 }
    }
    agrupado[fecha].total += pedido.monto_total
    agrupado[fecha].cantidad += 1
  })
  
  return Object.entries(agrupado)
    .map(([fecha, datos]) => ({ fecha, ...datos }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

// Función para agrupar pedidos por campaña
export function agruparPedidosPorCampania(pedidos: Pedido[]): { campania: string; total: number; cantidad: number }[] {
  const agrupado: Record<string, { total: number; cantidad: number }> = {}
  
  pedidos.forEach(pedido => {
    if (pedido.estado !== 'confirmado') return
    
    const campania = pedido.campania_id || 'Sin campaña'
    if (!agrupado[campania]) {
      agrupado[campania] = { total: 0, cantidad: 0 }
    }
    agrupado[campania].total += pedido.monto_total
    agrupado[campania].cantidad += 1
  })
  
  return Object.entries(agrupado)
    .map(([campania, datos]) => ({ campania, ...datos }))
    .sort((a, b) => b.total - a.total)
}

// Función para obtener pedidos recientes
export function obtenerPedidosRecientes(pedidos: Pedido[], limite: number = 10): Pedido[] {
  return [...pedidos]
    .filter(p => p.estado === 'confirmado')
    .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
    .slice(0, limite)
}