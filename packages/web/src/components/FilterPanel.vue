<script setup lang="ts">
import type { ApiCategory } from '@/services/api'
import { BaseInput } from 'ui'

defineProps<{
  categories: ApiCategory[]
  categoryId: string
  minPrice: string
  maxPrice: string
  minRating: string
  excludeOutOfStock: boolean
}>()

const emit = defineEmits<{
  'category-change': [id: string]
  'price-change': [value: { min: string; max: string }]
  'rating-change': [value: string]
  'stock-change': [value: boolean]
  clear: []
}>()

const RATING_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '3+ ★', value: '3' },
  { label: '4+ ★', value: '4' },
  { label: '5 ★', value: '5' },
]
</script>

<template>
  <aside class="filter-panel">
    <div class="filter-header">
      <span class="filter-title">Filters</span>
      <button class="clear-btn" @click="emit('clear')">Clear all</button>
    </div>

    <!-- Availability -->
    <section class="filter-section">
      <h3 class="section-heading">Availability</h3>
      <label class="toggle-row">
        <span class="toggle-label">In stock only</span>
        <input
          type="checkbox"
          class="toggle-check"
          :checked="excludeOutOfStock"
          @change="emit('stock-change', ($event.target as HTMLInputElement).checked)"
        />
      </label>
    </section>

    <!-- Category -->
    <section class="filter-section">
      <h3 class="section-heading">Category</h3>
      <ul class="chip-list">
        <li>
          <button class="chip" :class="{ active: categoryId === '' }" @click="emit('category-change', '')">
            All
          </button>
        </li>
        <li v-for="cat in categories" :key="cat.id">
          <button class="chip" :class="{ active: categoryId === cat.id }" @click="emit('category-change', cat.id)">
            {{ cat.name }}
          </button>
        </li>
      </ul>
    </section>

    <!-- Price Range -->
    <section class="filter-section">
      <h3 class="section-heading">Price Range</h3>
      <div class="price-row">
        <BaseInput :model-value="minPrice" type="number" placeholder="Min" min="0"
          @update:model-value="emit('price-change', { min: $event as string, max: maxPrice })" />
        <span class="price-sep">–</span>
        <BaseInput :model-value="maxPrice" type="number" placeholder="Max" min="0"
          @update:model-value="emit('price-change', { min: minPrice, max: $event as string })" />
      </div>
    </section>

    <!-- Min Rating -->
    <section class="filter-section">
      <h3 class="section-heading">Min Rating</h3>
      <ul class="chip-list">
        <li v-for="opt in RATING_OPTIONS" :key="opt.value">
          <button class="chip" :class="{ active: minRating === opt.value }" @click="emit('rating-change', opt.value)">
            {{ opt.label }}
          </button>
        </li>
      </ul>
    </section>
  </aside>
</template>

<style scoped>
.filter-panel {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem 1.25rem 0 1.25rem;
  position: sticky;
  top: 5.5rem;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.filter-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-charcoal);
}

.clear-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.75rem;
  color: var(--color-stone-light);
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.clear-btn:hover {
  color: var(--color-mint-dark);
}

.filter-section {
  border-top: 1px solid var(--color-border);
  padding-block: 1.25rem;
}

.filter-section+.filter-section {
  margin-top: 0;
}

.section-heading {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-stone);
  margin-bottom: 0.75rem;
}

.chip-list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.chip {
  background: transparent;
  border: 1.5px solid var(--color-border);
  border-radius: 20px;
  padding: 0.3125rem 0.75rem;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-stone);
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s,
    background 0.15s;
  white-space: nowrap;
}

.chip:hover {
  border-color: var(--color-mint-dark);
  color: var(--color-mint-dark);
}

.chip.active {
  background: var(--color-mint);
  border-color: var(--color-mint);
  color: var(--color-charcoal);
}

.price-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-sep {
  color: var(--color-stone-light);
  font-size: 0.875rem;
  flex-shrink: 0;
}

/* Remove number input spinners */
.price-row :deep(input[type='number']) {
  -moz-appearance: textfield;
  min-width: 0;
}

.price-row :deep(input[type='number']::-webkit-outer-spin-button),
.price-row :deep(input[type='number']::-webkit-inner-spin-button) {
  -webkit-appearance: none;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 0.25rem 0;
  border-radius: 6px;
  transition: background 0.15s;
}

.toggle-row:hover {
  background: var(--color-bg);
}

.toggle-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-stone);
}

.toggle-check {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-mint-dark);
  cursor: pointer;
}

@media (max-width: 768px) {
  .filter-panel {
    position: static;
  }
}

@media (max-width: 480px) {
  .price-row {
    flex-direction: column;
    align-items: stretch;
  }

  .price-sep {
    display: none;
  }
}
</style>
