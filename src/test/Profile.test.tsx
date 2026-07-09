import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import Profile from '@/pages/Profile'

beforeEach(() => {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }))
})

describe('Profile page', () => {
  it('renders without crashing', () => {
    expect(() => render(<Profile />, { wrapper: AllTheProviders })).not.toThrow()
  })
})
