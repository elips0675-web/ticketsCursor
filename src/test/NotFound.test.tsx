import { render, screen } from '@testing-library/react'
import { AllTheProviders } from './test-utils'
import NotFound from '@/pages/NotFound'

describe('NotFound', () => {
  it('renders 404 message', () => {
    render(<NotFound />, { wrapper: AllTheProviders })
    expect(screen.getByText('404')).toBeTruthy()
    expect(screen.getByText('Страница не найдена')).toBeTruthy()
    expect(screen.getByText('Такой страницы не существует')).toBeTruthy()
  })

  it('renders go home button', () => {
    render(<NotFound />, { wrapper: AllTheProviders })
    expect(screen.getByText('На главную')).toBeTruthy()
  })
})
