import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Order, OrderItem } from '@/types'
import { useProductStore } from './product'


export const useOrderStore = defineStore('order', () => {
    const productStore = useProductStore()

    const order = ref<Order[]>([])

    const createOrder = (orderItems: OrderItem[]) => {
        order.value.push({
            id: order.value.length + 1,
            items: orderItems,
            total: orderItems.reduce((total, item) => total + (productStore.getProductById(item.productId)?.price ?? 0) * item.quantity, 0),
        })

        return order.value[order.value.length - 1]?.id
    }

    const getOrderById = (id: number) => {
        return order.value.find((order) => order.id === id)
    }

    return { order, createOrder, getOrderById }
})