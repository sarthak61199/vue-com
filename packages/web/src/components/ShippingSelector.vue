<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatPrice } from '@/utils/format'

const props = defineProps<{ isFreeShipping: boolean }>()
const emit = defineEmits<{ change: [cost: number] }>()

const shippingOptions = [
  { id: 'standard', label: 'Standard Shipping', detail: '5–7 business days', price: 0 },
  { id: 'express', label: 'Express Shipping', detail: '2–3 business days', price: 9.99 },
  { id: 'overnight', label: 'Overnight', detail: 'Next business day', price: 24.99 },
]

const selected = ref('standard')

const cost = computed(() => {
  if (props.isFreeShipping) return 0
  return shippingOptions.find((o) => o.id === selected.value)?.price ?? 0
})

watch(cost, (c) => emit('change', c), { immediate: true })
</script>

<template>
  <div class="shipping-options">
    <label
      v-for="option in shippingOptions"
      :key="option.id"
      class="shipping-option"
      :class="{ 'is-selected': selected === option.id }"
    >
      <input
        type="radio"
        name="shipping"
        :id="option.id"
        :value="option.id"
        v-model="selected"
        class="shipping-radio"
      />
      <div class="shipping-option-body">
        <div class="shipping-option-left">
          <span class="shipping-dot"></span>
          <div>
            <p class="shipping-label">{{ option.label }}</p>
            <p class="shipping-detail">{{ option.detail }}</p>
          </div>
        </div>
        <span class="shipping-price">
          {{ option.price === 0 ? 'Free' : formatPrice(option.price) }}
        </span>
      </div>
    </label>
  </div>
</template>

<style scoped>
.shipping-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shipping-option {
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.shipping-option.is-selected {
  border-color: var(--color-mint);
  background: var(--color-mint-50);
}

.shipping-radio {
  display: none;
}

.shipping-option-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.125rem;
  gap: 0.75rem;
}

.shipping-option-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.shipping-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.2s ease;
}

.shipping-option.is-selected .shipping-dot {
  border-color: var(--color-mint-dark);
}

.shipping-option.is-selected .shipping-dot::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--color-mint-dark);
}

.shipping-label {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
  margin-bottom: 0.125rem;
}

.shipping-detail {
  font-size: 0.8125rem;
  color: var(--color-stone);
}

.shipping-price {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
  white-space: nowrap;
}
</style>
