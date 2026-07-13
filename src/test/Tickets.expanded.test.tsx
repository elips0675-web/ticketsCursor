import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllTheProviders } from './test-utils'
import Tickets from '@/pages/Tickets'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'tickets.open': 'Открыт',
        'tickets.inProgress': 'В работе',
        'tickets.resolved': 'Решён',
        'tickets.closed': 'Закрыт',
        'tickets.low': 'Низкий',
        'tickets.medium': 'Средний',
        'tickets.high': 'Высокий',
        'tickets.critical': 'Критичный',
        'tickets.search': 'Поиск по тикетам...',
        'tickets.allStatuses': 'Все статусы',
        'tickets.allPriorities': 'Все приоритеты',
        'tickets.notFound': 'Тикеты не найдены',
        'tickets.tryAdjust': 'Попробуйте изменить параметры поиска',
        'tickets.showMore': 'Показать ещё',
        'tickets.new': 'Новый тикет',
        'tickets.exportCSV': 'CSV',
        'tickets.exportPDF': 'PDF',
        'tickets.total': 'Всего: {count}',
        'tickets.csvHeaderId': 'ID',
        'tickets.csvHeaderTitle': 'Название',
        'tickets.csvHeaderStatus': 'Статус',
        'tickets.csvHeaderPriority': 'Приоритет',
        'tickets.csvHeaderCategory': 'Категория',
        'tickets.csvHeaderAssignee': 'Исполнитель',
        'tickets.csvHeaderCreated': 'Создан',
        'tickets.exportLimitWarn': 'Экспорт ограничен {limit} записями',
        'tickets.title': 'Тикеты',
        'tickets.notifNewTicket': 'Новый тикет',
        'tickets.notifTicketUpdated': 'Тикет обновлён',
      })[key] || key,
  }),
}))

const mockTickets = [
  {
    id: 1,
    title: 'Network issue',
    description: 'Cannot connect to VPN',
    status: 'open',
    priority: 'critical',
    category: 'incident',
    tags: [],
    created_by: 1,
    created_by_name: 'User A',
    assigned_to: 2,
    assigned_name: 'Agent A',
    assigned_email: 'agent@test.com',
    assigned_avatar: '',
    messages: [{ id: 1, ticket_id: 1, text: 'msg', sender_id: 1, sender_name: 'User' }],
    messages_count: 1,
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    computer_name: 'PC-1',
    user_account: null,
  },
  {
    id: 2,
    title: 'Printer jam',
    description: 'Paper stuck in tray 2',
    status: 'in_progress',
    priority: 'high',
    category: 'support',
    tags: [],
    created_by: 2,
    created_by_name: 'User B',
    assigned_to: null,
    assigned_name: null,
    assigned_email: null,
    assigned_avatar: null,
    messages: [],
    messages_count: 0,
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    computer_name: null,
    user_account: null,
  },
  {
    id: 3,
    title: 'Software request',
    description: 'Need Adobe license',
    status: 'resolved',
    priority: 'medium',
    category: 'feature',
    tags: [],
    created_by: 1,
    created_by_name: 'User A',
    assigned_to: 3,
    assigned_name: 'Agent B',
    assigned_email: 'agentb@test.com',
    assigned_avatar: '',
    messages: [],
    messages_count: 0,
    updated_at: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
    computer_name: null,
    user_account: null,
  },
  {
    id: 4,
    title: 'Email not working',
    description: 'Outlook keeps crashing',
    status: 'open',
    priority: 'low',
    category: 'support',
    tags: [],
    created_by: 3,
    created_by_name: 'User C',
    assigned_to: null,
    assigned_name: null,
    assigned_email: null,
    assigned_avatar: null,
    messages: [],
    messages_count: 0,
    updated_at: new Date(Date.now() - 900000).toISOString(),
    created_at: new Date(Date.now() - 43200000).toISOString(),
    computer_name: null,
    user_account: 'user.c',
  },
  {
    id: 5,
    title: 'Login problem',
    description: 'Cannot log into ERP',
    status: 'closed',
    priority: 'high',
    category: 'bug',
    tags: [],
    created_by: 4,
    created_by_name: 'User D',
    assigned_to: 2,
    assigned_name: 'Agent A',
    assigned_email: 'agent@test.com',
    assigned_avatar: '',
    messages: [{ id: 2, ticket_id: 5, text: 'fixed', sender_id: 2, sender_name: 'Agent' }],
    messages_count: 1,
    updated_at: new Date(Date.now() - 600000).toISOString(),
    created_at: new Date(Date.now() - 604800000).toISOString(),
    computer_name: null,
    user_account: null,
  },
  {
    id: 6,
    title: 'Hardware request',
    description: 'Need new monitor',
    status: 'open',
    priority: 'medium',
    category: 'support',
    tags: [],
    created_by: 1,
    created_by_name: 'User A',
    assigned_to: null,
    assigned_name: null,
    assigned_email: null,
    assigned_avatar: null,
    messages: [],
    messages_count: 0,
    updated_at: new Date(Date.now() - 300000).toISOString(),
    created_at: new Date(Date.now() - 1209600000).toISOString(),
    computer_name: null,
    user_account: null,
  },
  {
    id: 7,
    title: 'Server down',
    description: 'Main server unreachable',
    status: 'in_progress',
    priority: 'critical',
    category: 'incident',
    tags: [],
    created_by: 2,
    created_by_name: 'User B',
    assigned_to: 1,
    assigned_name: 'Admin',
    assigned_email: 'admin@test.com',
    assigned_avatar: '',
    messages: [],
    messages_count: 0,
    updated_at: new Date(Date.now() - 120000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    computer_name: null,
    user_account: null,
  },
  {
    id: 8,
    title: 'Password reset',
    description: 'User forgot password',
    status: 'resolved',
    priority: 'low',
    category: 'support',
    tags: [],
    created_by: 3,
    created_by_name: 'User C',
    assigned_to: 3,
    assigned_name: 'Agent B',
    assigned_email: 'agentb@test.com',
    assigned_avatar: '',
    messages: [],
    messages_count: 0,
    updated_at: new Date(Date.now() - 60000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    computer_name: null,
    user_account: null,
  },
  {
    id: 9,
    title: 'New employee onboarding',
    description: 'Setup accounts and permissions',
    status: 'open',
    priority: 'medium',
    category: 'feature',
    tags: [],
    created_by: 4,
    created_by_name: 'User D',
    assigned_to: 1,
    assigned_name: 'Admin',
    assigned_email: 'admin@test.com',
    assigned_avatar: '',
    messages: [],
    messages_count: 0,
    updated_at: new Date(Date.now() - 10000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    computer_name: null,
    user_account: null,
  },
  {
    id: 10,
    title: 'Backup failure',
    description: 'Nightly backup failed',
    status: 'open',
    priority: 'high',
    category: 'incident',
    tags: [],
    created_by: 2,
    created_by_name: 'User B',
    assigned_to: null,
    assigned_name: null,
    assigned_email: null,
    assigned_avatar: null,
    messages: [],
    messages_count: 0,
    updated_at: new Date(Date.now() - 5000).toISOString(),
    created_at: new Date(Date.now() - 14400000).toISOString(),
    computer_name: null,
    user_account: null,
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
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
  })
})

afterEach(() => {
  delete (globalThis as { fetch?: unknown }).fetch
})

describe('Tickets page', () => {
  it('renders title', async () => {
    render(<Tickets />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Тикеты')).toBeInTheDocument()
    })
  })

  it('renders ticket cards with data', async () => {
    render(<Tickets />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Network issue')).toBeInTheDocument()
    })
    expect(screen.getByText('Backup failure')).toBeInTheDocument()
  })

  it('shows ticket count', async () => {
    render(<Tickets />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument()
    })
  })

  it('shows new ticket button', async () => {
    render(<Tickets />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Новый тикет')).toBeInTheDocument()
    })
  })

  it('shows export buttons', async () => {
    render(<Tickets />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('CSV')).toBeInTheDocument()
    })
    expect(screen.getByText('PDF')).toBeInTheDocument()
  })

  it('shows empty state when no tickets match filter', async () => {
    const user = userEvent.setup()
    render(<Tickets />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Network issue')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Поиск по тикетам...')
    await user.type(searchInput, 'ZZZZNONEXISTENT')
    await waitFor(() => {
      expect(screen.getByText('Тикеты не найдены')).toBeInTheDocument()
    })
  })

  it('shows "Показать ещё" when more tickets than PER_PAGE', async () => {
    render(<Tickets />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Показать ещё')).toBeInTheDocument()
    })
  })

  it('loads more tickets on "Показать ещё" click', async () => {
    const user = userEvent.setup()
    render(<Tickets />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Network issue')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Показать ещё'))
    await waitFor(() => {
      expect(screen.getByText('Backup failure')).toBeInTheDocument()
    })
  })
})
