<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryCache } from '@pinia/colada'
import { adminApi } from 'api'
import type { ApiCreatePromoInput } from 'api'
import { adminPromoQuery } from '@/queries/useAdminPromos'
import PromoForm from '@/components/PromoForm.vue'
import { formatDate, formatPrice, shortId } from '@/utils/format'
import { DataTable } from 'ui'

const route = useRoute()
const router = useRouter()
const queryCache = useQueryCache()

const id = computed(() => route.params['id'] as string)
const { data, status } = useQuery(() => adminPromoQuery(id.value))

const submitError = ref<string | null>(null)

const { mutateAsync: updatePromo, isLoading } = useMutation({
  mutation: (payload: { id: string; data: Partial<ApiCreatePromoInput> }) =>
    adminApi.updatePromo(payload.id, payload.data),
  onSettled: () => {
    queryCache.invalidateQueries({ key: ['admin', 'promos'] })
  },
})

async function handleSubmit(values: ApiCreatePromoInput) {
  submitError.value = null
  try {
    await updatePromo({ id: id.value, data: values })
    router.push('/promos')
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Failed to update promo'
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">
        Edit Promo
        <code v-if="data?.code" style="font-size: 1rem; margin-left: 0.5rem">{{ data.code }}</code>
        <span v-else-if="data" class="badge badge-info"
          style="font-size: 0.8125rem; margin-left: 0.5rem; vertical-align: middle">Automatic</span>
      </h1>
      <button class="back-btn" @click="router.push('/promos')">← Back to Promos</button>
    </div>

    <div v-if="status === 'pending'" class="text-muted">Loading...</div>

    <template v-else-if="data">
      <div class="card section" style="max-width: 760px">
        <p v-if="submitError" class="submit-error">{{ submitError }}</p>
        <PromoForm :initial="data" :is-submitting="isLoading" submit-label="Save Changes" @submit="handleSubmit" />
      </div>

      <!-- Usage history -->
      <div v-if="data.usages.length > 0" class="section">
        <h2 class="section-title">Recent Usage (last {{ data.usages.length }})</h2>
        <div class="card" style="padding: 0; overflow: hidden">
          <DataTable>
            <template #head>
              <th>User</th>
              <th>Order ID</th>
              <th>Order Total</th>
              <th>Date</th>
            </template>
            <tr v-for="usage in data.usages" :key="usage.id">
              <td class="text-sm">{{ usage.user.email }}</td>
              <td>
                <code class="text-sm order-link" @click="router.push(`/orders/${usage.order.id}`)">
      {{ shortId(usage.order.id) }}
    </code>
              </td>
              <td class="text-sm">{{ formatPrice(usage.order.total) }}</td>
              <td class="text-sm text-muted">{{ formatDate(usage.createdAt) }}</td>
            </tr>
          </DataTable>
        </div>
      </div>
      <div v-else class="section">
        <p class="text-muted text-sm">No usages yet.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.section {
  margin-top: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-charcoal);
  margin-bottom: 0.75rem;
}

.back-btn {
  background: none;
  border: 1px solid var(--color-border);
  padding: 0.375rem 0.75rem;
  border-radius: 5px;
  font-size: 0.875rem;
  cursor: pointer;
  color: var(--color-stone);
  font-family: inherit;
  transition: color 0.15s, border-color 0.15s;
}

.back-btn:hover {
  color: var(--color-charcoal);
  border-color: var(--color-charcoal);
}

.submit-error {
  background: #fee2e2;
  color: #991b1b;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.order-link {
  cursor: pointer;
  color: var(--color-mint-dark);
  text-decoration: underline;
}
</style>
