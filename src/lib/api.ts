import { toast } from 'sonner'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function handleResponse<T = unknown>(res: Response): Promise<T | null> {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Сессия истекла')
  }
  if (res.status === 204) return null
  const payload = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(payload?.message || `Ошибка ${res.status}`)
  }
  if (payload && typeof payload === 'object' && typeof payload.success === 'boolean') {
    if (Object.prototype.hasOwnProperty.call(payload, 'data')) return payload.data as T
    return payload as T
  }
  return payload as T
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  opts?: RequestInit,
): Promise<T | null> {
  const token = getToken()
  const headers: Record<string, string> = { ...(opts?.headers as Record<string, string>) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      ...opts,
    })
    return await handleResponse<T>(res)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ошибка сети'
    if (msg === 'Сессия истекла') throw err
    toast.error(msg)
    throw err
  }
}

export const api = {
  get: <T = unknown>(path: string, opts?: RequestInit) => request<T>('GET', path, undefined, opts),
  post: <T = unknown>(path: string, body?: unknown, opts?: RequestInit) => request<T>('POST', path, body, opts),
  put: <T = unknown>(path: string, body?: unknown, opts?: RequestInit) => request<T>('PUT', path, body, opts),
  delete: <T = unknown>(path: string, opts?: RequestInit) => request<T>('DELETE', path, undefined, opts),
}
