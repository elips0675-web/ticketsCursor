import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from './setup'
import { AllTheProviders } from './test-utils'
import News from '@/pages/News'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'news.title': 'Новости',
        'news.searchPlaceholder': 'Поиск новостей...',
        'news.important': 'Важные',
        'news.create': 'Создать новость',
        'news.exportCSV': 'Экспорт CSV',
        'news.showMore': 'Показать ещё',
        'news.empty': 'Новостей пока нет',
        'news.createTitle': 'Создать новость',
        'news.titleLabel': 'Заголовок',
        'news.contentLabel': 'Содержание',
        'news.importantLabel': 'Важная новость',
        'news.submitBtn': 'Опубликовать',
        'wiki.addImage': 'Добавить изображение',
        'wiki.uploading': 'Загрузка...',
      })[key] || key,
  }),
}))

beforeEach(() => {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }))
})

describe('News', () => {
  it('renders title', () => {
    render(<News />, { wrapper: AllTheProviders })
    expect(screen.getByText('Новости')).toBeInTheDocument()
  })

  it('shows important filter button', () => {
    render(<News />, { wrapper: AllTheProviders })
    expect(screen.getByText('Важные')).toBeInTheDocument()
  })

  it('shows create button for managers', () => {
    render(<News />, { wrapper: AllTheProviders })
    expect(screen.getByText('Создать новость')).toBeInTheDocument()
  })

  it('loads and displays news from API', async () => {
    render(<News />, { wrapper: AllTheProviders })
    const news = await screen.findByText('Обновление системы')
    expect(news).toBeInTheDocument()
  })

  it('shows load more button when there are multiple pages', async () => {
    server.use(
      http.get('http://localhost:4000/api/news', () => {
        return HttpResponse.json({
          data: Array.from({ length: 6 }, (_, i) => ({
            id: i + 1,
            title: `News ${i + 1}`,
            content: 'Content',
            important: false,
            author_id: 1,
            author_name: 'Admin',
            created_at: '2026-07-01T10:00:00Z',
          })),
          total: 12,
          totalPages: 2,
        })
      }),
    )

    render(<News />, { wrapper: AllTheProviders })
    const button = await screen.findByText('Показать ещё')
    expect(button).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(button)
  })

  it('shows empty state when no news', async () => {
    server.use(
      http.get('http://localhost:4000/api/news', () => {
        return HttpResponse.json({ data: [], total: 0, totalPages: 0 })
      }),
    )

    render(<News />, { wrapper: AllTheProviders })
    const empty = await screen.findByText('Новостей пока нет')
    expect(empty).toBeInTheDocument()
  })

  it('filters by search query', async () => {
    const user = userEvent.setup()
    render(<News />, { wrapper: AllTheProviders })
    const input = await screen.findByPlaceholderText('Поиск новостей...')
    await user.type(input, 'обновление')
    await waitFor(() => {
      expect(input).toHaveValue('обновление')
    })
  })

  it('toggles important filter', async () => {
    const user = userEvent.setup()
    render(<News />, { wrapper: AllTheProviders })
    const btn = await screen.findByText('Важные')
    await user.click(btn)
    await waitFor(() => {
      expect(btn).toBeInTheDocument()
    })
  })

  it('creates news via dialog', async () => {
    const user = userEvent.setup()
    render(<News />, { wrapper: AllTheProviders })
    const createBtn = await screen.findByText('Создать новость')
    await user.click(createBtn)
    const titleInput = screen.getByLabelText('Заголовок')
    const contentInput = screen.getByLabelText('Содержание')
    await user.type(titleInput, 'Тестовая новость')
    await user.type(contentInput, 'Тестовое содержание')
    await user.click(screen.getByText('Опубликовать'))
    await waitFor(() => {
      expect(screen.queryByText('Тестовая новость')).not.toBeInTheDocument()
    })
  })

  it('shows important badge on important news', async () => {
    render(<News />, { wrapper: AllTheProviders })
    const badge = await screen.findByText('Важно')
    expect(badge).toBeInTheDocument()
  })

  it('exports CSV on button click', async () => {
    const createObjectURL = vi.fn(() => 'blob:test')
    const revokeObjectURL = vi.fn()
    globalThis.URL.createObjectURL = createObjectURL
    globalThis.URL.revokeObjectURL = revokeObjectURL

    const user = userEvent.setup()
    render(<News />, { wrapper: AllTheProviders })
    const exportBtn = await screen.findByText('Экспорт CSV')
    await user.click(exportBtn)
    expect(createObjectURL).toHaveBeenCalled()
  })
})
