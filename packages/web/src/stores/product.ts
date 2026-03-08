import { api, type ApiProduct } from '@/services/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProductStore = defineStore('product', () => {
  const products = ref<ApiProduct[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProducts = async (page: number) => {
    loading.value = true
    error.value = null
    try {
      const data = await api.getProducts(page)
      products.value = data.items
      total.value = data.total
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { products, total, loading, error, fetchProducts }
})
