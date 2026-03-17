import { adminApi } from 'api'
import { defineQueryOptions } from '@pinia/colada'

export const adminPromosQuery = defineQueryOptions({
  key: ['admin', 'promos'],
  query: () => adminApi.listPromos(),
})

export const adminPromoQuery = defineQueryOptions((id: string) => ({
  key: ['admin', 'promos', id],
  query: () => adminApi.getPromo(id),
}))

export const adminProductOptionsQuery = defineQueryOptions({
  key: ['admin', 'product-options'],
  query: () => adminApi.getProductOptions(),
  staleTime: 60_000,
})
