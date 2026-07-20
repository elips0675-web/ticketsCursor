import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useFeature, useAllFeatures } from '@/hooks/useFeature'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useFeature', () => {
  it('returns true for unknown feature', () => {
    const { result } = renderHook(() => useFeature('unknown_key'), { wrapper: Wrapper })
    expect(result.current).toBe(true)
  })

  it('returns enabled state for known feature', async () => {
    const { result } = renderHook(() => useFeature('new_ticket_form'), { wrapper: Wrapper })
    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('returns disabled state', async () => {
    const { result } = renderHook(() => useFeature('kanban_view'), { wrapper: Wrapper })
    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })
})

describe('useAllFeatures', () => {
  it('returns array of features', async () => {
    const { result } = renderHook(() => useAllFeatures(), { wrapper: Wrapper })
    await waitFor(() => {
      expect(result.current.data).toBeDefined()
      expect(Array.isArray(result.current.data)).toBe(true)
      expect(result.current.data.length).toBeGreaterThan(0)
    })
  })
})
