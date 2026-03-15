<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { IMAGE } from '@/constants'
import { formatPrice, getVariantLabel } from '@/utils/format'

const cartStore = useCartStore()
</script>

<template>
  <ul class="summary-list">
    <li v-for="cartItem in cartStore.cartItems" :key="cartItem.variantId" class="summary-item">
      <div class="summary-item-image-wrap">
        <img
          :src="cartItem.variant.image ?? cartItem.variant.product.image ?? IMAGE"
          :alt="cartItem.variant.product.name"
          class="summary-item-image"
        />
        <span class="summary-item-qty">{{ cartItem.quantity }}</span>
      </div>
      <div class="summary-item-info">
        <p class="summary-item-name">{{ cartItem.variant.product.name }}</p>
        <p v-if="cartItem.variant.values.length" class="summary-item-variant">
          {{ getVariantLabel(cartItem.variant) }}
        </p>
        <p v-if="cartItem.variant.stock <= 0" class="summary-item-stock-warn summary-item-stock-warn--oos">
          Out of stock
        </p>
        <p v-else-if="cartItem.quantity > cartItem.variant.stock" class="summary-item-stock-warn">
          Only {{ cartItem.variant.stock }} available
        </p>
      </div>
      <p class="summary-item-price">
        {{ formatPrice(cartItem.variant.price * cartItem.quantity) }}
      </p>
    </li>
  </ul>
</template>

<style scoped>
.summary-list {
  list-style: none;
  border-top: 1px solid var(--color-border);
  margin-bottom: 0;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding-block: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.summary-item-image-wrap {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.summary-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  background: var(--color-mint-50);
  border: 1px solid var(--color-mint-100);
}

.summary-item-qty {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-charcoal);
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.summary-item-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.summary-item-variant {
  font-size: 0.8rem;
  color: var(--color-stone);
}

.summary-item-stock-warn {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-warning);
  margin-top: 0.125rem;
}

.summary-item-stock-warn--oos {
  color: var(--color-oos);
}

.summary-item-price {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
}
</style>
