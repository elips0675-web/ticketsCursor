import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import ResetPassword from '@/pages/ResetPassword'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

beforeEach(() => { localStorage.clear() })

describe('ResetPassword', () => {
  it('shows invalid link message when no token', () => {
    render(<ResetPassword />, { wrapper: AllTheProviders })
    expect(screen.getByText('Invalid link')).toBeInTheDocument()
  })

  it('shows link expired message', () => {
    render(<ResetPassword />, { wrapper: AllTheProviders })
    expect(screen.getByText('This reset link is invalid or expired.')).toBeInTheDocument()
  })
})
