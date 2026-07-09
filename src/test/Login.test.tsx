import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import Login from '@/pages/Login'

beforeEach(() => {
  localStorage.clear()
})

describe('Login page', () => {
  it('renders login form', () => {
    render(<Login />, { wrapper: AllTheProviders })
    expect(screen.getByText(/service desk/i)).toBeTruthy()
  })

  it('renders email input', () => {
    render(<Login />, { wrapper: AllTheProviders })
    expect(screen.getByPlaceholderText(/ivan@company/i)).toBeTruthy()
  })
})
