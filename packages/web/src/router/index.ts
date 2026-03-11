import CartPage from '@/pages/CartPage.vue'
import CheckoutPage from '@/pages/CheckoutPage.vue'
import HomePage from '@/pages/HomePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import ProductPage from '@/pages/ProductPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import SuccessPage from '@/pages/SuccessPage.vue'
import ProfilePage from '@/pages/ProfilePage.vue'
import OrderDetailPage from '@/pages/OrderDetailPage.vue'
import WishlistPage from '@/pages/WishlistPage.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
      meta: { requiresAuth: true },
    },
    {
      path: '/success',
      component: SuccessPage,
    },
    {
      path: '/profile',
      redirect: '/profile/info',
    },
    {
      path: '/profile/orders/:id',
      component: OrderDetailPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/:tab',
      component: ProfilePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/wishlist',
      component: WishlistPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      component: LoginPage,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      component: RegisterPage,
      meta: { guestOnly: true },
    },
    {
      path: '/:pathMatch(.*)*',
      component: NotFoundPage,
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.guestOnly || to.meta.requiresAuth) {
    const authStore = useAuthStore()
    await authStore.initPromise
    if (to.meta.guestOnly && authStore.user) return '/'
    if (to.meta.requiresAuth && !authStore.user)
      return { path: '/login', query: { redirectTo: to.fullPath } }
  }
})

export default router
