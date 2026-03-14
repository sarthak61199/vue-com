import { api, type ApiPromoValidation, type ApiDisplayPromo, type ApiProduct } from '@/services/api'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePromoStore = defineStore('promo', () => {
  const appliedPromo = ref<ApiPromoValidation | null>(null)
  const autoPromos = ref<ApiPromoValidation[]>([])
  const displayPromos = ref<ApiDisplayPromo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Manual code takes priority; otherwise best auto promo
  const activeDiscount = computed<ApiPromoValidation | null>(() => {
    if (appliedPromo.value) return appliedPromo.value
    if (autoPromos.value.length > 0) return autoPromos.value[0]!
    return null
  })

  async function validateCode(code: string, cartId: string) {
    loading.value = true
    error.value = null
    try {
      appliedPromo.value = await api.validatePromo(code, cartId)
    } catch (e) {
      error.value = (e as Error).message
      appliedPromo.value = null
    } finally {
      loading.value = false
    }
  }

  async function fetchAutoPromos(cartId: string) {
    try {
      autoPromos.value = await api.getAutoPromos(cartId)
    } catch {
      // silently ignore — auto promos are best-effort
    }
  }

  async function fetchDisplayPromos() {
    try {
      displayPromos.value = await api.getDisplayPromos()
    } catch {
      // silently ignore
    }
  }

  function getDiscountedPrice(price: number, promo: ApiDisplayPromo): number {
    if (promo.discountType === 'PERCENTAGE') return price * (1 - promo.discountValue / 100)
    if (promo.discountType === 'FIXED') return Math.max(0, price - promo.discountValue)
    return price
  }

  function getPromoForProduct(product: ApiProduct): ApiDisplayPromo | null {
    return (
      displayPromos.value.find(
        (p) =>
          (p.scope === 'PRODUCT' && p.productId === product.id) ||
          (p.scope === 'CATEGORY' && p.categoryId === product.categoryId),
      ) ?? null
    )
  }

  function clearPromo() {
    appliedPromo.value = null
    error.value = null
  }

  function reset() {
    appliedPromo.value = null
    autoPromos.value = []
    loading.value = false
    error.value = null
  }

  return {
    appliedPromo,
    autoPromos,
    displayPromos,
    loading,
    error,
    activeDiscount,
    validateCode,
    fetchAutoPromos,
    fetchDisplayPromos,
    getPromoForProduct,
    getDiscountedPrice,
    clearPromo,
    reset,
  }
})
