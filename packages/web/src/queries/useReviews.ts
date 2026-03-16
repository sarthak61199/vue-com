import { defineQueryOptions, defineMutation, useMutation, useQueryCache } from '@pinia/colada'
import { api } from 'api'
import { productQuery } from './useProduct'

export const productReviewsQuery = defineQueryOptions((productId: string) => ({
  key: ['reviews', productId],
  query: () => api.getProductReviews(productId),
}))

export const reviewEligibilityQuery = defineQueryOptions((productId: string) => ({
  key: ['reviews', productId, 'eligibility'],
  query: () => api.getReviewEligibility(productId),
}))

export const useSubmitReview = defineMutation(() => {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (params: { productId: string; rating: number; body?: string }) =>
      api.submitReview(params.productId, params.rating, params.body),
    onSuccess: (_r, { productId }) => {
      queryCache.invalidateQueries({ key: productReviewsQuery(productId).key })
      queryCache.invalidateQueries({ key: reviewEligibilityQuery(productId).key })
      queryCache.invalidateQueries({ key: productQuery(productId).key })
    },
  })
})
