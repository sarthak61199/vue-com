import { adminApi } from 'api'
import { defineQueryOptions } from '@pinia/colada'

export const adminUsersQuery = defineQueryOptions(
  (filters: { page: number; search?: string }) => ({
    key: ['admin', 'users', filters],
    query: () => adminApi.listUsers(filters.page, filters.search),
  }),
)

export const adminUserQuery = defineQueryOptions((id: string) => ({
  key: ['admin', 'users', id],
  query: () => adminApi.getUser(id),
}))
