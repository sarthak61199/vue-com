import { defineQueryOptions } from '@pinia/colada'
import { api } from 'api'

export const productQuery = defineQueryOptions((id: string) => ({
  key: ['products', id],
  query: () => api.getProductById(id),
}))
