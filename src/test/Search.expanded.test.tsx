import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllTheProviders } from './test-utils'
import Search from '@/pages/Search'

const mockResults = {
  tickets: [
    { id: 1, title: 'Network issue', status: 'open', priority: 'critical' },
    { id: 2, title: 'Printer jam', status: 'in_progress', priority: 'medium' },
  ],
  employees: [{ id: 3, name: 'Alice Smith', email: 'alice@test.com', department: 'IT' }],
  wiki: [{ id: 4, title: 'How to reset password', category: 'FAQ' }],
  news: [{ id: 5, title: 'Company holiday schedule' }],
  chats: [{ id: 6, name: 'General Chat' }],
  files: [{ id: 7, original_name: 'report.pdf', name: 'report.pdf', mime_type: 'application/pdf', size: 204800 }],
}

const emptyResults = {
  tickets: [],
  employees: [],
  wiki: [],
  news: [],
  chats: [],
  files: [],
}

beforeEach(() => {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }))
  vi.restoreAllMocks()
  globalThis.fetch = vi.fn()
})

afterEach(() => {
  delete (globalThis as { fetch?: unknown }).fetch
})

describe('Search Page', () => {
  it('renders title', () => {
    render(<Search />, { wrapper: AllTheProviders })
    expect(screen.getByText('Глобальный поиск')).toBeInTheDocument()
  })

  it('shows search input', () => {
    render(<Search />, { wrapper: AllTheProviders })
    expect(screen.getByPlaceholderText(/введите запрос/i)).toBeInTheDocument()
  })

  it('focuses search input on mount', () => {
    render(<Search />, { wrapper: AllTheProviders })
    const input = screen.getByPlaceholderText(/введите запрос/i)
    expect(document.activeElement).toBe(input)
  })

  it('does not show results when query is too short', () => {
    render(<Search />, { wrapper: AllTheProviders })
    expect(screen.queryByText('Тикеты')).not.toBeInTheDocument()
    expect(screen.queryByText('Сотрудники')).not.toBeInTheDocument()
  })

  it('shows search results after typing', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResults),
    })
    render(<Search />, { wrapper: AllTheProviders })
    const input = screen.getByPlaceholderText(/введите запрос/i)
    await user.type(input, 'network')
    await waitFor(
      () => {
        expect(screen.getByText('Network issue')).toBeInTheDocument()
      },
      { timeout: 1500 },
    )
  })

  it('shows all section headings when results exist', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResults),
    })
    render(<Search />, { wrapper: AllTheProviders })
    const input = screen.getByPlaceholderText(/введите запрос/i)
    await user.type(input, 'test')
    await waitFor(
      () => {
        expect(screen.getByText('Тикеты')).toBeInTheDocument()
      },
      { timeout: 1500 },
    )
    expect(screen.getByText('Сотрудники')).toBeInTheDocument()
    expect(screen.getByText('База знаний')).toBeInTheDocument()
    expect(screen.getByText('Новости')).toBeInTheDocument()
    expect(screen.getByText('Чаты')).toBeInTheDocument()
    expect(screen.getByText('Файлы')).toBeInTheDocument()
  })

  it('shows result counts in section headers', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResults),
    })
    render(<Search />, { wrapper: AllTheProviders })
    const input = screen.getByPlaceholderText(/введите запрос/i)
    await user.type(input, 'test')
    await waitFor(
      () => {
        expect(screen.getByText('(2)')).toBeInTheDocument()
      },
      { timeout: 1500 },
    )
  })

  it('shows no results message when nothing found', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(emptyResults),
    })
    render(<Search />, { wrapper: AllTheProviders })
    const input = screen.getByPlaceholderText(/введите запрос/i)
    await user.type(input, 'zzzzz')
    await waitFor(
      () => {
        expect(screen.getByText(/ничего не найдено/i)).toBeInTheDocument()
      },
      { timeout: 1500 },
    )
  })

  it('clears results when query becomes shorter than 2 chars', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResults),
    })
    render(<Search />, { wrapper: AllTheProviders })
    const input = screen.getByPlaceholderText(/введите запрос/i)
    await user.type(input, 'network')
    await waitFor(
      () => {
        expect(screen.getByText('Network issue')).toBeInTheDocument()
      },
      { timeout: 1500 },
    )
    await user.clear(input)
    await user.type(input, 'a')
    await waitFor(
      () => {
        expect(screen.queryByText('Network issue')).not.toBeInTheDocument()
      },
      { timeout: 1500 },
    )
  })
})
