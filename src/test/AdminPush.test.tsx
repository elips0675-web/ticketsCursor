import { render, screen, waitFor } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import AdminPush from '@/pages/AdminPush'
import { api } from '@/lib/api'

describe('AdminPush', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(api, 'post').mockResolvedValue({})
  })

  it('renders push page', async () => {
    render(<AdminPush />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /admin\.push/i })).toBeTruthy()
    })
  })
})
