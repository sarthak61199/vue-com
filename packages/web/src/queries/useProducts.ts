import { defineQueryOptions } from '@pinia/colada'
import { api, type ProductFilters } from 'api'

export const productsQuery = defineQueryOptions((filters: ProductFilters) => ({
  key: ['products', 'list', filters],
  query: () => api.getProducts(filters),
}))
