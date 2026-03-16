import { defineQueryOptions } from '@pinia/colada'
import { api } from 'api'

export const recommendationsQuery = defineQueryOptions((productId: string) => ({
  key: ['products', productId, 'recommendations'],
  query: () => api.getRecommendations(productId),
  staleTime: 60_000,
}))
