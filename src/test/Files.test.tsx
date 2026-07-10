import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import Files from '@/pages/Files'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'files.title': 'Файлы',
      'files.searchPlaceholder': 'Поиск файлов...',
      'files.createFolder': 'Создать папку',
      'files.upload': 'Загрузить',
      'files.gridView': 'Сетка',
      'files.tableView': 'Список',
      'files.noFolders': 'Нет папок',
      'files.noFiles': 'Нет файлов',
      'files.dropzone': 'Перетащите файлы сюда',
      'files.typeFilter': 'Тип',
      'files.all': 'Все',
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
})
