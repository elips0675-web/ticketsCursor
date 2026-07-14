import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'

function fireBeforeInstallPrompt() {
  const mockPrompt = { prompt: vi.fn(), userChoice: Promise.resolve({ outcome: 'accepted' as const }) }
  const event = new Event('beforeinstallprompt')
  Object.assign(event, mockPrompt)
  window.dispatchEvent(event)
  return mockPrompt
}

describe('PwaInstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it('renders nothing initially', () => {
    const { container } = render(<PwaInstallPrompt />)
    expect(container.innerHTML).toBe('')
  })

  it('shows prompt after beforeinstallprompt event', async () => {
    render(<PwaInstallPrompt />)
    fireBeforeInstallPrompt()
    await waitFor(() => {
      expect(screen.getByText('Установите приложение')).toBeInTheDocument()
    })
  })

  it('renders install button', async () => {
    render(<PwaInstallPrompt />)
    fireBeforeInstallPrompt()
    await waitFor(() => {
      expect(screen.getByText('Установить')).toBeInTheDocument()
    })
  })

  it('renders dismiss button', async () => {
    render(<PwaInstallPrompt />)
    fireBeforeInstallPrompt()
    await waitFor(() => {
      expect(screen.getByLabelText('Закрыть')).toBeInTheDocument()
    })
  })

  it('hides after dismiss', async () => {
    const user = userEvent.setup()
    render(<PwaInstallPrompt />)
    fireBeforeInstallPrompt()
    await screen.findByText('Установить')
    await user.click(screen.getByLabelText('Закрыть'))
    await waitFor(() => {
      expect(screen.queryByText('Установить')).not.toBeInTheDocument()
    })
  })
})
