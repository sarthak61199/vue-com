import { api, type ApiCartItem } from '@/services/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const cartId = ref<string | null>(localStorage.getItem('cartId'))
  const cartItems = ref<ApiCartItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const initCart = async () => {
    loading.value = true
    error.value = null
    try {
      if (!cartId.value) {
        const cart = await api.createCart()
        cartId.value = cart.id
        localStorage.setItem('cartId', cart.id)
      } else {
        const cart = await api.getCart(cartId.value)
        cartItems.value = cart.cartItems
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  const addToCart = async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
    if (!cartId.value) return
    error.value = null
    try {
      const item = await api.addCartItem(cartId.value, variantId, quantity)
      const existing = cartItems.value.find((i) => i.variantId === variantId)
      if (existing) {
        existing.quantity = item.quantity
      } else {
        cartItems.value.push(item)
      }
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  const updateQuantity = async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
    if (!cartId.value) return
    if (quantity < 1) {
      return removeFromCart(variantId)
    }
    error.value = null
    try {
      const item = await api.updateCartItem(cartId.value, variantId, quantity)
      const existing = cartItems.value.find((i) => i.variantId === variantId)
      if (existing) existing.quantity = item.quantity
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  const removeFromCart = async (variantId: string) => {
    if (!cartId.value) return
    error.value = null
    try {
      await api.removeCartItem(cartId.value, variantId)
      cartItems.value = cartItems.value.filter((i) => i.variantId !== variantId)
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  // Called after order is placed — server already cleared items
  const clearCart = () => {
    cartItems.value = []
  }

  // Auto-init on store creation
  initCart()

  return { cartId, cartItems, loading, error, initCart, addToCart, updateQuantity, removeFromCart, clearCart }
})
