<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { computed } from 'vue'
import { IMAGE } from '@/constants'

const cartStore = useCartStore()

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
      <div v-if="cartStore.cartItems.length === 0" class="empty-state">
        <p class="empty-message">Your cart is empty.</p>
        <router-link to="/" class="shop-link">Browse products →</router-link>
      </div>

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

            <div class="qty-control">
              <button class="qty-btn" @click="
                cartStore.updateQuantity({
                  productId: cartItem.productId,
                  quantity: cartItem.quantity - 1,
                })
                ">
                −
              </button>
              <span class="qty-value">{{ cartItem.quantity }}</span>
              <button class="qty-btn" @click="
                cartStore.updateQuantity({
                  productId: cartItem.productId,
                  quantity: cartItem.quantity + 1,
                })
                ">
                +
              </button>
            </div>

            <div class="cart-item-right">
              <p class="cart-item-price">${{ cartItem.product.price * cartItem.quantity }}</p>
              <button class="remove-btn" @click="cartStore.removeFromCart(cartItem.productId)">
                Remove
              </button>
            </div>
          </li>
        </ul>

        <!-- Total + Checkout -->
        <div class="cart-summary">
          <div class="cart-total">
            <span class="cart-total-label">Total</span>
            <span class="cart-total-value">${{ cartTotal }}</span>
          </div>
          <router-link to="/checkout" class="checkout-btn">Proceed to Checkout</router-link>
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

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem 0;
  gap: 1.25rem;
}

.empty-message {
  font-size: 1.125rem;
  color: var(--color-stone);
}

.shop-link {
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-mint-dark);
  transition: letter-spacing 0.2s ease;
}

.shop-link:hover {
  letter-spacing: 0.12em;
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

.cart-item-qty {
  font-size: 0.875rem;
  color: var(--color-stone);
}

/* Quantity stepper */
.qty-control {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: var(--color-charcoal);
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
  line-height: 1;
}

.qty-btn:hover {
  background: var(--color-mint-50);
  color: var(--color-mint-dark);
}

.qty-btn:active {
  background: var(--color-mint-100);
}

.qty-value {
  min-width: 32px;
  text-align: center;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
  border-inline: 1px solid var(--color-border);
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.remove-btn {
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-stone-light);
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.remove-btn:hover {
  color: #e05555;
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

.checkout-btn {
  padding: 0.875rem 2rem;
  background: var(--color-mint);
  color: var(--color-charcoal);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease;
}

.checkout-btn:hover {
  background: var(--color-mint-dark);
  color: white;
  transform: translateY(-1px);
}

.checkout-btn:active {
  transform: translateY(0);
}
</style>
