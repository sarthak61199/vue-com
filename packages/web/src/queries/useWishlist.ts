import { defineQueryOptions, defineMutation, useMutation, useQueryCache } from '@pinia/colada'
import { api } from 'api'

export const wishlistQuery = defineQueryOptions({
  key: ['wishlist'],
  query: () => api.getWishlist(),
})

export const useToggleWishlist = defineMutation(() => {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: async ({
      productId,
      isWishlisted,
    }: {
      productId: string
      isWishlisted: boolean
    }) => {
      if (isWishlisted) await api.removeFromWishlist(productId)
      else await api.addToWishlist(productId)
    },
    onSettled: () => queryCache.invalidateQueries({ key: wishlistQuery.key }),
  })
})
