import { defineQueryOptions, defineMutation, useMutation, useQueryCache } from '@pinia/colada'
import { api, type ApiAddress } from 'api'

export const addressesQuery = defineQueryOptions({
  key: ['addresses'],
  query: () => api.getAddresses(),
})

export const useCreateAddress = defineMutation(() => {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (data: Omit<ApiAddress, 'id' | 'userId' | 'createdAt'>) => api.createAddress(data),
    onSuccess: (newAddr) => {
      queryCache.setQueryData(addressesQuery.key, (old) =>
        old ? [newAddr, ...old] : [newAddr],
      )
    },
  })
})

export const useDeleteAddress = defineMutation(() => {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (id: string) => api.deleteAddress(id),
    onSuccess: (_r, id) => {
      queryCache.setQueryData(addressesQuery.key, (old) =>
        old?.filter((a) => a.id !== id) ?? [],
      )
    },
  })
})
