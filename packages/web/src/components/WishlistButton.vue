<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWishlistStore } from '@/stores/wishlist'

const props = defineProps<{ productId: string }>()

const authStore = useAuthStore()
const wishlistStore = useWishlistStore()
const router = useRouter()
const route = useRoute()

const fetched = ref(false)

async function handleClick(e: Event) {
  e.preventDefault()
  e.stopPropagation()

  if (!authStore.user) {
    router.push({ path: '/login', query: { redirectTo: route.fullPath } })
    return
  }

  if (!fetched.value) {
    await wishlistStore.fetchWishlist()
    fetched.value = true
  }

  await wishlistStore.toggleWishlist(props.productId)
}
</script>

<template>
  <button
    class="wishlist-btn"
    :class="{ wishlisted: wishlistStore.wishlistedIds.has(productId) }"
    :title="wishlistStore.wishlistedIds.has(productId) ? 'Remove from wishlist' : 'Add to wishlist'"
    @click="handleClick"
  >
    {{ wishlistStore.wishlistedIds.has(productId) ? '♥' : '♡' }}
  </button>
</template>

<style scoped>
.wishlist-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: white;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-stone);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
  line-height: 1;
  padding: 0;
}

.wishlist-btn:hover,
.wishlist-btn.wishlisted {
  color: #e05555;
  border-color: #e05555;
}

.wishlist-btn.wishlisted {
  background: #fff0f0;
}
</style>
