import { authHeader } from './auth'
const API_URL = import.meta.env.VITE_API_URL

export interface Venta {
  id: number
  empresa_id: number
  cliente_id: number
  campania_id: string | null
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  monto_total: number
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'reembolsada'
  comprobante_url: string | null
  notas: string | null
  fecha_venta: string
  fecha_actualizacion: string | null
}

export interface EstadisticasResumen {
  total_ventas: number
  total_ingresos: number
  promedio_venta: number
  fecha_desde: string | null
  fecha_hasta: string | null
}

export interface VentasResponse {
  data: Venta[]
  total: number
}

export async function listarVentas(params?: {
  empresa_id?: number
  cliente_id?: number
  campania_id?: string
  estado?: string
  fecha_desde?: string
  fecha_hasta?: string
  skip?: number
  limit?: number
}): Promise<Venta[]> {
  const queryParams = new URLSearchParams()
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })
  }
  
  const url = `${API_URL}/api/v1/ventas?${queryParams.toString()}`
  const res = await fetch(url, {
    headers: authHeader()
  })
  
  if (!res.ok) throw new Error('Error al cargar ventas')
  return res.json()
}

export async function obtenerVenta(id: number): Promise<Venta> {
  const res = await fetch(`${API_URL}/api/v1/ventas/${id}`, {
    headers: authHeader()
  })
  
  if (!res.ok) throw new Error('Error al cargar la venta')
  return res.json()
}

export async function obtenerEstadisticas(params?: {
  empresa_id?: number
  campania_id?: string
  fecha_desde?: string
  fecha_hasta?: string
}): Promise<EstadisticasResumen> {
  const queryParams = new URLSearchParams()
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })
  }
  
  const url = `${API_URL}/api/v1/ventas/estadisticas/resumen?${queryParams.toString()}`
  const res = await fetch(url, {
    headers: authHeader()
  })
  
  if (!res.ok) throw new Error('Error al cargar estadísticas')
  return res.json()
}

export function agruparVentasPorDia(ventas: Venta[]): { fecha: string; total: number; cantidad: number }[] {
  const agrupado: Record<string, { total: number; cantidad: number }> = {}
  
  ventas.forEach(venta => {
    if (venta.estado !== 'confirmada') return
    
    const fecha = venta.fecha_venta.split('T')[0] // YYYY-MM-DD
    if (!agrupado[fecha]) {
      agrupado[fecha] = { total: 0, cantidad: 0 }
    }
    agrupado[fecha].total += venta.monto_total
    agrupado[fecha].cantidad += venta.cantidad
  })
  
  return Object.entries(agrupado)
    .map(([fecha, datos]) => ({ fecha, ...datos }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function agruparVentasPorCampania(ventas: Venta[]): { campania: string; total: number; cantidad: number }[] {
  const agrupado: Record<string, { total: number; cantidad: number }> = {}
  
  ventas.forEach(venta => {
    if (venta.estado !== 'confirmada') return
    
    const campania = venta.campania_id || 'Sin campaña'
    if (!agrupado[campania]) {
      agrupado[campania] = { total: 0, cantidad: 0 }
    }
    agrupado[campania].total += venta.monto_total
    agrupado[campania].cantidad += venta.cantidad
  })
  
  return Object.entries(agrupado)
    .map(([campania, datos]) => ({ campania, ...datos }))
    .sort((a, b) => b.total - a.total)
}

export function obtenerVentasRecientes(ventas: Venta[], limite: number = 10): Venta[] {
  return [...ventas]
    .filter(v => v.estado === 'confirmada')
    .sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())
    .slice(0, limite)
}