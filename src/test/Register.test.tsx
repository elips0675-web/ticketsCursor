import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import Register from '@/pages/Register'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'auth.registerTitle': 'Регистрация',
      'auth.registerSubtitle': 'Создайте учетную запись',
      'auth.nameFull': 'Имя',
      'auth.namePlaceholder': 'Иванов Иван',
      'auth.email': 'Email',
      'auth.password': 'Пароль',
      'auth.passwordMin': 'Минимум 6 символов',
      'auth.registerBtn': 'Зарегистрироваться',
      'auth.hasAccount': 'Уже есть аккаунт?',
      'auth.goToLogin': 'Войти',
      'auth.department': 'Отдел',
      'auth.departmentPlaceholder': 'Выберите отдел',
      'auth.titlePosition': 'Должность',
      'auth.titlePlaceholder': 'Ваша должность',
    })[key] || key,
  }),
}))

beforeEach(() => { localStorage.clear() })

describe('Register', () => {
  it('renders registration title', () => {
    render(<Register />, { wrapper: AllTheProviders })
    expect(screen.getByText('Регистрация')).toBeInTheDocument()
  })

  it('shows name input', () => {
    render(<Register />, { wrapper: AllTheProviders })
    expect(screen.getByText('Имя')).toBeInTheDocument()
  })

  it('shows email input', () => {
    render(<Register />, { wrapper: AllTheProviders })
    expect(screen.getByText(/Email/)).toBeInTheDocument()
  })

  it('shows password input', () => {
    render(<Register />, { wrapper: AllTheProviders })
    expect(screen.getByText('Пароль')).toBeInTheDocument()
  })

  it('has submit button', () => {
    render(<Register />, { wrapper: AllTheProviders })
    expect(screen.getByText('Зарегистрироваться')).toBeInTheDocument()
  })
})
