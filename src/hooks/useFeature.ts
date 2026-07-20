import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface FeatureFlag {
  key: string
  enabled: boolean
  description: string
}

function useFeatureFlags() {
  return useQuery<FeatureFlag[]>({
    queryKey: ['feature-flags'],
    queryFn: () => api.get('/admin/features'),
    staleTime: 30_000,
  })
}

export function useFeature(key: string): boolean {
  const { data } = useFeatureFlags()
  if (!data) return true
  const flag = data.find(f => f.key === key)
  return flag ? flag.enabled : true
}

export function useAllFeatures() {
  return useFeatureFlags()
}
