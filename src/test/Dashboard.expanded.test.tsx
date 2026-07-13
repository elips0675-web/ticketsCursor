import { render, screen, waitFor } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import Dashboard from '@/pages/Dashboard'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'dashboard.title': 'Дашборд',
        'dashboard.subtitle': 'Общая статистика системы тикетов',
        'dashboard.total': 'Всего',
        'dashboard.totalTickets': 'Всего тикетов',
        'dashboard.open': 'Открытые',
        'dashboard.active': 'Активные',
        'dashboard.critical': 'Критические',
        'dashboard.criticalCount': 'Критических',
        'dashboard.resolved': 'Решённые',
        'dashboard.resolvedToday': 'Решённых',
        'dashboard.byStatus': 'По статусам',
        'dashboard.recentUpdates': 'Последние обновления',
        'dashboard.employees': 'Сотрудники',
        'dashboard.allEmployees': 'Все сотрудники',
        'employees.online': 'Онлайн',
        'employees.offline': 'Офлайн',
        'employees.activeTickets': '{count} тикетов',
        'tickets.open': 'Открыт',
        'tickets.inProgress': 'В работе',
        'tickets.resolved': 'Решён',
        'tickets.closed': 'Закрыт',
      })[key] || key,
  }),
}))

const mockTickets = [
  {
    id: 1,
    title: 'Ticket A',
    description: 'Desc A',
    status: 'open',
    priority: 'critical',
    category: 'bug',
    tags: [],
    created_by: 1,
    created_by_name: 'User',
    assigned_to: 1,
    assigned_name: 'Agent A',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    messages: [],
    messages_count: 0,
    computer_name: 'PC-1',
    user_account: null,
  },
  {
    id: 2,
    title: 'Ticket B',
    description: 'Desc B',
    status: 'in_progress',
    priority: 'high',
    category: 'support',
    tags: [],
    created_by: 2,
    created_by_name: 'User 2',
    assigned_to: null,
    assigned_name: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    messages: [],
    messages_count: 0,
    computer_name: null,
    user_account: null,
  },
  {
    id: 3,
    title: 'Ticket C',
    description: 'Desc C',
    status: 'resolved',
    priority: 'medium',
    category: 'feature',
    tags: [],
    created_by: 1,
    created_by_name: 'User',
    assigned_to: 2,
    assigned_name: 'Agent B',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    messages: [],
    messages_count: 0,
    computer_name: null,
    user_account: null,
  },
  {
    id: 4,
    title: 'Ticket D',
    description: 'Desc D',
    status: 'closed',
    priority: 'low',
    category: 'other',
    tags: [],
    created_by: 3,
    created_by_name: 'User 3',
    assigned_to: null,
    assigned_name: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    messages: [],
    messages_count: 0,
    computer_name: null,
    user_account: null,
  },
]

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
  },
]

beforeEach(() => {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }))
  vi.restoreAllMocks()
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/tickets')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockTickets }) })
    }
    if (url.includes('/employees')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockEmployees }) })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
  })
})

afterEach(() => {
  delete (globalThis as { fetch?: unknown }).fetch
})

describe('Dashboard', () => {
  it('renders title', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Дашборд')).toBeInTheDocument()
    })
  })

  it('shows stat cards', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Всего тикетов')).toBeInTheDocument()
    })
    expect(screen.getByText('Активные')).toBeInTheDocument()
    expect(screen.getByText('Критических')).toBeInTheDocument()
    expect(screen.getByText('Решённых')).toBeInTheDocument()
  })

  it('shows stat counts', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument()
    })
  })

  it('shows employee section heading', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Сотрудники')).toBeInTheDocument()
    })
  })

  it('shows employee cards', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })

  it('shows online/offline indicators for employees', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Онлайн')).toBeInTheDocument()
    })
    expect(screen.getByText('Офлайн')).toBeInTheDocument()
  })

  it('shows recent tickets', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Ticket A')).toBeInTheDocument()
    })
    expect(screen.getByText('Ticket B')).toBeInTheDocument()
  })

  it('shows all employees link', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Все сотрудники')).toBeInTheDocument()
    })
  })
})
