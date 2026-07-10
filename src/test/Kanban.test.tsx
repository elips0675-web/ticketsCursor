import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import Kanban from '@/pages/Kanban'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

beforeEach(() => {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }))
})

describe('Kanban', () => {
  it('renders kanban title', () => {
    render(<Kanban />, { wrapper: AllTheProviders })
    expect(screen.getByText('Канбан-доска')).toBeInTheDocument()
  })

  it('shows status columns', () => {
    render(<Kanban />, { wrapper: AllTheProviders })
    expect(screen.getByText('Открытые')).toBeInTheDocument()
    expect(screen.getByText('В работе')).toBeInTheDocument()
    expect(screen.getByText('Решённые')).toBeInTheDocument()
  })

  it('displays tickets in columns', async () => {
    render(<Kanban />, { wrapper: AllTheProviders })
    const ticket = await screen.findByText('Проблема с доступом')
    expect(ticket).toBeInTheDocument()
  })
})
