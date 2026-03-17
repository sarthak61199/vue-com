import { adminApi } from 'api'
import { defineQueryOptions } from '@pinia/colada'

export const adminReviewsQuery = defineQueryOptions(
  (filters: { page: number; minRating?: number; maxRating?: number }) => ({
    key: ['admin', 'reviews', filters],
    query: () => adminApi.listReviews(filters.page, filters.minRating, filters.maxRating),
  }),
)
