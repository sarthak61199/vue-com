<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@pinia/colada'
import { adminReviewsQuery } from '@/queries/useAdminReviews'
import { formatDate } from '@/utils/format'
import { DataTable, PaginationControls } from 'ui'

const page = ref(1)
const minRating = ref<number | undefined>(undefined)
const maxRating = ref<number | undefined>(undefined)

const filters = computed(() => ({
  page: page.value,
  minRating: minRating.value,
  maxRating: maxRating.value,
}))

const { data, status } = useQuery(() => adminReviewsQuery(filters.value))

function onFilterChange() {
  page.value = 1
}

const ratingOptions = [1, 2, 3, 4, 5]
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Reviews</h1>
      <div style="display: flex; gap: 0.75rem; align-items: center">
        <label class="text-sm text-muted">Min rating:</label>
        <select v-model="minRating" class="filter-select" @change="onFilterChange">
          <option :value="undefined">Any</option>
          <option v-for="r in ratingOptions" :key="r" :value="r">{{ r }}</option>
        </select>
        <label class="text-sm text-muted">Max rating:</label>
        <select v-model="maxRating" class="filter-select" @change="onFilterChange">
          <option :value="undefined">Any</option>
          <option v-for="r in ratingOptions" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
    </div>

    <div v-if="status === 'pending'" class="text-muted">Loading...</div>

    <template v-else-if="data">
      <div class="card" style="padding: 0; overflow: hidden">
        <DataTable>
          <template #head>
            <th>Product</th>
            <th>Customer</th>
            <th>Rating</th>
            <th>Body</th>
            <th>Date</th>
          </template>
          <tr v-for="review in data.reviews" :key="review.id">
            <td>{{ review.product.name }}</td>
            <td class="text-sm">{{ review.user.email }}</td>
            <td>
              <span :class="[
                'badge',
                review.rating >= 4 ? 'badge-success' : review.rating === 3 ? 'badge-warning' : 'badge-danger',
              ]">
                {{ review.rating }} / 5
              </span>
            </td>
            <td class="text-muted text-sm truncate">{{ review.body ?? '—' }}</td>
            <td class="text-muted text-sm">{{ formatDate(review.createdAt) }}</td>
          </tr>
          <tr v-if="data.reviews.length === 0">
            <td colspan="5" class="text-muted text-sm" style="text-align: center; padding: 1.5rem">
              No reviews found
            </td>
          </tr>
        </DataTable>
      </div>

      <PaginationControls :page="page" :total="data.total" :page-size="20" @prev="page--" @next="page++" />
    </template>
  </div>
</template>

<style scoped>
.filter-select {
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  font-size: 0.875rem;
  background: white;
  color: var(--color-charcoal);
  font-family: inherit;
  cursor: pointer;
}
</style>
