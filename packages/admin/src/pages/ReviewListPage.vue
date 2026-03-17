<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery, useMutation, useQueryCache } from '@pinia/colada'
import { adminReviewsQuery } from '@/queries/useAdminReviews'
import { adminApi } from 'api'
import { formatDate } from '@/utils/format'
import { DataTable, PaginationControls } from 'ui'

const queryCache = useQueryCache()

const page = ref(1)
const minRating = ref<number | undefined>(undefined)
const maxRating = ref<number | undefined>(undefined)

const filters = computed(() => ({
  page: page.value,
  minRating: minRating.value,
  maxRating: maxRating.value,
}))

const { data, status } = useQuery(() => adminReviewsQuery(filters.value))

const deletingId = ref<string | null>(null)
const deleteError = ref<string | null>(null)

const { mutateAsync: deleteReview } = useMutation({
  mutation: (id: string) => adminApi.deleteReview(id),
  onSettled: () => queryCache.invalidateQueries({ key: ['admin', 'reviews'] }),
})

async function handleDelete(id: string) {
  deleteError.value = null
  try {
    await deleteReview(id)
    deletingId.value = null
  } catch (e: unknown) {
    deleteError.value = e instanceof Error ? e.message : 'Failed to delete review'
    deletingId.value = null
  }
}

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

    <div v-if="deleteError" class="error-banner">
      {{ deleteError }}
      <button class="error-close" @click="deleteError = null">✕</button>
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
            <th style="width: 120px">Actions</th>
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
            <td>
              <div v-if="deletingId === review.id" class="confirm-row">
                <button class="action-btn action-btn--danger" @click="handleDelete(review.id)">Yes</button>
                <button class="action-btn" @click="deletingId = null">Cancel</button>
              </div>
              <button v-else class="action-btn action-btn--danger" @click="deletingId = review.id">Delete</button>
            </td>
          </tr>
          <tr v-if="data.reviews.length === 0">
            <td colspan="6" class="text-muted text-sm" style="text-align: center; padding: 1.5rem">
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
.error-banner {
  background: #fee2e2;
  color: #991b1b;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.error-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #991b1b;
  font-size: 1rem;
  padding: 0;
  line-height: 1;
}

.confirm-row {
  display: flex;
  gap: 0.375rem;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: white;
  color: var(--color-charcoal);
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: border-color 0.15s;
}

.action-btn:hover {
  border-color: var(--color-charcoal);
}

.action-btn--danger {
  color: #991b1b;
  border-color: #fca5a5;
}

.action-btn--danger:hover {
  background: #fee2e2;
  border-color: #991b1b;
}

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
