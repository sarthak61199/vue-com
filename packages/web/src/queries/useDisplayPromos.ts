import { defineQueryOptions } from '@pinia/colada'
import { api } from '@/services/api'

export const displayPromosQuery = defineQueryOptions({
  key: ['promos', 'display'],
  query: () => api.getDisplayPromos(),
  staleTime: 60_000,
})
