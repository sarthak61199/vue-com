<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'dark' | 'ghost' | 'text'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    class="base-btn"
    :class="[
      `base-btn--${variant ?? 'primary'}`,
      `base-btn--${size ?? 'md'}`,
      { 'base-btn--full': fullWidth },
    ]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="base-btn-spinner" />
    <slot />
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: 'Titillium Web', sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;
  white-space: nowrap;
}

.base-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Sizes */
.base-btn--sm {
  padding: 0.625rem 1rem;
}

.base-btn--md {
  padding: 0.875rem 2rem;
}

.base-btn--lg {
  padding: 0.9375rem 2rem;
}

.base-btn--full {
  width: 100%;
}

/* Variant: primary */
.base-btn--primary {
  background: var(--color-mint);
  color: var(--color-charcoal);
}

.base-btn--primary:hover:not(:disabled) {
  background: var(--color-mint-dark);
  color: white;
  transform: translateY(-1px);
}

.base-btn--primary:active:not(:disabled) {
  transform: translateY(0);
}

/* Variant: dark */
.base-btn--dark {
  background: var(--color-charcoal);
  color: white;
}

.base-btn--dark:hover:not(:disabled) {
  background: var(--color-mint-dark);
  transform: translateY(-1px);
}

.base-btn--dark:active:not(:disabled) {
  transform: translateY(0);
}

/* Variant: ghost */
.base-btn--ghost {
  background: transparent;
  border: 1.5px solid var(--color-stone);
  color: var(--color-stone);
}

.base-btn--ghost:hover:not(:disabled) {
  border-color: var(--color-charcoal);
  color: var(--color-charcoal);
}

.base-btn--ghost:disabled {
  opacity: 0.35;
}

/* Variant: text */
.base-btn--text {
  background: none;
  border: none;
  color: var(--color-stone-light);
  letter-spacing: 0.05em;
  padding: 0;
}

.base-btn--text:hover:not(:disabled) {
  color: #e05555;
}

.base-btn--text:disabled {
  opacity: 0.35;
}

/* Spinner */
.base-btn-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  animation: base-btn-spin 0.65s linear infinite;
  flex-shrink: 0;
}

.base-btn--primary .base-btn-spinner {
  border: 2px solid rgba(26, 32, 40, 0.2);
  border-top-color: var(--color-charcoal);
}

.base-btn--dark .base-btn-spinner {
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
}

.base-btn--ghost .base-btn-spinner {
  border: 2px solid rgba(98, 114, 128, 0.2);
  border-top-color: var(--color-stone);
}

@keyframes base-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
