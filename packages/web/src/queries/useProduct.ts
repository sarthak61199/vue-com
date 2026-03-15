import { defineQueryOptions } from '@pinia/colada'
import { api } from '@/services/api'

export const productQuery = defineQueryOptions((id: string) => ({
  key: ['products', id],
  query: () => api.getProductById(id),
}))
