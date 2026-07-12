import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('socket.io', () => ({ Server: vi.fn() }))
vi.mock('@socket.io/redis-adapter', () => ({ createAdapter: vi.fn() }))
vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }))
vi.mock('../prisma.js', () => ({ default: {} }))
vi.mock('../utils/roleUtils.js', () => ({ hasRole: vi.fn() }))
vi.mock('../routes/notifications.js', () => ({ createNotification: vi.fn() }))
vi.mock('../logger.js', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { wsRateLimit, setupSocket } from '../socket.js'

describe('wsRateLimit', () => {
  let socket

  beforeEach(() => {
    socket = { id: `test-${Date.now()}-${Math.random()}` }
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows up to 5 messages immediately', () => {
    for (let i = 0; i < 5; i++) {
      expect(wsRateLimit(socket)).toBe(true)
    }
  })

  it('blocks messages over the limit', () => {
    for (let i = 0; i < 5; i++) wsRateLimit(socket)
    expect(wsRateLimit(socket)).toBe(false)
  })

  it('refills tokens after 1 second', () => {
    for (let i = 0; i < 5; i++) wsRateLimit(socket)
    vi.advanceTimersByTime(1000)
    expect(wsRateLimit(socket)).toBe(true)
  })

  it('applies exponential backoff after violations', () => {
    for (let i = 0; i < 5; i++) wsRateLimit(socket)
    expect(wsRateLimit(socket)).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(wsRateLimit(socket)).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(wsRateLimit(socket)).toBe(true)
  })

  it('handles multiple sockets independently', () => {
    const s1 = { id: 'socket-a' }
    const s2 = { id: 'socket-b' }
    for (let i = 0; i < 5; i++) wsRateLimit(s1)
    expect(wsRateLimit(s2)).toBe(true)
  })
})

describe('setupSocket', () => {
  it('is a function', () => {
    expect(typeof setupSocket).toBe('function')
  })
})
