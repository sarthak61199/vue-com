import { api } from '@/services/api'
import { defineMutation, defineQueryOptions, useMutation, useQueryCache } from '@pinia/colada'

export const ordersQuery = defineQueryOptions({
  key: ['orders'],
  query: () => api.getOrders(),
})

export const orderQuery = defineQueryOptions((id: string) => ({
  key: ['orders', id],
  query: () => api.getOrderById(id),
}))

export const useCreateOrder = defineMutation(() => {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (params: {
      cartId: string
      addressId?: string
      promoCode?: string
      shippingCost?: number
    }) => api.createOrder(params.cartId, params.addressId, params.promoCode, params.shippingCost),
    onSuccess: () => queryCache.invalidateQueries({
      key: [
        'orders',
      ]
    }),
  })
})
