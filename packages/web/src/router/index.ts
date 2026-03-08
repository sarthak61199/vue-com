import CartPage from '@/pages/CartPage.vue'
import CheckoutPage from '@/pages/CheckoutPage.vue'
import HomePage from '@/pages/HomePage.vue'
import ProductPage from '@/pages/ProductPage.vue'
import SuccessPage from '@/pages/SuccessPage.vue'
import OrdersPage from '@/pages/OrdersPage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/product/:id',
      component: ProductPage,
    },
    {
      path: '/cart',
      component: CartPage,
    },
    {
      path: '/checkout',
      component: CheckoutPage,
    },
    {
      path: '/success',
      component: SuccessPage,
    },
    {
      path: '/orders',
      component: OrdersPage,
    },
  ],
})

export default router
