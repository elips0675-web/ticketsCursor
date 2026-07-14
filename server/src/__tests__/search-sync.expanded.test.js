import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockIndex = vi.hoisted(() => ({
  updateFilterableAttributes: vi.fn().mockResolvedValue(),
  updateSearchableAttributes: vi.fn().mockResolvedValue(),
  updateSettings: vi.fn().mockResolvedValue(),
  addDocuments: vi.fn().mockResolvedValue(),
  deleteDocument: vi.fn().mockResolvedValue(),
  search: vi.fn().mockResolvedValue({ hits: [] }),
}))
const mockMeilisearchClient = vi.hoisted(() => ({ index: vi.fn(() => mockIndex) }))
const mockMeiliError = vi.hoisted(() => ({ value: false }))
const mockMeilisearchConstructor = vi.hoisted(() => vi.fn(function() {
  if (mockMeiliError.value) throw new Error('connection failed')
  return mockMeilisearchClient
}))

const mockPrisma = vi.hoisted(() => ({
  tickets: { findMany: vi.fn().mockResolvedValue([]) },
  employees: { findMany: vi.fn().mockResolvedValue([]) },
  wiki_articles: { findMany: vi.fn().mockResolvedValue([]) },
  news_posts: { findMany: vi.fn().mockResolvedValue([]) },
  chat_rooms: { findMany: vi.fn().mockResolvedValue([]) },
  files: { findMany: vi.fn().mockResolvedValue([]) },
}))
const mockLogger = vi.hoisted(() => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

vi.mock('meilisearch', () => ({ Meilisearch: mockMeilisearchConstructor }))
vi.mock('../prisma.js', () => ({ default: mockPrisma }))
vi.mock('../logger.js', () => mockLogger)

function resetMocks() {
  mockMeiliError.value = false
  mockMeilisearchConstructor.mockClear().mockImplementation(function() {
    if (mockMeiliError.value) throw new Error('connection failed')
    return mockMeilisearchClient
  })
  mockIndex.updateFilterableAttributes.mockReset().mockResolvedValue()
  mockIndex.updateSearchableAttributes.mockReset().mockResolvedValue()
  mockIndex.updateSettings.mockReset().mockResolvedValue()
  mockIndex.addDocuments.mockReset().mockResolvedValue()
  mockIndex.deleteDocument.mockReset().mockResolvedValue()
  mockIndex.search.mockReset().mockResolvedValue({ hits: [] })
  mockMeilisearchClient.index.mockReset().mockReturnValue(mockIndex)
  mockPrisma.tickets.findMany.mockReset().mockResolvedValue([])
  mockPrisma.employees.findMany.mockReset().mockResolvedValue([])
  mockPrisma.wiki_articles.findMany.mockReset().mockResolvedValue([])
  mockPrisma.news_posts.findMany.mockReset().mockResolvedValue([])
  mockPrisma.chat_rooms.findMany.mockReset().mockResolvedValue([])
  mockPrisma.files.findMany.mockReset().mockResolvedValue([])
  mockLogger.default.info.mockReset()
  mockLogger.default.warn.mockReset()
  mockLogger.default.error.mockReset()
}

describe('search-sync.js', () => {
  beforeEach(() => {
    vi.resetModules()
    resetMocks()
  })

  describe('initSearchSync', () => {
    it('logs not configured when Meilisearch unavailable', async () => {
      mockMeiliError.value = true
      const { initSearchSync } = await import('../search-sync.js')
      await initSearchSync()
      expect(mockLogger.default.warn).toHaveBeenCalledWith('Meilisearch not available, using FULLTEXT fallback')
    })

    it('calls setupIndexes and fullSync when configured', async () => {
      const { initSearchSync } = await import('../search-sync.js')
      await initSearchSync()
      expect(mockLogger.default.info).toHaveBeenCalledWith('Meilisearch indexes configured')
      expect(mockLogger.default.info).toHaveBeenCalledWith('Meilisearch ready')
    })

    it('does not call fullSync if setupIndexes fails', async () => {
      mockIndex.updateSettings.mockRejectedValue(new Error('setup fail'))
      mockIndex.updateFilterableAttributes.mockRejectedValue(new Error('setup fail'))
      mockIndex.updateSearchableAttributes.mockRejectedValue(new Error('setup fail'))
      const { initSearchSync } = await import('../search-sync.js')
      await initSearchSync()
      expect(mockLogger.default.warn).toHaveBeenCalled()
    })
  })

  describe('searchMeilisearch', () => {
    it('returns null when no client', async () => {
      mockMeiliError.value = true
      const { searchMeilisearch } = await import('../search-sync.js')
      const result = await searchMeilisearch('test')
      expect(result).toBeNull()
    })

    it('searches all indexes and returns results', async () => {
      mockIndex.search.mockResolvedValue({ hits: [{ id: 1, title: 'Test', _formatted: {} }] })
      const { searchMeilisearch } = await import('../search-sync.js')
      const result = await searchMeilisearch('test', 5)
      expect(result).toHaveProperty('tickets')
      expect(result.tickets[0]).not.toHaveProperty('_formatted')
    })

    it('returns null on search error', async () => {
      mockIndex.search.mockRejectedValue(new Error('search error'))
      const { searchMeilisearch } = await import('../search-sync.js')
      const result = await searchMeilisearch('test')
      expect(result).toBeNull()
      expect(mockLogger.default.warn).toHaveBeenCalled()
    })
  })

  describe('syncEntity', () => {
    it('does nothing when no client', async () => {
      mockMeiliError.value = true
      const { syncEntity } = await import('../search-sync.js')
      await syncEntity('tickets', 'upsert', { id: 1 })
      expect(mockIndex.addDocuments).not.toHaveBeenCalled()
    })

    it('does nothing for unknown entity', async () => {
      const { syncEntity } = await import('../search-sync.js')
      await syncEntity('unknown', 'upsert', { id: 1 })
      expect(mockIndex.addDocuments).not.toHaveBeenCalled()
    })

    it('upserts document', async () => {
      const { syncEntity } = await import('../search-sync.js')
      await syncEntity('tickets', 'upsert', { id: 1, title: 'Test' })
      expect(mockIndex.addDocuments).toHaveBeenCalledWith([{ id: 1, title: 'Test' }])
    })

    it('deletes document', async () => {
      const { syncEntity } = await import('../search-sync.js')
      await syncEntity('tickets', 'delete', { id: 5 })
      expect(mockIndex.deleteDocument).toHaveBeenCalledWith(5)
    })

    it('handles sync error', async () => {
      mockIndex.addDocuments.mockRejectedValue(new Error('sync error'))
      const { syncEntity } = await import('../search-sync.js')
      await syncEntity('tickets', 'upsert', { id: 1 })
      expect(mockLogger.default.warn).toHaveBeenCalled()
    })
  })

  describe('fullSync', () => {
    it('does nothing when no client', async () => {
      mockMeiliError.value = true
      const { initSearchSync } = await import('../search-sync.js')
      await initSearchSync()
      expect(mockPrisma.tickets.findMany).not.toHaveBeenCalled()
    })

    it('reindexes all entities from database', async () => {
      mockPrisma.tickets.findMany.mockResolvedValue([{ id: 1, title: 'Ticket 1', description: null, status: 'open', priority: 'medium', category: null }])
      mockPrisma.employees.findMany.mockResolvedValue([{ id: 1, name: 'John', email: 'john@test.com', department: 'IT' }])
      mockPrisma.wiki_articles.findMany.mockResolvedValue([{ id: 1, title: 'Wiki 1', content: 'Content', category: 'help' }])
      mockPrisma.news_posts.findMany.mockResolvedValue([{ id: 1, title: 'News 1', content: 'Content' }])
      mockPrisma.chat_rooms.findMany.mockResolvedValue([{ id: 1, name: 'Chat 1' }])
      mockPrisma.files.findMany.mockResolvedValue([{ id: 1, name: 'File 1' }])

      const { initSearchSync } = await import('../search-sync.js')
      await initSearchSync()
      expect(mockIndex.addDocuments).toHaveBeenCalledTimes(6)
      expect(mockLogger.default.info).toHaveBeenCalledWith(expect.stringContaining('Meilisearch full sync complete'))
    })

    it('handles full sync error', async () => {
      mockPrisma.tickets.findMany.mockRejectedValue(new Error('db error'))
      const { initSearchSync } = await import('../search-sync.js')
      await initSearchSync()
      expect(mockLogger.default.error).toHaveBeenCalled()
    })
  })
})
