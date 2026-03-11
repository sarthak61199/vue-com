import { api, type ApiAddress } from '@/services/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAddressStore = defineStore('address', () => {
  const items = ref<ApiAddress[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchAddresses = async () => {
    if (loading.value || items.value.length > 0) return
    loading.value = true
    error.value = null
    try {
      items.value = await api.getAddresses()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  const createAddress = async (data: Omit<ApiAddress, 'id' | 'userId' | 'createdAt'>) => {
    error.value = null
    try {
      const address = await api.createAddress(data)
      items.value.unshift(address)
      return address
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  const deleteAddress = async (id: string) => {
    error.value = null
    try {
      await api.deleteAddress(id)
      const idx = items.value.findIndex((a) => a.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  return { items, loading, error, fetchAddresses, createAddress, deleteAddress }
})
