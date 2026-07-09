import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import Tickets from '@/pages/Tickets'

beforeEach(() => {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }))
})

describe('Tickets page', () => {
  it('renders without crashing', () => {
    render(<Tickets />, { wrapper: AllTheProviders })
    expect(screen.getByText(/заявки|тикеты/i)).toBeTruthy()
  })
})
