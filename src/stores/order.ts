import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { OrderItem } from '@/types'

export const useOrderStore = defineStore('order', () => {
    const order = ref<OrderItem[]>([])

    const createOrder = (orderItems: OrderItem[]) => {
        order.value = orderItems
    }

    return { order, createOrder }
})