import { render, screen, waitFor } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import AdminUsers from '@/pages/AdminUsers'

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                id: 1,
                name: 'Alice Smith',
                email: 'alice@test.com',
                role: 'admin',
                department: 'IT',
                title: 'Admin',
                online: true,
                activeTickets: 3,
                resolvedToday: 5,
                isActive: true,
                createdAt: '2025-01-01',
              },
              {
                id: 2,
                name: 'Bob Jones',
                email: 'bob@test.com',
                role: 'agent',
                department: 'Support',
                title: 'Agent',
                online: false,
                activeTickets: 1,
                resolvedToday: 2,
                isActive: false,
                createdAt: '2025-06-01',
              },
            ],
          }),
      }),
    )
  })

  it('renders user list from API', async () => {
    render(<AdminUsers />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeTruthy()
    })
    expect(screen.getByText('Bob Jones')).toBeTruthy()
  })

  it('shows blocked badge for inactive users', async () => {
    render(<AdminUsers />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText(/admin\.blocked/i)).toBeTruthy()
    })
  })
})
