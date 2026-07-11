import { render, screen } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import ForgotPassword from '@/pages/ForgotPassword'

describe('ForgotPassword', () => {
  it('renders forgot password form', () => {
    render(<ForgotPassword />, { wrapper: AllTheProviders })
    expect(screen.getByText(/Forgot password/i)).toBeTruthy()
  })
})
