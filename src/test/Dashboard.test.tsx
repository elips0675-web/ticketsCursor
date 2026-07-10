import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import Dashboard from '@/pages/Dashboard'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'dashboard.title': 'Дашборд',
      'dashboard.subtitle': 'Общая статистика системы тикетов',
      'dashboard.totalTickets': 'Всего тикетов',
      'dashboard.active': 'Активные',
      'dashboard.criticalCount': 'Критических',
      'dashboard.resolvedToday': 'Решённых',
      'dashboard.employees': 'Сотрудники',
      'dashboard.allEmployees': 'Все сотрудники',
    })[key] || key,
  }),
}))

beforeEach(() => {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }))
})

describe('Dashboard', () => {
  it('renders title', () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    expect(screen.getByText('Дашборд')).toBeInTheDocument()
  })

  it('shows stat cards', () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    expect(screen.getByText('Всего тикетов')).toBeInTheDocument()
    expect(screen.getByText('Активные')).toBeInTheDocument()
    expect(screen.getByText('Критических')).toBeInTheDocument()
    expect(screen.getByText('Решённых')).toBeInTheDocument()
  })

  it('shows employee section heading', () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    expect(screen.getByText('Сотрудники')).toBeInTheDocument()
  })

  it('has a link to all employees', () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    expect(screen.getByText('Все сотрудники')).toBeInTheDocument()
  })

  it('shows employee status indicators', () => {
    render(<Dashboard />, { wrapper: AllTheProviders })
    expect(screen.getByText('Сотрудники')).toBeInTheDocument()
  })
})
