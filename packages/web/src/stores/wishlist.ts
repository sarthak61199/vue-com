import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, type ApiWishlistItem } from '@/services/api'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref<ApiWishlistItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const wishlistedIds = computed(() => new Set(items.value.map((i) => i.productId)))

  async function fetchWishlist() {
    loading.value = true
    error.value = null
    try {
      items.value = await api.getWishlist()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function addToWishlist(productId: string) {
    try {
      const item = await api.addToWishlist(productId)
      if (!wishlistedIds.value.has(productId)) {
        items.value.unshift(item)
      }
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  async function removeFromWishlist(productId: string) {
    try {
      await api.removeFromWishlist(productId)
      items.value = items.value.filter((i) => i.productId !== productId)
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  async function toggleWishlist(productId: string) {
    if (wishlistedIds.value.has(productId)) {
      await removeFromWishlist(productId)
    } else {
      await addToWishlist(productId)
    }
  }

  return { items, loading, error, wishlistedIds, fetchWishlist, addToWishlist, removeFromWishlist, toggleWishlist }
})
