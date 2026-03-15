<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { usePromoStore } from '@/stores/promo'
import { formatPrice } from '@/utils/format'

const props = defineProps<{ shippingCost: number }>()

const cartStore = useCartStore()
const promoStore = usePromoStore()

const subtotal = computed(() =>
  cartStore.cartItems.reduce((total, item) => total + item.variant.price * item.quantity, 0),
)

const discountAmount = computed(() => promoStore.activeDiscount?.discountAmount ?? 0)

const total = computed(
  () => Math.max(0, subtotal.value - discountAmount.value) + props.shippingCost,
)
</script>

<template>
  <div class="totals">
    <div class="totals-row">
      <span class="totals-label">Subtotal</span>
      <span class="totals-value">{{ formatPrice(subtotal) }}</span>
    </div>
    <div v-if="discountAmount > 0" class="totals-row totals-row--discount">
      <span class="totals-label">Discount</span>
      <span class="totals-value totals-value--discount">−{{ formatPrice(discountAmount) }}</span>
    </div>
    <div class="totals-row">
      <span class="totals-label">Shipping</span>
      <span class="totals-value">
        {{ shippingCost === 0 ? 'Free' : formatPrice(shippingCost) }}
      </span>
    </div>
    <div class="totals-row totals-row--total">
      <span class="totals-total-label">Total</span>
      <span class="totals-total-value">{{ formatPrice(total) }}</span>
    </div>
  </div>
</template>

<style scoped>
.totals {
  padding-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.totals-label {
  font-size: 0.875rem;
  color: var(--color-stone);
}

.totals-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.totals-row--discount .totals-label {
  color: var(--color-mint-dark);
}

.totals-value--discount {
  color: var(--color-mint-dark);
}

.totals-row--total {
  padding-top: 0.75rem;
  border-top: 2px solid var(--color-charcoal);
  margin-top: 0.25rem;
}

.totals-total-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-stone);
}

.totals-total-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.03em;
}
</style>
