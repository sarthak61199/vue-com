import { defineQueryOptions } from '@pinia/colada'
import { api } from '@/services/api'

export const categoriesQuery = defineQueryOptions({
  key: ['categories'],
  query: () => api.getCategories(),
  staleTime: 5 * 60_000,
})
