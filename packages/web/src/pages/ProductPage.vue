<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useWishlistStore } from '@/stores/wishlist'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { api, type ApiProduct, type ApiProductVariant } from '@/services/api'
import { IMAGE } from '@/constants'
import { formatPrice } from '@/utils/format'
import QuantityStepper from '@/components/QuantityStepper.vue'
import StarRating from '@/components/StarRating.vue'
import ProductReviews from '@/components/ProductReviews.vue'
import BaseButton from '@/components/BaseButton.vue'
import WishlistButton from '@/components/WishlistButton.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const wishlistStore = useWishlistStore()

const productId = route.params.id as string
const product = ref<ApiProduct | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const quantity = ref(1)

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

const hasVariants = computed(() => (product.value?.variantTypes?.length ?? 0) > 0)

// Map from typeId → selected optionId, derived from URL query params
const selectedOptions = computed((): Map<string, string> => {
  const map = new Map<string, string>()
  if (!product.value?.variantTypes?.length) return map
  for (const vt of product.value.variantTypes) {
    const val = route.query[slugify(vt.name)] as string | undefined
    if (val) map.set(vt.id, val)
  }
  return map
})

// Find the variant matching all selected options
const selectedVariant = computed((): ApiProductVariant | null => {
  if (!product.value?.variants?.length) return null
  // Simple product — always return default
  if (!hasVariants.value) {
    return product.value.variants.find((v) => v.isDefault) ?? product.value!.variants[0] ?? null
  }
  const sel = selectedOptions.value
  const typeCount = product.value.variantTypes?.length ?? 0
  if (sel.size < typeCount) return null
  return (
    product.value.variants.find((v) =>
      v.values.every((val) => sel.get(val.option.variantTypeId) === val.optionId),
    ) ?? null
  )
})

const allTypesSelected = computed(
  () => !hasVariants.value || selectedOptions.value.size === (product.value?.variantTypes?.length ?? 0),
)

const displayPrice = computed(() => selectedVariant.value?.price ?? product.value?.price ?? 0)
const displayImage = computed(() => selectedVariant.value?.image ?? product.value?.image ?? null)

function selectOption(typeName: string, optionId: string) {
  router.replace({ query: { ...route.query, [slugify(typeName)]: optionId } })
}

function isOptionSelected(typeId: string, optionId: string): boolean {
  return selectedOptions.value.get(typeId) === optionId
}

onMounted(async () => {
  try {
    const fetches: Promise<unknown>[] = [api.getProductById(productId)]
    if (authStore.user) fetches.push(wishlistStore.fetchWishlist())
    const [p] = await Promise.all(fetches)
    product.value = p as ApiProduct

    // Auto-init query params from default variant if none are set
    const prod = product.value
    if (prod?.variantTypes?.length && prod.variants?.length) {
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
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
})

async function addToCart() {
  const variant = selectedVariant.value
  if (!variant) return
  await cartStore.addToCart({ variantId: variant.id, quantity: quantity.value })
}

async function refreshProduct() {
  product.value = await api.getProductById(productId)
}
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
          <img :src="displayImage || IMAGE" :alt="product.name" class="product-image" />
        </div>

        <!-- Details -->
        <div class="product-details">
          <p class="product-label">Product</p>
          <h1 class="product-name">{{ product.name }}</h1>
          <p class="product-price">{{ formatPrice(displayPrice) }}</p>
          <div v-if="product.averageRating != null" class="product-rating">
            <StarRating :rating="product.averageRating" :count="product.reviewCount" size="md" />
          </div>
          <p class="product-description">{{ product.description }}</p>

          <!-- Variant selectors -->
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

          <div class="qty-wrap">
            <QuantityStepper :quantity="quantity" @change="quantity = $event" />
          </div>
          <div class="actions-row">
            <BaseButton
              variant="dark"
              size="md"
              :disabled="!selectedVariant"
              @click="addToCart"
            >
              {{ allTypesSelected && !selectedVariant ? 'Unavailable' : 'Add to Cart' }}
            </BaseButton>
            <WishlistButton :product-id="productId" />
          </div>
        </div>
      </div>

      <ProductReviews v-if="product" :product-id="product.id" @review-submitted="refreshProduct" />

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

.product-rating {
  margin-bottom: 1.25rem;
}

.product-description {
  font-size: 1rem;
  color: var(--color-stone);
  line-height: 1.7;
  margin-bottom: 1.75rem;
}

/* Variant selectors */
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
  color: #c0392b;
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

/* Not found */
.not-found {
  text-align: center;
  padding: 5rem 0;
  color: var(--color-stone);
  font-size: 1.125rem;
}
</style>
