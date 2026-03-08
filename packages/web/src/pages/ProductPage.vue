<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import { api, type ApiProduct } from '@/services/api'
import { IMAGE } from '@/constants'
import QuantityStepper from '@/components/QuantityStepper.vue'

const route = useRoute()
const cartStore = useCartStore()

const productId = route.params.id as string
const product = ref<ApiProduct | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const quantity = ref(1)

onMounted(async () => {
  try {
    product.value = await api.getProductById(productId)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="page">
    <div class="page-inner">
      <router-link to="/" class="back-link">← All Products</router-link>

      <p v-if="loading">Loading...</p>
      <p v-else-if="error">{{ error }}</p>

      <div v-else-if="product" class="product-layout">
        <!-- Image -->
        <div class="product-image-wrap">
          <img :src="product.image || IMAGE" :alt="product.name" class="product-image" />
        </div>

        <!-- Details -->
        <div class="product-details">
          <p class="product-label">Product</p>
          <h1 class="product-name">{{ product.name }}</h1>
          <p class="product-price">${{ product.price }}</p>
          <p class="product-description">{{ product.description }}</p>
          <div class="qty-wrap">
            <QuantityStepper :quantity="quantity" @change="quantity = $event" />
          </div>
          <button class="add-to-cart-btn" @click="cartStore.addToCart({ productId, quantity })">
            Add to Cart
          </button>
        </div>
      </div>

      <div v-else-if="!loading" class="not-found">
        <p>Product not found.</p>
        <router-link to="/" class="back-link" style="margin-top: 1rem; display: inline-block">
          ← Back to store
        </router-link>
      </div>
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
  padding-block: 2rem 5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-stone);
  transition: color 0.2s ease;
  margin-bottom: 2.5rem;
}

.back-link:hover {
  color: var(--color-mint-dark);
}

/* Layout */
.product-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
}

@media (min-width: 768px) {
  .product-layout {
    grid-template-columns: 1fr 1fr;
    gap: 4.5rem;
    align-items: start;
  }
}

/* Image */
.product-image-wrap {
  background: var(--color-mint-50);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-mint-100);
}

.product-image {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
}

/* Details */
.product-details {
  display: flex;
  flex-direction: column;
}

.qty-wrap {
  align-self: flex-start;
  margin-bottom: 1rem;
}

.product-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-mint-dark);
  margin-bottom: 0.75rem;
}

.product-name {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 1.25rem;
}

.product-price {
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--color-charcoal);
  display: inline-block;
  align-self: flex-start;
  padding: 0.5rem 1rem;
  background: var(--color-mint-50);
  border-left: 3px solid var(--color-mint);
  border-radius: 0 8px 8px 0;
  margin-bottom: 1.5rem;
}

.product-description {
  font-size: 1rem;
  color: var(--color-stone);
  line-height: 1.7;
  margin-bottom: 2.25rem;
}

.add-to-cart-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  padding: 0.875rem 2rem;
  background: var(--color-charcoal);
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease;
}

.add-to-cart-btn:hover {
  background: var(--color-mint-dark);
  transform: translateY(-1px);
}

.add-to-cart-btn:active {
  transform: translateY(0);
}

/* Not found */
.not-found {
  text-align: center;
  padding: 5rem 0;
  color: var(--color-stone);
  font-size: 1.125rem;
}
</style>
