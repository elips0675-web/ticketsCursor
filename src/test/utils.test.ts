import { cn, formatDate, formatTime, formatRelativeTime } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('handles conditional classes', () => {
    expect(cn('base', (false as unknown as string) && 'hidden', 'visible')).toBe('base visible')
  })
  it('handles undefined', () => {
    expect(cn('a', undefined, 'b')).toBe('a b')
  })
})

describe('formatDate', () => {
  it('formats date in russian', () => {
    const result = formatDate('2026-07-11T12:00:00Z')
    expect(result).toContain('июл')
    expect(result).toContain('2026')
  })
})

describe('formatTime', () => {
  it('returns HH:mm format', () => {
    const result = formatTime('2026-07-11T14:30:00Z')
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })
})

describe('formatRelativeTime', () => {
  it('returns relative time for today', () => {
    const now = new Date()
    const recent = new Date(now.getTime() - 3600000).toISOString()
    const result = formatRelativeTime(recent)
    expect(result).toContain('час')
  })
})
