import { render, screen, waitFor } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import AdminSettings from '@/pages/AdminSettings'

describe('AdminSettings', () => {
  it('renders settings page', async () => {
    render(<AdminSettings />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /admin\.settings/i })).toBeTruthy()
    })
  })
})
