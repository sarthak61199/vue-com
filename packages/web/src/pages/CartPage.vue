<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { IMAGE } from '@/constants'
import QuantityStepper from '@/components/QuantityStepper.vue'
import EmptyState from '@/components/EmptyState.vue'
import BaseButton from '@/components/BaseButton.vue'

const cartStore = useCartStore()
const router = useRouter()

const cartTotal = computed(() =>
  cartStore.cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
)
</script>

<template>
  <main class="page">
    <div class="page-inner">
      <div class="page-header">
        <p class="page-label">Your Order</p>
        <h1 class="page-title">Cart</h1>
      </div>

      <!-- Empty state -->
      <EmptyState
        v-if="cartStore.cartItems.length === 0"
        heading="Your cart is empty"
        message="Looks like you haven't added anything yet."
        link-to="/"
        link-text="Browse products →"
      />

      <!-- Cart items -->
      <div v-else>
        <ul class="cart-list">
          <li v-for="cartItem in cartStore.cartItems" :key="cartItem.productId" class="cart-item">
            <div class="cart-item-image-wrap">
              <img :src="cartItem.product.image || IMAGE" :alt="cartItem.product.name" class="cart-item-image" />
            </div>

            <div class="cart-item-info">
              <p class="cart-item-name">{{ cartItem.product.name }}</p>
            </div>

            <QuantityStepper
              :quantity="cartItem.quantity"
              @change="cartStore.updateQuantity({ productId: cartItem.productId, quantity: $event })"
            />

            <div class="cart-item-right">
              <p class="cart-item-price">${{ cartItem.product.price * cartItem.quantity }}</p>
              <BaseButton variant="text" size="sm" @click="cartStore.removeFromCart(cartItem.productId)">
                Remove
              </BaseButton>
            </div>
          </li>
        </ul>

        <!-- Total + Checkout -->
        <div class="cart-summary">
          <div class="cart-total">
            <span class="cart-total-label">Total</span>
            <span class="cart-total-value">${{ cartTotal }}</span>
          </div>
          <BaseButton variant="primary" size="md" @click="router.push('/checkout')">
            Proceed to Checkout
          </BaseButton>
        </div>
      </div>
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
  padding-block: 3rem 5rem;
}

/* Header */
.page-header {
  margin-bottom: 2.5rem;
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
  font-size: 2.75rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.04em;
  line-height: 1;
}

/* Cart list */
.cart-list {
  list-style: none;
  border-top: 1px solid var(--color-border);
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-block: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.cart-item-image-wrap {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-mint-50);
  border: 1px solid var(--color-mint-100);
}

.cart-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-info {
  flex: 1;
}

.cart-item-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-charcoal);
  margin-bottom: 0.25rem;
}

.cart-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.cart-item-price {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

/* Summary */
.cart-summary {
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 2px solid var(--color-charcoal);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.cart-total {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.cart-total-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-stone);
}

.cart-total-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.03em;
}
</style>
