<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@pinia/colada'
import { useCartStore } from '@/stores/cart'
import { wishlistQuery, useToggleWishlist } from '@/queries/useWishlist'
import EmptyState from '@/components/EmptyState.vue'
import { IMAGE } from '@/constants'
import { formatPrice } from '@/utils/format'

const cartStore = useCartStore()

const { data: wishlistItems, isPending: loading } = useQuery(wishlistQuery)
const items = computed(() => wishlistItems.value ?? [])

const { mutateAsync: toggleMutate } = useToggleWishlist()
</script>

<template>
  <main class="page">
    <div class="page-inner">
      <div class="page-header">
        <p class="page-label">Saved Items</p>
        <h1 class="page-title">My Wishlist</h1>
      </div>

      <div v-if="loading" class="loading-msg">Loading wishlist...</div>

      <EmptyState
        v-else-if="items.length === 0"
        heading="Your wishlist is empty"
        message="Save products you love and add them to your cart later."
        link-to="/"
        link-text="Browse products →"
      />

      <ul v-else class="wishlist-list">
        <li v-for="item in items" :key="item.productId" class="wishlist-item">
          <router-link :to="`/product/${item.productId}`" class="item-thumb-wrap">
            <img :src="item.product.image || IMAGE" :alt="item.product.name" class="item-thumb" />
          </router-link>
          <div class="item-info">
            <router-link :to="`/product/${item.productId}`" class="item-name">
              {{ item.product.name }}
            </router-link>
            <p class="item-price">{{ formatPrice(item.product.price) }}</p>
          </div>
          <div class="item-actions">
            <button
              class="btn-cart"
              :disabled="!item.product.defaultVariantId"
              @click="
                item.product.defaultVariantId &&
                cartStore.addToCart({ variantId: item.product.defaultVariantId, quantity: 1 })
              "
            >
              Add to Cart
            </button>
            <button class="btn-remove" @click="toggleMutate({ productId: item.productId, isWishlisted: true })">
              Remove
            </button>
          </div>
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
  max-width: 800px;
  margin-inline: auto;
  padding-inline: 1.5rem;
  padding-block: 3rem 5rem;
}

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
}

.loading-msg {
  padding: 5rem 0;
  text-align: center;
  font-size: 1rem;
  color: var(--color-stone);
}

.wishlist-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.wishlist-item {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  box-shadow: var(--shadow-card);
}

.item-thumb-wrap {
  flex-shrink: 0;
}

.item-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  background: var(--color-mint-50);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
  display: block;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.item-name:hover {
  color: var(--color-mint-dark);
}

.item-price {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-cart {
  padding: 0.4rem 1rem;
  background: var(--color-charcoal);
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'Titillium Web', sans-serif;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-cart:hover {
  opacity: 0.85;
}

.btn-remove {
  padding: 0.4rem 1rem;
  background: none;
  color: var(--color-stone);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: 'Titillium Web', sans-serif;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.btn-remove:hover {
  color: #e05555;
  border-color: #e05555;
}
</style>
