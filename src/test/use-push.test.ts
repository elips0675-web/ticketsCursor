import { renderHook, act } from '@testing-library/react'
import { usePush } from '@/lib/use-push'

const mockRegistration = { pushManager: { subscribe: vi.fn(), getSubscription: vi.fn() } }
const mockServiceWorker = {
  ready: Promise.resolve(mockRegistration),
}

beforeEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(navigator, 'serviceWorker', { value: mockServiceWorker, configurable: true, writable: true })
  ;(globalThis as unknown as Record<string, unknown>).PushManager = vi.fn()
})

describe('usePush', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => usePush())
    expect(result.current.subscribed).toBe(false)
    expect(typeof result.current.subscribe).toBe('function')
    expect(typeof result.current.unsubscribe).toBe('function')
  })

  it('checks subscription status on mount', async () => {
    mockRegistration.pushManager.getSubscription.mockResolvedValue({
      toJSON: () => ({ keys: { p256dh: 'key', auth: 'auth' } }),
    })
    const { result } = renderHook(() => usePush())
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(result.current.subscribed).toBe(true)
  })

  it('subscribe calls pushManager.subscribe', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { publicKey: 'test-key' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    mockRegistration.pushManager.subscribe.mockResolvedValue({
      toJSON: () => ({ keys: { p256dh: 'key', auth: 'auth' } }),
    })
    localStorage.setItem('token', 'test-token')
    const { result } = renderHook(() => usePush())
    // Wait for supported=true from useEffect
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
    await act(async () => {
      await result.current.subscribe()
    })
    expect(mockRegistration.pushManager.subscribe).toHaveBeenCalled()
  })

  it('unsubscribe calls pushManager.getSubscription and unsubscribes', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({ ok: true })
    const sub = {
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      toJSON: () => ({ keys: { p256dh: 'key', auth: 'auth' } }),
    }
    mockRegistration.pushManager.getSubscription.mockResolvedValue(sub)
    localStorage.setItem('token', 'test-token')
    const { result } = renderHook(() => usePush())
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
    await act(async () => {
      await result.current.unsubscribe()
    })
    expect(sub.unsubscribe).toHaveBeenCalled()
  })
})
