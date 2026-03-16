import { api, type ApiCartItem } from 'api'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryCache } from '@pinia/colada'

export const useCartStore = defineStore('cart', () => {
  const queryCache = useQueryCache()
  const cartId = ref<string | null>(localStorage.getItem('cartId'))

  const cartQueryKey = computed(() => ['cart', cartId.value!] as const)

  const { data: cartData } = useQuery({
    key: cartQueryKey,
    query: () => api.getCart(cartId.value!),
    enabled: computed(() => !!cartId.value),
  })

  const cartItems = computed<ApiCartItem[]>(() => cartData.value?.cartItems ?? [])

  // Create cart mutation — used when no cartId exists
  const { mutateAsync: createCartMutate } = useMutation({
    mutation: () => api.createCart(),
    onSuccess: (cart) => {
      cartId.value = cart.id
      localStorage.setItem('cartId', cart.id)
    },
  })

  // Ensure cart exists before cart operations
  const ensureCart = async () => {
    if (!cartId.value) {
      await createCartMutate()
    }
  }

  const { mutateAsync: addToCartMutate } = useMutation({
    mutation: async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      await ensureCart()
      return api.addCartItem(cartId.value!, variantId, quantity)
    },
    onSuccess: () => {
      if (cartId.value) queryCache.invalidateQueries({ key: ['cart', cartId.value] })
    },
  })

  const { mutateAsync: updateQuantityMutate } = useMutation({
    mutation: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      api.updateCartItem(cartId.value!, variantId, quantity),
    onSuccess: () => {
      if (cartId.value) queryCache.invalidateQueries({ key: ['cart', cartId.value] })
    },
  })

  const { mutateAsync: removeFromCartMutate } = useMutation({
    mutation: (variantId: string) => api.removeCartItem(cartId.value!, variantId),
    onSuccess: () => {
      if (cartId.value) queryCache.invalidateQueries({ key: ['cart', cartId.value] })
    },
  })

  const addToCart = async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
    try {
      await addToCartMutate({ variantId, quantity })
    } catch {
      // error state available via mutation
    }
  }

  const updateQuantity = async ({
    variantId,
    quantity,
  }: {
    variantId: string
    quantity: number
  }) => {
    if (!cartId.value) return
    if (quantity < 1) {
      return removeFromCart(variantId)
    }
    try {
      await updateQuantityMutate({ variantId, quantity })
    } catch {
      // error state available via mutation
    }
  }

  const removeFromCart = async (variantId: string) => {
    if (!cartId.value) return
    try {
      await removeFromCartMutate(variantId)
    } catch {
      // error state available via mutation
    }
  }

  const clearCart = () => {
    if (cartId.value) {
      queryCache.setQueryData(['cart', cartId.value], (old) =>
        old ? { ...old, cartItems: [] } : old,
      )
    }
  }

  return {
    cartId,
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }
})
