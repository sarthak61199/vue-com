<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import { ref, computed, watch } from 'vue'
import { useQuery } from '@pinia/colada'
import type { ApiProductVariant } from '@/services/api'
import { IMAGE } from '@/constants'
import ProductVariantSelector from '@/components/ProductVariantSelector.vue'
import { formatPrice } from '@/utils/format'
import { getPromoForProduct, getDiscountedPrice } from '@/utils/promo'
import { productQuery } from '@/queries/useProduct'
import { recommendationsQuery } from '@/queries/useRecommendations'
import { displayPromosQuery } from '@/queries/useDisplayPromos'
import { wishlistQuery } from '@/queries/useWishlist'
import QuantityStepper from '@/components/QuantityStepper.vue'
import StarRating from '@/components/StarRating.vue'
import ProductReviews from '@/components/ProductReviews.vue'
import ProductCard from '@/components/ProductCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import WishlistButton from '@/components/WishlistButton.vue'

const route = useRoute()
const cartStore = useCartStore()
const authStore = useAuthStore()

const productId = computed(() => route.params.id as string)
const quantity = ref(1)

// --- Queries ---
const { data: product, isPending: loading, error } = useQuery(
  () => productQuery(productId.value),
)

const { data: recommendationsData } = useQuery(
  () => recommendationsQuery(productId.value),
)
const recommendations = computed(() => recommendationsData.value ?? [])

const { data: displayPromos } = useQuery(displayPromosQuery)

// Pre-fetch wishlist if authenticated
useQuery({
  ...wishlistQuery,
  enabled: computed(() => !!authStore.user),
})

// Reset quantity when navigating between products
watch(productId, () => {
  quantity.value = 1
})

// Variant state — owned by ProductVariantSelector, surfaced here via @change
const selectedVariant = ref<ApiProductVariant | null>(null)
const isUnavailableCombination = ref(false)

function onVariantChange(state: { variant: ApiProductVariant | null; unavailable: boolean }) {
  selectedVariant.value = state.variant
  isUnavailableCombination.value = state.unavailable
}

const displayPrice = computed(() => selectedVariant.value?.price ?? product.value?.price ?? 0)
const displayImage = computed(() => selectedVariant.value?.image ?? product.value?.image ?? null)

const activePromo = computed(() =>
  product.value ? getPromoForProduct(displayPromos.value ?? [], product.value) : null,
)
const salePrice = computed(() =>
  activePromo.value ? getDiscountedPrice(displayPrice.value, activePromo.value) : null,
)
const saleBadgeLabel = computed(() => {
  if (!activePromo.value) return null
  if (activePromo.value.discountType === 'PERCENTAGE') return `-${activePromo.value.discountValue}%`
  if (activePromo.value.discountType === 'FIXED') return `-$${activePromo.value.discountValue}`
  return null
})

const selectedStock = computed(() => selectedVariant.value?.stock ?? null)
const isOutOfStock = computed(() => selectedStock.value !== null && selectedStock.value <= 0)
const isLowStock = computed(
  () => selectedStock.value !== null && selectedStock.value > 0 && selectedStock.value <= 5,
)

async function addToCart() {
  const variant = selectedVariant.value
  if (!variant) return
  await cartStore.addToCart({ variantId: variant.id, quantity: quantity.value })
}
</script>

<template>
  <main class="page">
    <div class="page-inner">
      <router-link to="/" class="back-link">← All Products</router-link>

      <p v-if="loading">Loading...</p>
      <p v-else-if="error">{{ error.message }}</p>

      <div v-else-if="product" class="product-layout">
        <!-- Image -->
        <div class="product-image-wrap">
          <img :src="displayImage || IMAGE" :alt="product.name" class="product-image" />
        </div>

        <!-- Details -->
        <div class="product-details">
          <div class="product-label-row">
            <p class="product-label">Product</p>
            <router-link
              v-if="product.category"
              :to="`/?categoryId=${product.categoryId}`"
              class="product-category"
            >{{ product.category.name }}</router-link>
          </div>
          <h1 class="product-name">{{ product.name }}</h1>
          <div class="product-price-wrap">
            <span v-if="salePrice !== null" class="product-price product-price--original">{{ formatPrice(displayPrice) }}</span>
            <span class="product-price" :class="{ 'product-price--sale': salePrice !== null }">{{ formatPrice(salePrice ?? displayPrice) }}</span>
            <span v-if="saleBadgeLabel" class="product-sale-badge">{{ saleBadgeLabel }}</span>
          </div>
          <div v-if="product.averageRating != null" class="product-rating">
            <StarRating :rating="product.averageRating" :count="product.reviewCount" size="md" />
          </div>
          <p class="product-description">{{ product.description }}</p>

          <!-- Variant selectors -->
          <ProductVariantSelector :product="product" @change="onVariantChange" />

          <!-- Stock status -->
          <div v-if="selectedVariant" class="stock-status">
            <span v-if="isOutOfStock" class="stock-badge stock-badge--oos">Out of Stock</span>
            <span v-else-if="isLowStock" class="stock-badge stock-badge--low">
              Only {{ selectedStock }} left!
            </span>
            <span v-else class="stock-badge stock-badge--ok">In Stock</span>
          </div>

          <div class="qty-wrap">
            <QuantityStepper
              :quantity="quantity"
              :disable-minus="quantity <= 1 || isOutOfStock || (isUnavailableCombination)"
              :disable-plus="isOutOfStock || (isUnavailableCombination) || (selectedStock !== null && quantity >= selectedStock)"
              @change="quantity = $event"
            />
          </div>
          <div class="actions-row">
            <BaseButton
              variant="dark"
              size="md"
              :disabled="!selectedVariant || isOutOfStock"
              @click="addToCart"
            >
              {{ isUnavailableCombination ? 'Unavailable' : isOutOfStock ? 'Out of Stock' : 'Add to Cart' }}
            </BaseButton>
            <WishlistButton :product-id="productId" />
          </div>
        </div>
      </div>

      <section v-if="recommendations.length" class="recommendations">
        <h2 class="recommendations-heading">You might also like</h2>
        <div class="recommendations-grid">
          <ProductCard v-for="rec in recommendations" :key="rec.id" :product="rec" />
        </div>
      </section>

      <ProductReviews v-if="product" :product-id="product.id" />

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

.product-label-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.product-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-mint-dark);
  margin-bottom: 0;
}

.product-category {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-stone);
  background: var(--color-mint-50);
  border: 1px solid var(--color-mint-100);
  padding: 0.2em 0.6em;
  border-radius: 100px;
  transition: color 0.2s ease, background 0.2s ease;
}

.product-category:hover {
  color: var(--color-mint-dark);
  background: var(--color-mint-100);
}

.product-name {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 1.25rem;
}

.product-price-wrap {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
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
}

.product-price--original {
  font-size: 1.125rem;
  color: var(--color-stone);
  text-decoration: line-through;
  background: none;
  border-left: none;
  padding: 0.5rem 0;
  border-radius: 0;
}

.product-price--sale {
  color: var(--color-sale);
  background: var(--color-sale-bg);
  border-left-color: var(--color-sale);
}

.product-sale-badge {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: var(--color-sale);
  color: white;
  padding: 0.25em 0.6em;
  border-radius: 4px;
  text-transform: uppercase;
  align-self: center;
}

.product-rating {
  margin-bottom: 1.25rem;
}

.product-description {
  font-size: 1rem;
  color: var(--color-stone);
  line-height: 1.7;
  margin-bottom: 1.75rem;
}

.stock-status {
  margin-bottom: 1rem;
  align-self: flex-start;
}

.stock-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.3rem 0.75rem;
  border-radius: 100px;
}

.stock-badge--ok {
  background: #e6f7ee;
  color: #1a7f4b;
}

.stock-badge--low {
  background: #fff4e5;
  color: var(--color-warning);
}

.stock-badge--oos {
  background: #fee2e2;
  color: var(--color-oos);
}

.qty-wrap {
  align-self: flex-start;
  margin-bottom: 1rem;
}

.actions-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  align-self: flex-start;
}

/* Recommendations */
.recommendations {
  margin-top: 4rem;
  margin-bottom: 2rem;
}

.recommendations-heading {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.02em;
  margin-bottom: 1.5rem;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}

/* Not found */
.not-found {
  text-align: center;
  padding: 5rem 0;
  color: var(--color-stone);
  font-size: 1.125rem;
}

@media (max-width: 640px) {
  .product-name {
    font-size: 1.625rem;
  }

  .product-price {
    font-size: 1.25rem;
  }

  .actions-row > :first-child {
    flex: 1;
  }

  .page-inner {
    padding-inline: 1rem;
  }
}
</style>
