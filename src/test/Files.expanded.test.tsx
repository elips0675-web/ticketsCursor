import { render, screen, waitFor } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import Files from '@/pages/Files'
import { api } from '@/lib/api'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(api, 'get').mockResolvedValue([
    {
      name: 'Documents',
      files: [{ id: 1, name: 'report.pdf', path: '/uploads/report.pdf', size: 1024, created_at: '2026-07-10' }],
    },
  ])
})

describe('Files page extended', () => {
  it('renders files from API', async () => {
    render(<Files />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByText(/Documents/i)).toBeTruthy()
    })
  })
})
