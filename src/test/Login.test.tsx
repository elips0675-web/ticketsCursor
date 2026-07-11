import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import Login from '@/pages/Login'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'auth.title': 'Service Desk',
        'auth.emailPlaceholder': 'ivan@company.ru',
        'auth.passwordPlaceholder': 'Пароль',
        'auth.login': 'Войти',
        'auth.loginError': 'Ошибка входа',
        'auth.forgotPassword': 'Забыли пароль?',
        'auth.register': 'Регистрация',
      })[key] || key,
  }),
}))

beforeEach(() => {
  localStorage.clear()
})

describe('Login page', () => {
  it('renders login form', () => {
    render(<Login />, { wrapper: AllTheProviders })
    expect(screen.getByText('Service Desk')).toBeInTheDocument()
  })

  it('renders email input', () => {
    render(<Login />, { wrapper: AllTheProviders })
    expect(screen.getByPlaceholderText('ivan@company.ru')).toBeInTheDocument()
  })

  it('renders password input', () => {
    render(<Login />, { wrapper: AllTheProviders })
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument()
  })

  it('renders login button', () => {
    render(<Login />, { wrapper: AllTheProviders })
    expect(screen.getByText('Войти')).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    render(<Login />, { wrapper: AllTheProviders })
    expect(screen.getByText('Забыли пароль?')).toBeInTheDocument()
  })

  it('renders register link', () => {
    render(<Login />, { wrapper: AllTheProviders })
    expect(screen.getByText('Регистрация')).toBeInTheDocument()
  })

  it('has email input with autocomplete attribute', () => {
    render(<Login />, { wrapper: AllTheProviders })
    const emailInput = screen.getByPlaceholderText('ivan@company.ru')
    expect(emailInput).toHaveAttribute('autocomplete', 'email')
  })

  it('has password input with autocomplete attribute', () => {
    render(<Login />, { wrapper: AllTheProviders })
    const passInput = screen.getByPlaceholderText('Пароль')
    expect(passInput).toHaveAttribute('autocomplete', 'current-password')
  })
})
