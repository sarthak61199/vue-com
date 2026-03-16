<script setup lang="ts">
import { IMAGE } from '@/constants'
import type { ApiProduct, ApiDisplayPromo } from '@/services/api'
import { formatPrice } from '@/utils/format'
import { getPromoForProduct, getDiscountedPrice } from '@/utils/promo'
import { useQuery } from '@pinia/colada'
import { displayPromosQuery } from '@/queries/useDisplayPromos'
import { computed } from 'vue'
import { StarRating } from 'ui'
import WishlistButton from '@/components/WishlistButton.vue'

const props = defineProps<{
  product: ApiProduct
}>()

const { data: displayPromos } = useQuery(displayPromosQuery)

const activePromo = computed<ApiDisplayPromo | null>(() =>
  getPromoForProduct(displayPromos.value ?? [], props.product),
)

const saleMin = computed(() =>
  activePromo.value && props.product.priceRange
    ? getDiscountedPrice(props.product.priceRange.min, activePromo.value)
    : null,
)

const saleFlat = computed(() =>
  activePromo.value && !(props.product.priceRange && props.product.priceRange.min !== props.product.priceRange.max)
    ? getDiscountedPrice(props.product.price, activePromo.value)
    : null,
)

const badgeLabel = computed(() => {
  if (!activePromo.value) return null
  if (activePromo.value.discountType === 'PERCENTAGE') return `-${activePromo.value.discountValue}%`
  if (activePromo.value.discountType === 'FIXED') return `-$${activePromo.value.discountValue}`
  return null
})
</script>

<template>
  <router-link :to="`/product/${product.id}`" class="product-card">
    <div class="product-image-wrap">
      <img :src="product.image || IMAGE" :alt="product.name" class="product-image" />
      <WishlistButton :product-id="product.id" class="wishlist-overlay" />
      <span v-if="badgeLabel" class="sale-badge">{{ badgeLabel }}</span>
    </div>
    <div class="product-info">
      <div class="product-name-row">
        <h3 class="product-name">{{ product.name }}</h3>
        <StarRating v-if="product.averageRating != null" :rating="product.averageRating" :count="product.reviewCount"
          size="sm" />
      </div>
      <p class="product-description">{{ product.description }}</p>
      <div class="product-footer">
        <span class="product-price">
          <template v-if="product.priceRange && product.priceRange.min !== product.priceRange.max">
            <span v-if="saleMin !== null" class="price-original">From {{ formatPrice(product.priceRange.min) }}</span>
            <span :class="saleMin !== null ? 'price-sale' : ''">From {{ formatPrice(saleMin ?? product.priceRange.min)
              }}</span>
          </template>
          <template v-else>
            <span v-if="saleFlat !== null" class="price-original">{{ formatPrice(product.price) }}</span>
            <span :class="saleFlat !== null ? 'price-sale' : ''">{{ formatPrice(saleFlat ?? product.price) }}</span>
          </template>
        </span>
        <span class="product-cta">View →</span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
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
  position: relative;
  overflow: hidden;
  background: var(--color-mint-50);
}

.wishlist-overlay {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.product-image {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
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

.product-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.product-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.product-description {
  font-size: 0.875rem;
  color: var(--color-stone);
  line-height: 1.55;
  flex: 1;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
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
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.price-original {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-stone);
  text-decoration: line-through;
}

.price-sale {
  color: var(--color-sale);
}

.sale-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: var(--color-sale);
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 0.2em 0.5em;
  border-radius: 4px;
  text-transform: uppercase;
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
