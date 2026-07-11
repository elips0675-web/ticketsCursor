import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

const ThrowError = () => {
  throw new Error('Test error')
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>OK</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('OK')).toBeTruthy()
  })

  it('renders error UI on error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Что-то пошло не так')).toBeTruthy()
    expect(screen.getByText('Перезагрузить')).toBeTruthy()
  })

  it('displays error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Test error')).toBeTruthy()
  })
})
