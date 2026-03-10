import { api, type ApiProduct, type ApiCategory, type ProductFilters } from '@/services/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProductStore = defineStore('product', () => {
  const products = ref<ApiProduct[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const categories = ref<ApiCategory[]>([])

  const fetchProducts = async (filters: ProductFilters) => {
    loading.value = true
    error.value = null
    try {
      const data = await api.getProducts(filters)
      products.value = data.items
      total.value = data.total
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  const fetchCategories = async () => {
    if (categories.value.length > 0) return
    try {
      categories.value = await api.getCategories()
    } catch {
      // non-critical, silently fail
    }
  }

  return { products, total, loading, error, categories, fetchProducts, fetchCategories }
})
