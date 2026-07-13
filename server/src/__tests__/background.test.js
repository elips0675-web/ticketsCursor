import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../prisma.js', () => ({
  default: {
    notifications: {
      deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
    },
    tickets: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    employees: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}))

vi.mock('../email.js', () => ({ sendTicketNotification: vi.fn().mockResolvedValue() }))
vi.mock('../notify.js', () => ({ notifySlaBreached: vi.fn() }))
vi.mock('../logger.js', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

describe('background.js (no Redis)', () => {
  beforeEach(() => {
    delete process.env.REDIS_URL
    vi.resetModules()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stopBackgroundJobs clears timers', async () => {
    const { stopBackgroundJobs, setupBackgroundJobs } = await import('../background.js')
    const prisma = (await import('../prisma.js')).default
    await setupBackgroundJobs(prisma)
    expect(() => stopBackgroundJobs()).not.toThrow()
  })

  it('stopBackgroundJobs does not throw when called without setup', async () => {
    const { stopBackgroundJobs } = await import('../background.js')
    expect(() => stopBackgroundJobs()).not.toThrow()
  })

  it('warns admin when Redis missing', async () => {
    const prisma = (await import('../prisma.js')).default
    const email = await import('../email.js')

    prisma.employees.findMany.mockResolvedValue([
      { email: 'admin@company.ru' },
    ])

    const { setupBackgroundJobs, stopBackgroundJobs } = await import('../background.js')
    await setupBackgroundJobs(prisma)

    expect(prisma.employees.findMany).toHaveBeenCalled()
    expect(email.sendTicketNotification).toHaveBeenCalled()
    stopBackgroundJobs()
  })

  it('handles Redis warning email error gracefully', async () => {
    const prisma = (await import('../prisma.js')).default
    const logger = await import('../logger.js')

    prisma.employees.findMany.mockRejectedValue(new Error('DB error'))

    const { setupBackgroundJobs, stopBackgroundJobs } = await import('../background.js')
    await setupBackgroundJobs(prisma)

    expect(logger.default.error).toHaveBeenCalled()
    stopBackgroundJobs()
  })
})
