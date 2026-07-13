import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllTheProviders } from './test-utils'
import Employees from '@/pages/Employees'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'employees.title': 'Сотрудники',
        'employees.searchPlaceholder': 'Поиск по имени, отделу, email...',
        'common.all': 'Все',
        'employees.agents': 'Агенты',
        'employees.seniorAgents': 'Ст. агенты',
        'employees.admins': 'Администраторы',
        'employees.agent': 'Агент',
        'employees.seniorAgent': 'Ст. агент',
        'employees.admin': 'Администратор',
        'employees.online': 'Онлайн',
        'employees.offline': 'Офлайн',
        'employees.activeTickets': 'активных тикетов',
        'employees.resolvedToday': 'Решено сегодня',
        'employees.noData': 'Нет данных',
        'employees.cardsView': 'Карточки',
        'employees.tableView': 'Таблица',
        'employees.sortName': 'По имени',
        'employees.sortTickets': 'По тикетам',
        'employees.sortResolved': 'По решённым',
        'employees.exportCSV': 'CSV',
        'employees.write': 'Написать',
      })[key] || key,
  }),
}))

const mockEmployees = [
  {
    id: 1,
    name: 'Alice Smith',
    email: 'alice@test.com',
    role: 'admin',
    department: 'IT',
    online: true,
    activeTickets: 3,
    resolvedToday: 5,
    avatar: '',
    phone: '+1-555-0101',
  },
  {
    id: 2,
    name: 'Bob Johnson',
    email: 'bob@test.com',
    role: 'agent',
    department: 'Support',
    online: false,
    activeTickets: 7,
    resolvedToday: 2,
    avatar: '',
    phone: '',
  },
  {
    id: 3,
    name: 'Charlie Brown',
    email: 'charlie@test.com',
    role: 'senior_agent',
    department: 'IT',
    online: true,
    activeTickets: 1,
    resolvedToday: 8,
    avatar: '',
  },
  {
    id: 4,
    name: 'Diana Prince',
    email: 'diana@test.com',
    role: 'agent',
    department: 'HR',
    online: false,
    activeTickets: 0,
    resolvedToday: 0,
    avatar: '',
  },
  {
    id: 5,
    name: 'Eve Adams',
    email: 'eve@test.com',
    role: 'admin',
    department: 'IT',
    online: true,
    activeTickets: 2,
    resolvedToday: 3,
    avatar: '',
  },
]

beforeEach(() => {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }))
  vi.restoreAllMocks()
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/employees')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockEmployees }) })
    }
    if (url.includes('/tickets')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
  })
})

afterEach(() => {
  delete (globalThis as { fetch?: unknown }).fetch
})

describe('Employees Page', () => {
  it('renders title', async () => {
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Сотрудники')).toBeInTheDocument()
    })
  })

  it('shows total employee count', async () => {
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText(/5 человек/i)).toBeInTheDocument()
    })
  })

  it('shows search input', async () => {
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Поиск по имени, отделу, email...')).toBeInTheDocument()
    })
  })

  it('shows role filter buttons', async () => {
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Все')).toBeInTheDocument()
    })
    expect(screen.getByText('Агенты')).toBeInTheDocument()
    expect(screen.getByText('Ст. агенты')).toBeInTheDocument()
    expect(screen.getByText('Администраторы')).toBeInTheDocument()
  })

  it('shows view toggle buttons', async () => {
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      const cardsBtn = screen.getByLabelText('Карточки')
      expect(cardsBtn).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Таблица')).toBeInTheDocument()
  })

  it('renders employee cards by default', async () => {
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
  })

  it('group employees by department', async () => {
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getAllByText('IT').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('switches to table view', async () => {
    const user = userEvent.setup()
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
    const tabs = screen.getAllByRole('tab')
    await user.click(tabs[1])
    await waitFor(() => {
      expect(screen.getByText(/По имени/)).toBeInTheDocument()
    })
  })

  it('filters by role (admin)', async () => {
    const user = userEvent.setup()
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Администраторы'))
    await waitFor(() => {
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Eve Adams')).toBeInTheDocument()
  })

  it('searches employees by name', async () => {
    const user = userEvent.setup()
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Поиск по имени, отделу, email...')
    await user.type(searchInput, 'Bob')
    await waitFor(() => {
      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })

  it('shows empty state when no employees match', async () => {
    const user = userEvent.setup()
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Поиск по имени, отделу, email...')
    await user.type(searchInput, 'ZZZZNONEXISTENT')
    await waitFor(() => {
      expect(screen.getByText('Нет данных')).toBeInTheDocument()
    })
  })

  it('shows role counts in statistics', async () => {
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText(/Админы:/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Ст. агенты:/)).toBeInTheDocument()
    expect(screen.getByText(/Агенты:/)).toBeInTheDocument()
  })

  it('shows CSV export button', async () => {
    render(<Employees />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('CSV')).toBeInTheDocument()
    })
  })
})
