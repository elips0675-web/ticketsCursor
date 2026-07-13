import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('ioredis', () => {
  const Redis = vi.fn()
  return { default: Redis }
})

beforeEach(() => {
  delete process.env.REDIS_URL
  vi.resetModules()
})

describe('cacheMiddleware', () => {
  it('skips non-GET requests', async () => {
    const { cacheMiddleware } = await import('../cache.js')
    const req = { method: 'POST', headers: {}, originalUrl: '/api/tickets' }
    const res = { json: vi.fn() }
    const next = vi.fn()
    cacheMiddleware(60)(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('calls next for uncached GET after wrapping res.json', async () => {
    const { cacheMiddleware } = await import('../cache.js')
    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer token123' },
      originalUrl: '/api/employees',
    }
    const res = { json: vi.fn() }
    const next = vi.fn()
    await cacheMiddleware(60)(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(typeof res.json).toBe('function')
  })

  it('returns cached response on subsequent call', async () => {
    const { cacheMiddleware } = await import('../cache.js')
    const middleware = cacheMiddleware(60)

    const req1 = { method: 'GET', headers: { authorization: 'Bearer abc' }, originalUrl: '/api/tickets' }
    const res1 = { json: vi.fn() }
    const next1 = vi.fn()
    await middleware(req1, res1, next1)
    res1.json([{ id: 1, title: 'Test' }])

    const req2 = { method: 'GET', headers: { authorization: 'Bearer abc' }, originalUrl: '/api/tickets' }
    const res2 = { json: vi.fn() }
    const next2 = vi.fn()
    await middleware(req2, res2, next2)
    expect(next2).not.toHaveBeenCalled()
    expect(res2.json).toHaveBeenCalledWith([{ id: 1, title: 'Test' }])
  })

  it('uses different cache keys for different auth tokens', async () => {
    const { cacheMiddleware } = await import('../cache.js')
    const middleware = cacheMiddleware(60)

    const req1 = { method: 'GET', headers: { authorization: 'Bearer abc' }, originalUrl: '/api/tickets' }
    const res1 = { json: vi.fn() }
    const next1 = vi.fn()
    await middleware(req1, res1, next1)
    res1.json({ data: 'for abc' })

    const req2 = { method: 'GET', headers: { authorization: 'Bearer xyz' }, originalUrl: '/api/tickets' }
    const res2 = { json: vi.fn() }
    const next2 = vi.fn()
    await middleware(req2, res2, next2)
    expect(next2).toHaveBeenCalled()
    res2.json({ data: 'for xyz' })
  })
})

describe('invalidateCache', () => {
  it('invalidates cached responses', async () => {
    const { cacheMiddleware, invalidateCache } = await import('../cache.js')
    const middleware = cacheMiddleware(60)

    const req = { method: 'GET', headers: { authorization: 'Bearer def' }, originalUrl: '/api/test' }
    const res = { json: vi.fn() }
    const next = vi.fn()
    await middleware(req, res, next)
    res.json({ cached: true })

    await invalidateCache('cache:*')

    const req2 = { method: 'GET', headers: { authorization: 'Bearer def' }, originalUrl: '/api/test' }
    const res2 = { json: vi.fn() }
    const next2 = vi.fn()
    await middleware(req2, res2, next2)
    expect(next2).toHaveBeenCalled()
  })
})

describe('Redis fallback', () => {
  it('falls back to memory on Redis connection error', async () => {
    process.env.REDIS_URL = 'redis://invalid:6379'
    const Redis = (await import('ioredis')).default
    Redis.mockImplementation(function() { throw new Error('connection failed') })

    const { cacheMiddleware } = await import('../cache.js')
    const middleware = cacheMiddleware(60)

    const req = { method: 'GET', headers: { authorization: 'Bearer f' }, originalUrl: '/api/f' }
    const res = { json: vi.fn() }
    const next = vi.fn()
    await middleware(req, res, next)
    res.json({ fallback: true })
    expect(next).toHaveBeenCalled()
  })
})
