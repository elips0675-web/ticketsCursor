import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import Admin from '@/pages/Admin'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

beforeEach(() => {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }))
})

describe('Admin Dashboard', () => {
  it('renders admin title', () => {
    render(<Admin />, { wrapper: AllTheProviders })
    expect(screen.getByText('admin.dashboard')).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    expect(() => render(<Admin />, { wrapper: AllTheProviders })).not.toThrow()
  })
})
