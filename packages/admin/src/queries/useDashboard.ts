import { adminApi } from 'api'
import { defineQueryOptions } from '@pinia/colada'

export const dashboardStatsQuery = defineQueryOptions({
  key: ['admin', 'stats'],
  query: () => adminApi.getStats(),
  staleTime: 60_000,
})
