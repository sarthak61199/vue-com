import { api, type ApiPromoValidation } from '@/services/api'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@pinia/colada'

export const usePromoStore = defineStore('promo', () => {
  const appliedPromo = ref<ApiPromoValidation | null>(null)
  const error = ref<string | null>(null)

  // Auto promos — triggered by setting autoPromosCartId
  const autoPromosCartId = ref<string | null>(null)

  const { data: autoPromosData } = useQuery({
    key: computed(() => ['promos', 'auto', autoPromosCartId.value!] as const),
    query: () => api.getAutoPromos(autoPromosCartId.value!),
    enabled: computed(() => !!autoPromosCartId.value),
  })

  const autoPromos = computed<ApiPromoValidation[]>(() => autoPromosData.value ?? [])

  // Manual code takes priority; otherwise best auto promo
  const activeDiscount = computed<ApiPromoValidation | null>(() => {
    if (appliedPromo.value) return appliedPromo.value
    if (autoPromos.value.length > 0) return autoPromos.value[0]!
    return null
  })

  const { mutateAsync: validateMutate, isLoading: loading } = useMutation({
    mutation: ({ code, cartId }: { code: string; cartId: string }) =>
      api.validatePromo(code, cartId),
  })

  async function validateCode(code: string, cartId: string) {
    error.value = null
    try {
      appliedPromo.value = await validateMutate({ code, cartId })
    } catch (e) {
      error.value = (e as Error).message
      appliedPromo.value = null
    }
  }

  function fetchAutoPromos(cartId: string) {
    autoPromosCartId.value = cartId
  }

  function clearPromo() {
    appliedPromo.value = null
    error.value = null
  }

  function reset() {
    appliedPromo.value = null
    autoPromosCartId.value = null
    error.value = null
  }

  return {
    appliedPromo,
    autoPromos,
    loading,
    error,
    activeDiscount,
    validateCode,
    fetchAutoPromos,
    clearPromo,
    reset,
  }
})
