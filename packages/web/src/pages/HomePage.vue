<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useDebounce } from '@/composables/useDebounce'
import ProductCard from '@/components/ProductCard.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import EmptyState from '@/components/EmptyState.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

const PAGE_SIZE = 9
const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

const currentPage = computed(() => {
  const p = parseInt(route.query.page as string, 10)
  return Number.isFinite(p) && p > 0 ? p : 1
})

const currentSearch = computed(() => (route.query.search as string) || '')

const searchInput = ref(currentSearch.value)
const debouncedSearch = useDebounce(searchInput, 300)

watch(debouncedSearch, (val) => {
  if (val === currentSearch.value) return
  router.push({ query: { ...(val ? { search: val } : {}), page: 1 } })
})

watch(
  [currentPage, currentSearch],
  ([page, search]) => productStore.fetchProducts(page, search || undefined),
  { immediate: true },
)

const goTo = (page: number) => router.push({ query: { ...route.query, page } })

const clearSearch = () => {
  searchInput.value = ''
  router.push({ query: { page: 1 } })
}
</script>

<template>
  <main class="page">
    <div class="page-inner">
      <!-- Page header -->
      <div class="page-header">
        <p class="page-label">New Collection</p>
        <h1 class="page-title">Fresh Picks</h1>
        <p class="page-subtitle">
          <template v-if="currentSearch">
            {{ productStore.total }} results for "{{ currentSearch }}"
          </template>
          <template v-else>{{ productStore.total }} products available</template>
        </p>
      </div>

      <!-- Search bar -->
      <div class="search-bar">
        <BaseInput v-model="searchInput" type="search" placeholder="Search products..." variant="ghost" />
        <BaseButton variant="ghost" size="sm" :disabled="!currentSearch" @click="clearSearch">Clear</BaseButton>
      </div>

      <p v-if="productStore.loading">Loading...</p>
      <p v-else-if="productStore.error">{{ productStore.error }}</p>

      <!-- Product grid -->
      <template v-else>
        <EmptyState
          v-if="productStore.products.length === 0"
          :heading="currentSearch ? `No results for &quot;${currentSearch}&quot;` : 'No products found'"
          message="Try a different search term or browse all products."
          link-to="/"
          link-text="Clear search →"
        />

        <template v-else>
          <ul class="product-grid">
            <li v-for="product in productStore.products" :key="product.id">
              <ProductCard :product="product" />
            </li>
          </ul>

          <PaginationControls :page="currentPage" :total="productStore.total" :page-size="PAGE_SIZE"
            @prev="goTo(currentPage - 1)" @next="goTo(currentPage + 1)" />
        </template>
      </template>
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

/* Search */
.search-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
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
