import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderWithAuth(token: string | null, role?: string) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          token,
          user: token ? { id: 1, name: 'Test', email: 'test@test.com', role: role || 'agent', avatar: null } : null,
          login: vi.fn(),
          logout: vi.fn(),
          loading: false,
        }}
      >
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>LoginPage</div>} />
            <Route path="/" element={<div>HomePage</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>ProtectedContent</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects to login if no token', () => {
    renderWithAuth(null)
    expect(screen.getByText('LoginPage')).toBeTruthy()
    expect(screen.queryByText('ProtectedContent')).toBeNull()
  })

  it('renders children if token exists', () => {
    renderWithAuth('valid-token')
    expect(screen.getByText('ProtectedContent')).toBeTruthy()
  })
})

describe('ProtectedRoute adminOnly', () => {
  function renderAdminRoute(token: string | null, role?: string) {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            token,
            user: token ? { id: 1, name: 'Test', email: 'test@test.com', role: role || 'agent', avatar: null } : null,
            login: vi.fn(),
            logout: vi.fn(),
            loading: false,
          }}
        >
          <MemoryRouter initialEntries={['/admin']}>
            <Routes>
              <Route path="/login" element={<div>LoginPage</div>} />
              <Route path="/" element={<div>HomePage</div>} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <div>AdminContent</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    )
  }

  it('allows admin role', () => {
    renderAdminRoute('token', 'admin')
    expect(screen.getByText('AdminContent')).toBeTruthy()
  })

  it('allows super_admin role', () => {
    renderAdminRoute('token', 'super_admin')
    expect(screen.getByText('AdminContent')).toBeTruthy()
  })

  it('redirects agent to home', () => {
    renderAdminRoute('token', 'agent')
    expect(screen.getByText('HomePage')).toBeTruthy()
    expect(screen.queryByText('AdminContent')).toBeNull()
  })
})
