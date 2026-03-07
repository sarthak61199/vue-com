import type { CartItem } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const cartItems = ref<CartItem[]>([])

  const addToCart = ({ productId, quantity }: { productId: number; quantity: number }) => {
    const existingItem = cartItems.value.find((item) => item.productId === productId)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cartItems.value.push({ productId, quantity })
    }
  }

  const updateQuantity = ({ productId, quantity }: { productId: number; quantity: number }) => {
    const existingItem = cartItems.value.find((item) => item.productId === productId)
    if (existingItem) {
      existingItem.quantity = quantity
    }
  }

  const removeFromCart = (productId: number) => {
    cartItems.value = cartItems.value.filter((item) => item.productId !== productId)
  }

  const clearCart = () => {
    cartItems.value = []
  }

  return { cartItems, addToCart, updateQuantity, removeFromCart, clearCart }
})
