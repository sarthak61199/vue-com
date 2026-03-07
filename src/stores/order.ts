import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Order, OrderItem } from '@/types'

export const useOrderStore = defineStore('order', () => {
    const order = ref<Order[]>([])

    const createOrder = (orderItems: OrderItem[]) => {
        order.value.push({
            id: order.value.length + 1,
            items: orderItems,
            total: orderItems.reduce((total, item) => total + item.quantity, 0),
        })

        const orderId = order.value[order.value.length - 1]?.id

        console.log(orderId)

        return orderId
    }

    const getOrderById = (id: number) => {
        return order.value.find((order) => order.id === id)
    }

    return { order, createOrder, getOrderById }
})