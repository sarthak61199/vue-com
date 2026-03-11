<script setup lang="ts">
const props = defineProps<{
  quantity: number
  min?: number
}>()

const emit = defineEmits<{
  change: [quantity: number]
}>()

const min = props.min ?? 1
</script>

<template>
  <div class="qty-control">
    <button class="qty-btn" :disabled="quantity <= min" @click="emit('change', quantity - 1)">
      −
    </button>
    <span class="qty-value">{{ quantity }}</span>
    <button class="qty-btn" @click="emit('change', quantity + 1)">+</button>
  </div>
</template>

<style scoped>
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

.qty-btn:hover:not(:disabled) {
  background: var(--color-mint-50);
  color: var(--color-mint-dark);
}

.qty-btn:active:not(:disabled) {
  background: var(--color-mint-100);
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
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
</style>
