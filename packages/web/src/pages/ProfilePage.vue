<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { api } from '@/services/api'
import EmptyState from '@/components/EmptyState.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const tab = computed(() => route.params.tab as string)

const navigateTo = (t: string) => router.push('/profile/' + t)

// Change password form
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pwLoading = ref(false)
const pwSuccess = ref('')
const pwError = ref('')

const submitPasswordChange = async () => {
  pwSuccess.value = ''
  pwError.value = ''
  if (newPassword.value !== confirmPassword.value) {
    pwError.value = 'New passwords do not match.'
    return
  }
  if (newPassword.value.length < 6) {
    pwError.value = 'New password must be at least 6 characters.'
    return
  }
  pwLoading.value = true
  try {
    await api.changePassword(currentPassword.value, newPassword.value)
    pwSuccess.value = 'Password updated successfully.'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e) {
    pwError.value = (e as Error).message
  } finally {
    pwLoading.value = false
  }
}

// Orders
const ordersFetched = ref(false)

const fetchIfOrders = (t: string) => {
  if (t === 'orders' && !ordersFetched.value) {
    ordersFetched.value = true
    orderStore.getOrders()
  }
}

watch(tab, fetchIfOrders, { immediate: true })

const memberSince = computed(() => {
  if (!authStore.user?.createdAt) return ''
  return new Date(authStore.user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <main class="page">
    <div class="page-inner">
      <div class="profile-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <p class="sidebar-label">Account</p>
          <nav class="sidebar-nav">
            <button
              class="tab-btn"
              :class="{ active: tab === 'info' }"
              @click="navigateTo('info')"
            >
              My Info
            </button>
            <button
              class="tab-btn"
              :class="{ active: tab === 'password' }"
              @click="navigateTo('password')"
            >
              Change Password
            </button>
            <button
              class="tab-btn"
              :class="{ active: tab === 'orders' }"
              @click="navigateTo('orders')"
            >
              Orders
            </button>
          </nav>
        </aside>

        <!-- Content -->
        <section class="content">
          <!-- My Info -->
          <template v-if="tab === 'info'">
            <div class="section-header">
              <p class="section-label">Account</p>
              <h1 class="section-title">My Info</h1>
            </div>
            <div class="info-card">
              <div class="info-field">
                <span class="info-field-label">Email</span>
                <span class="info-field-value">{{ authStore.user?.email }}</span>
              </div>
              <div class="info-field">
                <span class="info-field-label">Member Since</span>
                <span class="info-field-value">{{ memberSince }}</span>
              </div>
            </div>
          </template>

          <!-- Change Password -->
          <template v-else-if="tab === 'password'">
            <div class="section-header">
              <p class="section-label">Security</p>
              <h1 class="section-title">Change Password</h1>
            </div>
            <form class="pw-form" @submit.prevent="submitPasswordChange">
              <div class="form-group">
                <label class="form-label" for="currentPassword">Current Password</label>
                <BaseInput
                  id="currentPassword"
                  v-model="currentPassword"
                  type="password"
                  autocomplete="current-password"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label" for="newPassword">New Password</label>
                <BaseInput
                  id="newPassword"
                  v-model="newPassword"
                  type="password"
                  autocomplete="new-password"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label" for="confirmPassword">Confirm New Password</label>
                <BaseInput
                  id="confirmPassword"
                  v-model="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  required
                />
              </div>
              <p v-if="pwError" class="form-msg error-msg">{{ pwError }}</p>
              <p v-if="pwSuccess" class="form-msg success-msg">{{ pwSuccess }}</p>
              <BaseButton type="submit" variant="dark" :loading="pwLoading">
                {{ pwLoading ? 'Updating…' : 'Update Password' }}
              </BaseButton>
            </form>
          </template>

          <!-- Orders -->
          <template v-else-if="tab === 'orders'">
            <div class="section-header">
              <p class="section-label">Purchase History</p>
              <h1 class="section-title">My Orders</h1>
            </div>
            <div v-if="orderStore.loading" class="loading-msg">Loading orders...</div>
            <EmptyState
              v-else-if="orderStore.orders.length === 0"
              heading="No orders yet"
              message="Your completed orders will appear here."
              link-to="/"
              link-text="Start shopping →"
            />
            <ul v-else class="orders-list">
              <li v-for="order in orderStore.orders" :key="order.id" class="order-card">
                <div class="order-card-header">
                  <div>
                    <p class="order-id">Order #{{ order.id.slice(0, 8).toUpperCase() }}</p>
                    <p class="order-date">
                      {{
                        new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      }}
                    </p>
                  </div>
                  <div class="order-card-right">
                    <p class="order-total">${{ order.total.toFixed(2) }}</p>
                    <router-link :to="'/profile/orders/' + order.id" class="view-link">View →</router-link>
                  </div>
                </div>
                <ul class="order-items">
                  <li v-for="item in order.orderItems" :key="item.productId" class="order-item">
                    <span class="order-item-name">{{ item.product.name }}</span>
                    <span class="order-item-qty">× {{ item.quantity }}</span>
                    <span class="order-item-price">${{ (item.product.price * item.quantity).toFixed(2) }}</span>
                  </li>
                </ul>
              </li>
            </ul>
          </template>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.page {
  flex: 1;
}

.page-inner {
  max-width: 1100px;
  margin-inline: auto;
  padding-inline: 1.5rem;
  padding-block: 3rem 5rem;
}

.profile-layout {
  display: flex;
  gap: 3rem;
  align-items: flex-start;
}

/* Sidebar */
.sidebar {
  flex-shrink: 0;
  width: 200px;
  position: sticky;
  top: 80px;
}

.sidebar-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-stone);
  margin-bottom: 0.75rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tab-btn {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0.625rem 0.75rem;
  font-family: 'Titillium Web', sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-stone);
  cursor: pointer;
  border-radius: 8px;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.tab-btn:hover {
  color: var(--color-charcoal);
  background: var(--color-mint-50);
}

.tab-btn.active {
  color: var(--color-charcoal);
  background: var(--color-mint-100);
}

/* Content */
.content {
  flex: 1;
  min-width: 0;
}

.section-header {
  margin-bottom: 2rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-mint-dark);
  margin-bottom: 0.5rem;
}

.section-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.04em;
  line-height: 1;
}

/* Info card */
.info-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.info-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid var(--color-border);
}

.info-field:last-child {
  border-bottom: none;
}

.info-field-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-stone);
}

.info-field-value {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

/* Password form */
.pw-form {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 440px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-stone);
}

.form-msg {
  font-size: 0.875rem;
  font-weight: 700;
}

.error-msg {
  color: #d94f4f;
}

.success-msg {
  color: var(--color-mint-dark);
}

/* Orders */
.loading-msg {
  padding: 5rem 0;
  text-align: center;
  font-size: 1rem;
  color: var(--color-stone);
}

.orders-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.75rem;
  box-shadow: var(--shadow-card);
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.order-id {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-stone);
  margin-bottom: 0.25rem;
}

.order-date {
  font-size: 0.875rem;
  color: var(--color-stone);
}

.order-card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.order-total {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.02em;
}

.view-link {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-mint-dark);
  transition: letter-spacing 0.2s ease;
}

.view-link:hover {
  letter-spacing: 0.14em;
}

.order-items {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.order-item-name {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.order-item-qty {
  font-size: 0.875rem;
  color: var(--color-stone);
}

.order-item-price {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
}
</style>
