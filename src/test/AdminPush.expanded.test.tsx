import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllTheProviders } from './test-utils'
import AdminPush from '@/pages/AdminPush'
import { api } from '@/lib/api'

const mockUsePush = vi.fn()
vi.mock('@/lib/use-push', () => ({
  usePush: (...args: unknown[]) => mockUsePush(...args),
}))

function setupPush(overrides: Record<string, unknown> = {}) {
  mockUsePush.mockReturnValue({
    subscribed: false,
    supported: true,
    loading: false,
    error: null,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    ...overrides,
  })
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'admin.push': 'Push уведомления',
        'admin.pushSubtitle': 'Управление пушами',
        'admin.pushSend': 'Отправить уведомление',
        'admin.pushOn': 'Подписка активна',
        'admin.pushOff': 'Подписка не активна',
        'admin.subscribe': 'Подписаться',
        'admin.unsubscribe': 'Отписаться',
        'admin.pushNotSupported': 'Не поддерживается',
        'admin.pushTitle': 'Заголовок',
        'admin.pushTitlePlaceholder': 'Введите заголовок',
        'admin.pushBody': 'Текст',
        'admin.pushBodyPlaceholder': 'Введите текст',
        'admin.pushUrl': 'URL',
        'admin.pushSubmitBtn': 'Отправить',
        'admin.pushSending': 'Отправка...',
        'admin.pushResult': 'Отправлено: {sent}, ошибок: {failed}',
      })[key] || key,
  }),
}))

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(api, 'post').mockResolvedValue({ sent: 1, failed: 0, total: 1 } as never)
})

describe('AdminPush', () => {
  it('renders push page', async () => {
    setupPush()
    render(<AdminPush />, { wrapper: AllTheProviders })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /push/i })).toBeInTheDocument()
    })
  })

  it('shows subscribe button when not subscribed', () => {
    setupPush({ subscribed: false })
    render(<AdminPush />, { wrapper: AllTheProviders })
    expect(screen.getByText('Подписаться')).toBeInTheDocument()
  })

  it('shows unsubscribe button when subscribed', () => {
    setupPush({ subscribed: true })
    render(<AdminPush />, { wrapper: AllTheProviders })
    expect(screen.getByText('Отписаться')).toBeInTheDocument()
  })

  it('shows not supported message when push not supported', () => {
    setupPush({ supported: false })
    render(<AdminPush />, { wrapper: AllTheProviders })
    expect(screen.getByText('Не поддерживается')).toBeInTheDocument()
  })

  it('calls subscribe on button click', async () => {
    const subscribe = vi.fn()
    setupPush({ subscribed: false, subscribe })
    const user = userEvent.setup()
    render(<AdminPush />, { wrapper: AllTheProviders })
    await user.click(screen.getByText('Подписаться'))
    expect(subscribe).toHaveBeenCalledTimes(1)
  })

  it('calls unsubscribe on button click', async () => {
    const unsubscribe = vi.fn()
    setupPush({ subscribed: true, unsubscribe })
    const user = userEvent.setup()
    render(<AdminPush />, { wrapper: AllTheProviders })
    await user.click(screen.getByText('Отписаться'))
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('shows error message when error exists', () => {
    setupPush({ error: 'Push failed' })
    render(<AdminPush />, { wrapper: AllTheProviders })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('disables subscribe button while loading', () => {
    setupPush({ loading: true })
    render(<AdminPush />, { wrapper: AllTheProviders })
    expect(screen.getByText('Подписаться')).toBeDisabled()
  })

  it('sends push notification on form submit', async () => {
    setupPush()
    const user = userEvent.setup()
    render(<AdminPush />, { wrapper: AllTheProviders })
    await user.type(screen.getByPlaceholderText('Введите заголовок'), 'Test Title')
    await user.type(screen.getByPlaceholderText('Введите текст'), 'Test Body')
    await user.click(screen.getByText('Отправить'))
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/push/send', {
        title: 'Test Title',
        body: 'Test Body',
        url: '/',
      })
    })
  })

  it('shows send result after successful send', async () => {
    setupPush()
    const user = userEvent.setup()
    render(<AdminPush />, { wrapper: AllTheProviders })
    await user.type(screen.getByPlaceholderText('Введите заголовок'), 'Test')
    await user.click(screen.getByText('Отправить'))
    await waitFor(() => {
      expect(screen.getByText(/Отправлено/)).toBeInTheDocument()
    })
  })

  it('disables send button when title is empty', () => {
    setupPush()
    render(<AdminPush />, { wrapper: AllTheProviders })
    expect(screen.getByText('Отправить')).toBeDisabled()
  })

  it('shows sending state while sending', async () => {
    setupPush()
    vi.spyOn(api, 'post').mockReturnValue(new Promise(() => {}) as never)
    const user = userEvent.setup()
    render(<AdminPush />, { wrapper: AllTheProviders })
    await user.type(screen.getByPlaceholderText('Введите заголовок'), 'Test')
    await user.click(screen.getByText('Отправить'))
    expect(screen.getByText('Отправка...')).toBeInTheDocument()
  })

  it('renders input fields', () => {
    setupPush()
    render(<AdminPush />, { wrapper: AllTheProviders })
    expect(screen.getByPlaceholderText('Введите заголовок')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Введите текст')).toBeInTheDocument()
  })
})
