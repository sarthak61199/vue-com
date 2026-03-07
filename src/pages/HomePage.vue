<script setup lang="ts">
import { useProductStore } from '@/stores/product'
import ProductCard from '@/components/ProductCard.vue'

const productStore = useProductStore()
</script>

<template>
  <main class="page">
    <div class="page-inner">
      <!-- Page header -->
      <div class="page-header">
        <p class="page-label">New Collection</p>
        <h1 class="page-title">Fresh Picks</h1>
        <p class="page-subtitle">{{ productStore.products.length }} products available</p>
      </div>

      <!-- Product grid -->
      <ul class="product-grid">
        <li v-for="product in productStore.products" :key="product.id">
          <ProductCard :product="product" />
        </li>
      </ul>
    </div>
  </main>
</template>

<style scoped>
.page {
  flex: 1;
}

.page-inner {
  max-width: 1200px;
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
  margin-bottom: 0.625rem;
}

.page-subtitle {
  font-size: 0.9375rem;
  color: var(--color-stone);
}

/* Grid */
.product-grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
