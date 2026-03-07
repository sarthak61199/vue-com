<script setup lang="ts">
import { useProductStore } from '@/stores/product'

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
          <router-link :to="`/product/${product.id}`" class="product-card">
            <div class="product-image-wrap">
              <img :src="product.image" :alt="product.name" class="product-image" />
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-description">{{ product.description }}</p>
              <div class="product-footer">
                <span class="product-price">${{ product.price }}</span>
                <span class="product-cta">View →</span>
              </div>
            </div>
          </router-link>
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

/* Card */
.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-mint);
}

.product-image-wrap {
  overflow: hidden;
  background: var(--color-mint-50);
}

.product-image {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: contain;
  transition: transform 0.4s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

/* Card body */
.product-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1.25rem;
}

.product-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-charcoal);
  margin-bottom: 0.375rem;
}

.product-description {
  font-size: 0.875rem;
  color: var(--color-stone);
  line-height: 1.55;
  flex: 1;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.product-cta {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-mint-dark);
  text-transform: uppercase;
  transition: letter-spacing 0.2s ease;
}

.product-card:hover .product-cta {
  letter-spacing: 0.12em;
}
</style>
