<script setup lang="ts">
import type { ApiProduct, ApiProductVariant } from 'api'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{ product: ApiProduct }>()

const emit = defineEmits<{
  change: [{ variant: ApiProductVariant | null; unavailable: boolean }]
}>()

const route = useRoute()
const router = useRouter()

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const hasVariants = computed(() => (props.product.variantTypes?.length ?? 0) > 0)

// Map from typeId → selected optionId, derived from URL query params
const selectedOptions = computed((): Map<string, string> => {
  const map = new Map<string, string>()
  if (!props.product.variantTypes?.length) return map
  for (const vt of props.product.variantTypes) {
    const val = route.query[slugify(vt.name)] as string | undefined
    if (val) map.set(vt.id, val)
  }
  return map
})

// Find the variant matching all selected options
const selectedVariant = computed((): ApiProductVariant | null => {
  if (!props.product.variants?.length) return null
  if (!hasVariants.value) {
    return props.product.variants.find((v) => v.isDefault) ?? props.product.variants[0] ?? null
  }
  const sel = selectedOptions.value
  const typeCount = props.product.variantTypes?.length ?? 0
  if (sel.size < typeCount) return null
  return (
    props.product.variants.find((v) =>
      v.values.every((val) => sel.get(val.option.variantTypeId) === val.optionId),
    ) ?? null
  )
})

const allTypesSelected = computed(
  () => !hasVariants.value || selectedOptions.value.size === (props.product.variantTypes?.length ?? 0),
)

function selectOption(typeName: string, optionId: string) {
  router.replace({ query: { ...route.query, [slugify(typeName)]: optionId } })
}

function isOptionSelected(typeId: string, optionId: string): boolean {
  return selectedOptions.value.get(typeId) === optionId
}

// Auto-init query params from default variant when product loads or id changes
watch(
  () => props.product,
  (prod) => {
    if (!prod?.variantTypes?.length || !prod.variants?.length) return
    const defaultVariant = prod.variants.find((v) => v.isDefault) ?? prod.variants[0]
    const query = { ...route.query }
    let changed = false
    for (const vt of prod.variantTypes) {
      const key = slugify(vt.name)
      if (!query[key]) {
        const val = defaultVariant?.values.find((v) => v.option.variantTypeId === vt.id)
        if (val) {
          query[key] = val.optionId
          changed = true
        }
      }
    }
    if (changed) router.replace({ query })
  },
  { immediate: true },
)

// Emit current variant state to parent whenever it changes
watch(
  () => ({ variant: selectedVariant.value, unavailable: allTypesSelected.value && !selectedVariant.value }),
  (state) => emit('change', state),
  { immediate: true },
)
</script>

<template>
  <div v-if="hasVariants && product.variantTypes" class="variant-selectors">
    <div v-for="vt in product.variantTypes" :key="vt.id" class="variant-group">
      <p class="variant-group-label">{{ vt.name }}</p>
      <div class="variant-options">
        <button
          v-for="opt in vt.options"
          :key="opt.id"
          type="button"
          class="variant-btn"
          :class="{ 'is-selected': isOptionSelected(vt.id, opt.id) }"
          @click="selectOption(vt.name, opt.id)"
        >
          {{ opt.value }}
        </button>
      </div>
    </div>
    <p v-if="allTypesSelected && !selectedVariant" class="variant-unavailable">
      This combination is not available
    </p>
  </div>
</template>

<style scoped>
.variant-selectors {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.75rem;
}

.variant-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.variant-group-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-stone);
}

.variant-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.variant-btn {
  padding: 0.4375rem 0.875rem;
  border-radius: 6px;
  border: 1.5px solid var(--color-border);
  background: white;
  color: var(--color-charcoal);
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
}

.variant-btn:hover {
  border-color: var(--color-mint);
  background: var(--color-mint-50);
}

.variant-btn.is-selected {
  border-color: var(--color-mint-dark);
  background: var(--color-mint-dark);
  color: white;
}

.variant-unavailable {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-sale);
}
</style>
