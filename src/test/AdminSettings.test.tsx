import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllTheProviders } from './test-utils'
import AdminSettings from '@/pages/AdminSettings'

describe('AdminSettings', () => {
  it('renders settings page', async () => {
    render(<AdminSettings />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /admin\.settings/i })).toBeTruthy()
    })
  })

  it('renders feature flags section with toggles', async () => {
    render(<AdminSettings />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByTestId('feature-kanban_view')).toBeTruthy()
    })
    const toggle = screen.getByTestId('feature-kanban_view')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('toggles feature flag on click', async () => {
    render(<AdminSettings />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByTestId('feature-kanban_view')).toBeTruthy()
    })
    const toggle = screen.getByTestId('feature-kanban_view')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
})
