import { api, type ApiOrder } from '@/services/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOrderStore = defineStore('order', () => {
  const currentOrder = ref<ApiOrder | null>(null)
  const orders = ref<ApiOrder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const createOrder = async (cartId: string, addressId?: string, promoCode?: string) => {
    loading.value = true
    error.value = null
    try {
      currentOrder.value = await api.createOrder(cartId, addressId, promoCode)
      return currentOrder.value.id
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  const getOrderById = async (id: string) => {
    if (currentOrder.value?.id === id) return currentOrder.value
    loading.value = true
    error.value = null
    try {
      currentOrder.value = await api.getOrderById(id)
      return currentOrder.value
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  const getOrders = async () => {
    loading.value = true
    error.value = null
    try {
      orders.value = await api.getOrders()
      return orders.value
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { currentOrder, orders, loading, error, createOrder, getOrderById, getOrders }
})
