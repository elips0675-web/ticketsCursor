import { api, API_URL } from '@/lib/api'
import { toast } from 'sonner'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('api.get', () => {
  it('calls fetch with correct method and headers', async () => {
    localStorage.setItem('token', 'test-token')
    const mock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true, data: [{ id: 1 }] }), status: 200 })
    vi.stubGlobal('fetch', mock)
    const result = await api.get('/tickets')
    expect(mock).toHaveBeenCalledWith(
      `${API_URL}/tickets`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    )
    expect(result).toEqual([{ id: 1 }])
  })
})

describe('api.post', () => {
  it('sends JSON body', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true, data: { id: 1 } }), status: 200 })
    vi.stubGlobal('fetch', mock)
    const result = await api.post('/tickets', { title: 'Test' })
    expect(mock).toHaveBeenCalledWith(
      `${API_URL}/tickets`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      }),
    )
    expect(result).toEqual({ id: 1 })
  })
})

describe('api.put', () => {
  it('sends PUT request', async () => {
    const mock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }), status: 200 })
    vi.stubGlobal('fetch', mock)
    await api.put('/tickets/1', { status: 'closed' })
    expect(mock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'PUT' }))
  })
})

describe('api.delete', () => {
  it('sends DELETE request', async () => {
    const mock = vi.fn().mockResolvedValue({ ok: true, status: 204 })
    vi.stubGlobal('fetch', mock)
    const result = await api.delete('/tickets/1')
    expect(result).toBeNull()
  })
})

describe('error handling', () => {
  it('redirects on 401', async () => {
    localStorage.setItem('token', 'bad')
    const mock = vi.fn().mockResolvedValue({ ok: false, status: 401 })
    vi.stubGlobal('fetch', mock)
    await expect(api.get('/tickets')).rejects.toThrow('Сессия истекла')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('shows toast on network error', async () => {
    const toastSpy = vi.spyOn(toast, 'error')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Error')))
    await expect(api.get('/tickets')).rejects.toThrow('Network Error')
    expect(toastSpy).toHaveBeenCalled()
  })
})
