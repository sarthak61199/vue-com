<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  modelValue?: string | number
  type?: string
  placeholder?: string
  id?: string
  disabled?: boolean
  error?: boolean
  variant?: 'default' | 'ghost'
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :id="id"
    :type="type ?? 'text'"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    class="base-input"
    :class="[`base-input--${variant ?? 'default'}`, { 'base-input--error': error }]"
    v-bind="$attrs"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<style scoped>
.base-input {
  width: 100%;
  font-family: 'Titillium Web', sans-serif;
  color: var(--color-charcoal);
  border-radius: 8px;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.base-input::placeholder {
  color: var(--color-stone-light);
}

.base-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Default variant — form fields */
.base-input--default {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background: var(--color-cream);
  border: 1px solid var(--color-border);
}

.base-input--default:focus {
  border-color: var(--color-mint);
  box-shadow: 0 0 0 3px var(--color-mint-50);
  background: white;
}

/* Ghost variant — search / inline */
.base-input--ghost {
  padding: 0.625rem 0.875rem;
  font-size: 0.9375rem;
  background: transparent;
  border: 1.5px solid var(--color-stone);
  border-radius: 6px;
}

.base-input--ghost:focus {
  border-color: var(--color-mint-dark);
}

/* Error state */
.base-input--error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(217, 79, 79, 0.1);
}
</style>
