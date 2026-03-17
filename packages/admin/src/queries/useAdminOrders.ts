import { adminApi } from 'api'
import { defineQueryOptions } from '@pinia/colada'

export const adminOrdersQuery = defineQueryOptions(
  (filters: { page: number; search?: string }) => ({
    key: ['admin', 'orders', filters],
    query: () => adminApi.listOrders(filters.page, filters.search),
  }),
)

export const adminOrderQuery = defineQueryOptions((id: string) => ({
  key: ['admin', 'orders', id],
  query: () => adminApi.getOrder(id),
}))
