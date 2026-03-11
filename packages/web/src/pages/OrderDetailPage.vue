<script lang="ts" setup>
import { useOrderStore } from '@/stores/order'
import { useRoute } from 'vue-router'
import { onMounted } from 'vue'
import { IMAGE } from '@/constants'
import { formatPrice, getVariantLabel } from '@/utils/format'

const route = useRoute()
const orderStore = useOrderStore()

onMounted(async () => {
  await orderStore.getOrderById(route.params.id as string)
})
</script>

<template>
  <main class="page">
    <div class="page-inner">
      <router-link to="/profile/orders" class="back-link">← My Orders</router-link>

      <div v-if="orderStore.loading" class="status-msg">Loading order...</div>
      <div v-else-if="orderStore.error" class="status-msg error-msg">{{ orderStore.error }}</div>

      <template v-else-if="orderStore.currentOrder">
        <div class="page-header">
          <p class="page-label">Order Details</p>
          <h1 class="page-title">Order #{{ orderStore.currentOrder.id.slice(0, 8).toUpperCase() }}</h1>
          <p class="page-date">
            Placed on {{ new Date(orderStore.currentOrder.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
          </p>
        </div>

        <div class="order-card">
          <ul class="items-list">
            <li v-for="item in orderStore.currentOrder.orderItems" :key="item.variantId" class="item-row">
              <div class="item-image-wrap">
                <img
                  :src="item.variant.image ?? item.variant.product.image ?? IMAGE"
                  :alt="item.variant.product.name"
                  class="item-image"
                />
              </div>
              <div class="item-info">
                <span class="item-name">{{ item.variant.product.name }}</span>
                <span v-if="item.variant.values.length" class="item-variant">
                  {{ getVariantLabel(item.variant) }}
                </span>
              </div>
              <span class="item-unit-price">{{ formatPrice(item.price) }}</span>
              <span class="item-qty">× {{ item.quantity }}</span>
              <span class="item-line-total">{{ formatPrice(item.price * item.quantity) }}</span>
            </li>
          </ul>

          <div class="order-summary">
            <span class="summary-label">Total</span>
            <span class="summary-value">{{ formatPrice(orderStore.currentOrder.total) }}</span>
          </div>
        </div>
      </template>

      <div v-else class="status-msg">Order not found.</div>
    </div>
  </main>
</template>

<style scoped>
.page {
  flex: 1;
}

.page-inner {
  max-width: 800px;
  margin-inline: auto;
  padding-inline: 1.5rem;
  padding-block: 2rem 5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-stone);
  transition: color 0.2s ease;
  margin-bottom: 2.5rem;
}

.back-link:hover {
  color: var(--color-mint-dark);
}

.page-header {
  margin-bottom: 2rem;
}

.page-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-mint-dark);
  margin-bottom: 0.5rem;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 0.625rem;
}

.page-date {
  font-size: 0.9375rem;
  color: var(--color-stone);
}

/* Card */
.order-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* Items */
.items-list {
  list-style: none;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid var(--color-border);
}

.item-image-wrap {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-mint-50);
  border: 1px solid var(--color-mint-100);
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.item-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.item-variant {
  font-size: 0.8rem;
  color: var(--color-stone);
}

.item-unit-price {
  font-size: 0.875rem;
  color: var(--color-stone);
}

.item-qty {
  font-size: 0.875rem;
  color: var(--color-stone);
  min-width: 2.5rem;
  text-align: right;
}

.item-line-total {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
  min-width: 4rem;
  text-align: right;
}

/* Summary */
.order-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.75rem;
  border-top: 2px solid var(--color-charcoal);
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-stone);
}

.summary-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.03em;
}

/* Status messages */
.status-msg {
  padding: 5rem 0;
  text-align: center;
  font-size: 1rem;
  color: var(--color-stone);
}

.error-msg {
  color: #d94f4f;
}
</style>
