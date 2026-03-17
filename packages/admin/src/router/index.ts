import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginPage from '@/pages/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import OrderListPage from '@/pages/OrderListPage.vue'
import OrderDetailPage from '@/pages/OrderDetailPage.vue'
import UserListPage from '@/pages/UserListPage.vue'
import UserDetailPage from '@/pages/UserDetailPage.vue'
import ReviewListPage from '@/pages/ReviewListPage.vue'
import PromoListPage from '@/pages/PromoListPage.vue'
import PromoCreatePage from '@/pages/PromoCreatePage.vue'
import PromoEditPage from '@/pages/PromoEditPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { guestOnly: true },
    },
    {
      path: '/',
      component: DashboardPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/orders',
      component: OrderListPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/orders/:id',
      component: OrderDetailPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      component: UserListPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/users/:id',
      component: UserDetailPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/reviews',
      component: ReviewListPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/promos',
      component: PromoListPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/promos/new',
      component: PromoCreatePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/promos/:id',
      component: PromoEditPage,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.guestOnly || to.meta.requiresAuth) {
    const authStore = useAuthStore()
    await authStore.initPromise
    if (to.meta.guestOnly && authStore.user) return '/'
    if (to.meta.requiresAuth && !authStore.user) return '/login'
  }
})

export default router
