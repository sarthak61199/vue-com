import { MOCK_PRODUCTS } from '@/mock/product'
import type { Product } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>(MOCK_PRODUCTS)

  const getProductById = (id: number) => products.value.find((product) => product.id === id)

  return { products, getProductById }
})
