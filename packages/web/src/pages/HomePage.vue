<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@pinia/colada'
import { useDebounce } from '@/composables/useDebounce'
import { categoriesQuery } from '@/queries/useCategories'
import { displayPromosQuery } from '@/queries/useDisplayPromos'
import { productsQuery } from '@/queries/useProducts'
import type { ProductFilters } from '@/services/api'
import ProductCard from '@/components/ProductCard.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import EmptyState from '@/components/EmptyState.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import FilterPanel from '@/components/FilterPanel.vue'

const PAGE_SIZE = 9
const route = useRoute()
const router = useRouter()

// --- Queries ---
const { data: categoriesData } = useQuery(categoriesQuery)
useQuery(displayPromosQuery)

const categories = computed(() => categoriesData.value ?? [])

// --- URL-derived state ---
const currentPage = computed(() => {
  const p = parseInt(route.query.page as string, 10)
  return Number.isFinite(p) && p > 0 ? p : 1
})
const currentSearch = computed(() => (route.query.search as string) || '')
const currentCategoryId = computed(() => (route.query.categoryId as string) || '')
const currentMinRating = computed(() => (route.query.minRating as string) || '')
const currentMinPrice = computed(() => (route.query.minPrice as string) || '')
const currentMaxPrice = computed(() => (route.query.maxPrice as string) || '')
const currentExcludeOutOfStock = computed(() => route.query.excludeOutOfStock === 'true')

// --- Search (debounced) ---
const searchInput = ref(currentSearch.value)
const debouncedSearch = useDebounce(searchInput, 300)

watch(debouncedSearch, (val) => {
  if (val === currentSearch.value) return
  router.push({ query: { ...route.query, search: val || undefined, page: 1 } })
})

// --- Price (local + debounced) ---
const localMinPrice = ref(currentMinPrice.value)
const localMaxPrice = ref(currentMaxPrice.value)
const debouncedMin = useDebounce(localMinPrice, 300)
const debouncedMax = useDebounce(localMaxPrice, 300)

watch([debouncedMin, debouncedMax], ([min, max]) => {
  router.push({
    query: {
      ...route.query,
      minPrice: min || undefined,
      maxPrice: max || undefined,
      page: 1,
    },
  })
})

// Keep local price in sync if URL changes externally (e.g. clear all)
watch(currentMinPrice, (v) => {
  localMinPrice.value = v
})
watch(currentMaxPrice, (v) => {
  localMaxPrice.value = v
})

// --- Filter handlers (immediate) ---
const setCategory = (id: string) =>
  router.push({ query: { ...route.query, categoryId: id || undefined, page: 1 } })

const setRating = (val: string) =>
  router.push({ query: { ...route.query, minRating: val || undefined, page: 1 } })

const setExcludeOutOfStock = (val: boolean) =>
  router.push({ query: { ...route.query, excludeOutOfStock: val ? 'true' : undefined, page: 1 } })

const clearFilters = () => {
  localMinPrice.value = ''
  localMaxPrice.value = ''
  router.push({
    query: currentSearch.value ? { search: currentSearch.value, page: 1 } : { page: 1 },
  })
}

const clearSearch = () => {
  searchInput.value = ''
  router.push({ query: { ...route.query, search: undefined, page: 1 } })
}

// --- Products query (auto-refetches when filters change) ---
const filters = computed<ProductFilters>(() => ({
  page: currentPage.value,
  search: currentSearch.value || undefined,
  categoryId: currentCategoryId.value || undefined,
  minPrice: currentMinPrice.value ? parseFloat(currentMinPrice.value) : undefined,
  maxPrice: currentMaxPrice.value ? parseFloat(currentMaxPrice.value) : undefined,
  minRating: currentMinRating.value ? parseFloat(currentMinRating.value) : undefined,
  excludeOutOfStock: currentExcludeOutOfStock.value || undefined,
}))

const { data: productsData, isPending: productsLoading, error: productsError } = useQuery(
  () => productsQuery(filters.value),
)

const products = computed(() => productsData.value?.items ?? [])
const total = computed(() => productsData.value?.total ?? 0)

const goTo = (page: number) => router.push({ query: { ...route.query, page } })

const hasActiveFilters = computed(
  () =>
    currentCategoryId.value ||
    currentMinPrice.value ||
    currentMaxPrice.value ||
    currentMinRating.value ||
    currentExcludeOutOfStock.value,
)
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
            {{ total }} results for "{{ currentSearch }}"
          </template>
          <template v-else>{{ total }} products available</template>
        </p>
      </div>

      <!-- Search bar -->
      <div class="search-bar">
        <BaseInput
          v-model="searchInput"
          type="search"
          placeholder="Search products..."
          variant="ghost"
        />
        <BaseButton variant="ghost" size="sm" :disabled="!currentSearch" @click="clearSearch"
          >Clear</BaseButton
        >
      </div>

      <!-- Content layout: sidebar + grid -->
      <div class="content-layout">
        <FilterPanel
          :categories="categories"
          :category-id="currentCategoryId"
          :min-price="localMinPrice"
          :max-price="localMaxPrice"
          :min-rating="currentMinRating"
          :exclude-out-of-stock="currentExcludeOutOfStock"
          @category-change="setCategory"
          @price-change="
            ({ min, max }) => {
              localMinPrice = min
              localMaxPrice = max
            }
          "
          @rating-change="setRating"
          @stock-change="setExcludeOutOfStock"
          @clear="clearFilters"
        />

        <div class="product-section">
          <!-- Active filter pills -->
          <div v-if="hasActiveFilters" class="active-filters">
            <span class="active-label">Filtered by:</span>
            <button v-if="currentCategoryId" class="filter-pill" @click="setCategory('')">
              {{ categories.find((c) => c.id === currentCategoryId)?.name }}
              <span class="pill-x">×</span>
            </button>
            <button
              v-if="currentMinPrice || currentMaxPrice"
              class="filter-pill"
              @click="
                () => {
                  localMinPrice = ''
                  localMaxPrice = ''
                }
              "
            >
              ${{ currentMinPrice || '0' }} – ${{ currentMaxPrice || '∞' }}
              <span class="pill-x">×</span>
            </button>
            <button v-if="currentMinRating" class="filter-pill" @click="setRating('')">
              {{ currentMinRating }}+ stars
              <span class="pill-x">×</span>
            </button>
            <button v-if="currentExcludeOutOfStock" class="filter-pill" @click="setExcludeOutOfStock(false)">
              In stock only
              <span class="pill-x">×</span>
            </button>
          </div>

          <p v-if="productsLoading" class="status-text">Loading...</p>
          <p v-else-if="productsError" class="status-text">{{ productsError.message }}</p>

          <template v-else>
            <EmptyState
              v-if="products.length === 0"
              :heading="
                currentSearch ? `No results for &quot;${currentSearch}&quot;` : 'No products found'
              "
              message="Try adjusting your filters or search term."
              link-to="/"
              link-text="Clear all →"
            />

            <template v-else>
              <ul class="product-grid">
                <li v-for="product in products" :key="product.id">
                  <ProductCard :product="product" />
                </li>
              </ul>

              <PaginationControls
                :page="currentPage"
                :total="total"
                :page-size="PAGE_SIZE"
                @prev="goTo(currentPage - 1)"
                @next="goTo(currentPage + 1)"
              />
            </template>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.page {
  flex: 1;
}

.page-inner {
  max-width: 1280px;
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

/* Content layout */
.content-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 2rem;
  align-items: start;
}

/* Active filter pills */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.active-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-stone-light);
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: var(--color-mint-50);
  border: 1px solid var(--color-mint-100);
  border-radius: 20px;
  padding: 0.25rem 0.625rem;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-mint-dark);
  cursor: pointer;
  transition: background 0.15s;
}

.filter-pill:hover {
  background: var(--color-mint-100);
}

.pill-x {
  font-size: 1rem;
  line-height: 1;
  color: var(--color-mint-dark);
}

.status-text {
  color: var(--color-stone);
  font-size: 0.9375rem;
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

/* Mobile: stack filter panel above grid */
@media (max-width: 768px) {
  .content-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 640px) {
  .page-title {
    font-size: 1.75rem;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-bar > * {
    width: 100%;
  }

  .page-inner {
    padding-inline: 1rem;
    padding-block: 2rem 3rem;
  }
}
</style>
