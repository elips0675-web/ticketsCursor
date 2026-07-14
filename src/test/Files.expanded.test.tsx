import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from './setup'
import { AllTheProviders } from './test-utils'
import Files from '@/pages/Files'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'files.title': 'Файлы',
        'files.catAll': 'Все',
        'files.catImages': 'Картинки',
        'files.catPDF': 'PDF',
        'files.catDocs': 'Докум.',
        'files.catCode': 'Код',
        'files.dropzone': 'Перетащите файлы сюда',
        'files.searchInFolder': 'Поиск в папке',
        'files.searchAll': 'Поиск по всем файлам',
        'files.uploadSuccess': 'Файл загружен',
        'files.uploadError': 'Ошибка загрузки',
        'files.empty': 'Нет файлов',
      })[key] || key,
  }),
}))

beforeEach(() => {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }))
})

describe('Files', () => {
  it('renders title', () => {
    render(<Files />, { wrapper: AllTheProviders })
    expect(screen.getByText('Файлы')).toBeInTheDocument()
  })

  it('loads and displays folders from API', async () => {
    render(<Files />, { wrapper: AllTheProviders })
    const folder = await screen.findByText('Документы')
    expect(folder).toBeInTheDocument()
  })

  it('shows upload dropzone text', () => {
    render(<Files />, { wrapper: AllTheProviders })
    expect(screen.getByText('Перетащите файлы сюда')).toBeInTheDocument()
  })

  it('shows file items within folder', async () => {
    render(<Files />, { wrapper: AllTheProviders })
    const file = await screen.findByText('report.pdf')
    expect(file).toBeInTheDocument()
  })

  it('shows empty state when no files in folder', async () => {
    server.use(
      http.get('http://localhost:4000/api/files/folders', () => {
        return HttpResponse.json([
          { id: 1, name: 'Пустая папка', user_id: 1, is_shared: false, files: [], totalFiles: 0 },
        ])
      }),
    )
    render(<Files />, { wrapper: AllTheProviders })
    const empty = await screen.findByText('Нет файлов')
    expect(empty).toBeInTheDocument()
  })

  it('loads all files for search mode', async () => {
    const user = userEvent.setup()
    render(<Files />, { wrapper: AllTheProviders })
    await screen.findByText('report.pdf')
    const input = screen.getByPlaceholderText('Поиск в папке')
    await user.type(input, 'report')
    await waitFor(() => {
      expect(screen.getByText('report.pdf')).toBeInTheDocument()
    })
  })

  it('toggles grid/list view', async () => {
    const user = userEvent.setup()
    render(<Files />, { wrapper: AllTheProviders })
    await screen.findByText('report.pdf')
    await user.click(screen.getByLabelText('Вид списком'))
  })

  it('opens file in new tab on card click', async () => {
    const openSpy = vi.fn()
    vi.stubGlobal('open', openSpy)
    const user = userEvent.setup()
    render(<Files />, { wrapper: AllTheProviders })
    await screen.findByText('report.pdf')
    await user.click(screen.getByText('report.pdf'))
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalled()
    })
    vi.unstubAllGlobals()
  })

  it('filters files by category tab', async () => {
    const user = userEvent.setup()
    render(<Files />, { wrapper: AllTheProviders })
    await screen.findByText('report.pdf')
    const pdfTab = screen.getByText('PDF')
    await user.click(pdfTab)
    await waitFor(() => {
      expect(screen.getByText('report.pdf')).toBeInTheDocument()
    })
  })
})
