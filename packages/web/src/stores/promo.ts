import { api, type ApiPromoValidation } from '@/services/api'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePromoStore = defineStore('promo', () => {
  const appliedPromo = ref<ApiPromoValidation | null>(null)
  const autoPromos = ref<ApiPromoValidation[]>([])
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

  return { appliedPromo, autoPromos, loading, error, activeDiscount, validateCode, fetchAutoPromos, clearPromo, reset }
})
