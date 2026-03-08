import { api, type ApiProduct } from '@/services/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProductStore = defineStore('product', () => {
  const products = ref<ApiProduct[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProducts = async () => {
    if (products.value.length > 0) return
    loading.value = true
    error.value = null
    try {
      products.value = await api.getProducts()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  const getProductById = (id: string) => products.value.find((p) => p.id === id)

  // Auto-fetch on store creation
  fetchProducts()

  return { products, loading, error, fetchProducts, getProductById }
})
