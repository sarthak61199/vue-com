<script setup lang="ts">
import { ref } from 'vue'
import { useQuery, useMutation, useQueryCache } from '@pinia/colada'
import { useRouter } from 'vue-router'
import { adminPromosQuery } from '@/queries/useAdminPromos'
import { adminApi } from 'api'
import type { ApiAdminPromo } from 'api'
import { formatDate, formatDiscountValue } from '@/utils/format'
import { DataTable } from 'ui'

const router = useRouter()
const queryCache = useQueryCache()

const { data, status } = useQuery(adminPromosQuery)

const deletingId = ref<string | null>(null)
const deleteError = ref<string | null>(null)
const togglingId = ref<string | null>(null)

const { mutateAsync: toggleActive } = useMutation({
  mutation: (promo: ApiAdminPromo) =>
    adminApi.updatePromo(promo.id, { isActive: !promo.isActive }),
  onSettled: () => queryCache.invalidateQueries({ key: ['admin', 'promos'] }),
})

const { mutateAsync: deletePromo } = useMutation({
  mutation: (id: string) => adminApi.deletePromo(id),
  onSettled: () => queryCache.invalidateQueries({ key: ['admin', 'promos'] }),
})

async function handleToggle(promo: ApiAdminPromo) {
  togglingId.value = promo.id
  try {
    await toggleActive(promo)
  } finally {
    togglingId.value = null
  }
}

async function handleDelete(id: string) {
  deleteError.value = null
  try {
    await deletePromo(id)
    deletingId.value = null
  } catch (e: unknown) {
    deleteError.value = e instanceof Error ? e.message : 'Failed to delete'
  }
}

function formatScope(promo: ApiAdminPromo): string {
  if (promo.scope === 'PRODUCT' && promo.product) return `Product: ${promo.product.name}`
  if (promo.scope === 'CATEGORY' && promo.category) return `Category: ${promo.category.name}`
  return 'Order'
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Promos</h1>
      <button class="btn-primary" @click="router.push('/promos/new')">+ New Promo</button>
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
            <th>Code</th>
            <th>Description</th>
            <th>Discount</th>
            <th>Scope</th>
            <th>Active</th>
            <th>Uses</th>
            <th>Expires</th>
            <th style="width: 120px">Actions</th>
          </template>

          <tr v-for="promo in data" :key="promo.id">
            <td>
              <code v-if="promo.code" class="text-sm">{{ promo.code }}</code>
              <span v-else class="badge badge-info">Automatic</span>
            </td>
            <td class="text-sm">{{ promo.description }}</td>
            <td class="text-sm">{{ formatDiscountValue(promo.discountType, promo.discountValue) }}</td>
            <td class="text-sm text-muted">{{ formatScope(promo) }}</td>
            <td>
              <button
                :class="['badge', 'badge-toggle', promo.isActive ? 'badge-success' : 'badge-muted']"
                :disabled="togglingId === promo.id"
                :title="promo.isActive ? 'Click to deactivate' : 'Click to activate'"
                @click="handleToggle(promo)"
              >
                {{ promo.isActive ? 'Active' : 'Inactive' }}
              </button>
            </td>
            <td class="text-sm text-muted">{{ promo._count.usages }}</td>
            <td class="text-sm text-muted">
              {{ promo.expiresAt ? formatDate(promo.expiresAt) : '—' }}
            </td>
            <td>
              <div v-if="deletingId === promo.id" class="confirm-row">
                <button class="action-btn action-btn--danger" @click="handleDelete(promo.id)">Yes, delete</button>
                <button class="action-btn" @click="deletingId = null; deleteError = null">Cancel</button>
              </div>
              <div v-else class="action-row">
                <button class="action-btn" @click="router.push(`/promos/${promo.id}`)">Edit</button>
                <button class="action-btn action-btn--danger" @click="deletingId = promo.id; deleteError = null">Delete</button>
              </div>
            </td>
          </tr>

          <tr v-if="data.length === 0">
            <td colspan="8" class="text-muted text-sm" style="text-align: center; padding: 1.5rem">
              No promos found
            </td>
          </tr>
        </DataTable>
      </div>
    </template>
  </div>
</template>

<style scoped>
.btn-primary {
  padding: 0.5rem 1rem;
  background: var(--color-charcoal);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}

.btn-primary:hover {
  opacity: 0.85;
}

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

.badge-toggle {
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: opacity 0.15s;
}

.badge-toggle:hover:not(:disabled) {
  opacity: 0.75;
}

.badge-toggle:disabled {
  cursor: wait;
  opacity: 0.6;
}

.badge-muted {
  background: #f3f4f6;
  color: var(--color-stone);
}

.action-row,
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
  transition: border-color 0.15s, color 0.15s;
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
</style>
