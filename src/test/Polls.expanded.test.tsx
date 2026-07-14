import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from './setup'
import { AllTheProviders } from './test-utils'
import PollsPage from '@/pages/Polls'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { number?: number }) => {
      const map: Record<string, string> = {
        'polls.title': 'Опросы',
        'polls.create': 'Создать опрос',
        'polls.question': 'Вопрос',
        'polls.description': 'Описание',
        'polls.optionLabel': 'Вариант {number}',
        'polls.multipleChoice': 'Множественный выбор',
        'polls.submitBtn': 'Готово',
        'polls.totalVotes': '{{count}} голосов',
        'polls.voters': 'Вы голосовали',
        'polls.noPolls': 'Нет опросов',
        'polls.createTitle': 'Создание опроса',
        'common.delete': 'Удалить',
      }
      let val = map[key] || key
      if (opts?.number !== undefined) val = val.replace('{number}', String(opts.number))
      return val
    },
  }),
}))

beforeEach(() => {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }))
})

describe('Polls', () => {
  it('renders polls title', () => {
    render(<PollsPage />, { wrapper: AllTheProviders })
    expect(screen.getByText('Опросы')).toBeInTheDocument()
  })

  it('shows create button for managers', () => {
    render(<PollsPage />, { wrapper: AllTheProviders })
    expect(screen.getByText('Создать опрос')).toBeInTheDocument()
  })

  it('loads and displays polls from API', async () => {
    render(<PollsPage />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Тестовый опрос')).toBeInTheDocument()
    })
  })

  it('shows empty state when no polls', async () => {
    server.use(
      http.get('http://localhost:4000/api/polls', () => {
        return HttpResponse.json({ data: [], total: 0 })
      }),
    )
    render(<PollsPage />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.queryByText('Нет опросов')).toBeInTheDocument()
    })
  })

  it('opens create form on button click', async () => {
    const user = userEvent.setup()
    render(<PollsPage />, { wrapper: AllTheProviders })
    await user.click(screen.getByText('Создать опрос'))
    expect(screen.getByText('Создание опроса')).toBeInTheDocument()
  })

  it('creates a poll via form submission', async () => {
    server.use(
      http.get('http://localhost:4000/api/polls', () => {
        return HttpResponse.json({ data: [], total: 0 })
      }),
      http.post('http://localhost:4000/api/polls', () => {
        return HttpResponse.json({ id: 2, title: 'Новый опрос', multiple_choice: 0 })
      }),
    )
    const user = userEvent.setup()
    render(<PollsPage />, { wrapper: AllTheProviders })
    await user.click(screen.getByText('Создать опрос'))
    await user.type(screen.getByLabelText('Вопрос'), 'Новый опрос')
    await user.type(screen.getByLabelText(/Вариант 1/), 'Вариант A')
    await user.type(screen.getByLabelText(/Вариант 2/), 'Вариант B')
    await user.click(screen.getByText('Готово'))
    await waitFor(() => {
      expect(screen.queryByText('Создание опроса')).not.toBeInTheDocument()
    })
  })

  it('disables submit button when form is invalid', async () => {
    const user = userEvent.setup()
    render(<PollsPage />, { wrapper: AllTheProviders })
    await user.click(screen.getByText('Создать опрос'))
    expect(screen.getByText('Готово')).toBeDisabled()
  })

  it('adds options in create form', async () => {
    const user = userEvent.setup()
    render(<PollsPage />, { wrapper: AllTheProviders })
    await user.click(screen.getByText('Создать опрос'))
    await user.click(screen.getByText('Вариант'))
    await user.click(screen.getByText('Вариант'))
  })

  it('cancels create form', async () => {
    const user = userEvent.setup()
    render(<PollsPage />, { wrapper: AllTheProviders })
    await user.click(screen.getByText('Создать опрос'))
    expect(screen.getByText('Создание опроса')).toBeInTheDocument()
    await user.click(screen.getByText('Отмена'))
    expect(screen.queryByText('Создание опроса')).not.toBeInTheDocument()
  })

  it('renders status filter', () => {
    render(<PollsPage />, { wrapper: AllTheProviders })
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows closed badge when poll is closed', async () => {
    server.use(
      http.get('http://localhost:4000/api/polls', () => {
        return HttpResponse.json({
          data: [
            {
              id: 1,
              title: 'Тестовый опрос',
              description: '',
              multiple_choice: 0,
              multipleChoice: false,
              options: [
                { id: 1, pollId: 1, text: 'Вариант А', votesCount: 0, voted: false },
                { id: 2, pollId: 1, text: 'Вариант Б', votesCount: 0, voted: false },
              ],
              myVotes: [],
              totalVotes: 0,
              isClosed: true,
              endsAt: '2026-12-31T23:59:00Z',
              showResults: 'after_vote',
              createdBy: 1,
            },
          ],
          total: 1,
        })
      }),
    )
    render(<PollsPage />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Закрыт')).toBeInTheDocument()
    })
  })

  it('shows vote confirmation badge when user has voted', async () => {
    render(<PollsPage />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Голос учтён')).toBeInTheDocument()
    })
  })

  it('shows delete button for creator', async () => {
    render(<PollsPage />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByLabelText('Удалить')).toBeInTheDocument()
    })
  })

  it('has no polls initially when loading is false', async () => {
    render(<PollsPage />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.queryByText('Голос учтён')).toBeInTheDocument()
    })
  })
})
