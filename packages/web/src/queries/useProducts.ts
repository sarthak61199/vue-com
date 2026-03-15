import { defineQueryOptions } from '@pinia/colada'
import { api, type ProductFilters } from '@/services/api'

export const productsQuery = defineQueryOptions((filters: ProductFilters) => ({
  key: ['products', 'list', filters],
  query: () => api.getProducts(filters),
}))
