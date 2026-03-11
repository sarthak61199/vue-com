<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { useAddressStore } from '@/stores/address'
import { api } from '@/services/api'
import { formatPrice } from '@/utils/format'
import EmptyState from '@/components/EmptyState.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'
import AddressForm from '@/components/AddressForm.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()
const addressStore = useAddressStore()

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

// Addresses
const addressesFetched = ref(false)
const showAddressForm = ref(false)

const fetchIfNeeded = (t: string) => {
  if (t === 'orders' && !ordersFetched.value) {
    ordersFetched.value = true
    orderStore.getOrders()
  }
  if (t === 'addresses' && !addressesFetched.value) {
    addressesFetched.value = true
    addressStore.fetchAddresses()
  }
}

watch(tab, fetchIfNeeded, { immediate: true })

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
            <button
              class="tab-btn"
              :class="{ active: tab === 'addresses' }"
              @click="navigateTo('addresses')"
            >
              Addresses
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

          <!-- Addresses -->
          <template v-else-if="tab === 'addresses'">
            <div class="section-header section-header--row">
              <div>
                <p class="section-label">Delivery</p>
                <h1 class="section-title">My Addresses</h1>
              </div>
              <BaseButton
                v-if="!showAddressForm && !addressStore.loading"
                variant="dark"
                size="sm"
                @click="showAddressForm = true"
              >
                + Add New
              </BaseButton>
            </div>

            <div v-if="addressStore.loading" class="loading-msg">Loading addresses...</div>

            <template v-else>
              <EmptyState
                v-if="addressStore.items.length === 0 && !showAddressForm"
                heading="No saved addresses"
                message="Add an address to speed up checkout."
                link-to="/checkout"
                link-text="Go to checkout →"
              />

              <ul v-if="addressStore.items.length > 0" class="addresses-list">
                <li v-for="addr in addressStore.items" :key="addr.id" class="address-card">
                  <div class="address-card-body">
                    <div>
                      <p v-if="addr.label" class="address-card-label">{{ addr.label }}</p>
                      <p class="address-card-line">{{ addr.line1 }}<span v-if="addr.line2">, {{ addr.line2 }}</span></p>
                      <p class="address-card-line">{{ addr.city }}, {{ addr.state }} {{ addr.zip }}</p>
                      <p class="address-card-line address-card-country">{{ addr.country }}</p>
                    </div>
                    <BaseButton variant="ghost" size="sm" @click="addressStore.deleteAddress(addr.id)">
                      Remove
                    </BaseButton>
                  </div>
                </li>
              </ul>

              <div v-if="showAddressForm" class="address-form-wrap">
                <AddressForm
                  @saved="showAddressForm = false"
                  @cancel="showAddressForm = false"
                />
              </div>
            </template>
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
                    <p class="order-total">{{ formatPrice(order.total) }}</p>
                    <router-link :to="'/profile/orders/' + order.id" class="view-link">View →</router-link>
                  </div>
                </div>
                <ul class="order-items">
                  <li v-for="item in order.orderItems" :key="item.variantId" class="order-item">
                    <span class="order-item-name">{{ item.variant.product.name }}</span>
                    <span class="order-item-qty">× {{ item.quantity }}</span>
                    <span class="order-item-price">{{ formatPrice(item.price * item.quantity) }}</span>
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

.section-header--row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
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

/* Addresses */
.addresses-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.address-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}

.address-card-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  gap: 1rem;
}

.address-card-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-mint-dark);
  margin-bottom: 0.375rem;
}

.address-card-line {
  font-size: 0.9375rem;
  color: var(--color-charcoal);
  font-weight: 700;
  line-height: 1.5;
}

.address-card-country {
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--color-stone);
}

.address-form-wrap {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  padding: 1.75rem;
  max-width: 560px;
}
</style>
