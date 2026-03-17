<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@pinia/colada'
import { adminUserQuery } from '@/queries/useAdminUsers'
import { formatPrice, formatDate, shortId } from '@/utils/format'
import { DataTable } from 'ui'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params['id'] as string)

const { data, status } = useQuery(() => adminUserQuery(id.value))
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">User Detail</h1>
      <button class="back-btn" @click="router.push('/users')">← Back to Users</button>
    </div>

    <div v-if="status === 'pending'" class="text-muted">Loading...</div>

    <template v-else-if="data">
      <div class="card section">
        <div style="display: flex; flex-direction: column; gap: 0.75rem">
          <div class="detail-field">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{ data.email }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Role</span>
            <span>
              <span :class="['badge', data.role === 'ADMIN' ? 'badge-info' : 'badge-success']">
                {{ data.role }}
              </span>
            </span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Joined</span>
            <span class="detail-value">{{ formatDate(data.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Orders ({{ data.orders.length }})</h2>
        <div class="card" style="padding: 0; overflow: hidden">
          <DataTable>
            <template #head>
              <th>Order ID</th>
              <th>Items</th>
              <th>Total</th>
              <th>Date</th>
            </template>
            <tr
              v-for="order in data.orders"
              :key="order.id"
              class="clickable"
              @click="router.push(`/orders/${order.id}`)"
            >
              <td><code class="text-sm">{{ shortId(order.id) }}</code></td>
              <td>{{ order._count.orderItems }}</td>
              <td>{{ formatPrice(order.total) }}</td>
              <td class="text-muted text-sm">{{ formatDate(order.createdAt) }}</td>
            </tr>
            <tr v-if="data.orders.length === 0">
              <td colspan="4" class="text-muted text-sm" style="text-align: center; padding: 1rem">
                No orders
              </td>
            </tr>
          </DataTable>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Reviews ({{ data.reviews.length }})</h2>
        <div class="card" style="padding: 0; overflow: hidden">
          <DataTable>
            <template #head>
              <th>Product</th>
              <th>Rating</th>
              <th>Body</th>
              <th>Date</th>
            </template>
            <tr v-for="review in data.reviews" :key="review.id">
              <td>{{ review.product.name }}</td>
              <td>{{ review.rating }} / 5</td>
              <td class="text-muted text-sm truncate">{{ review.body ?? '—' }}</td>
              <td class="text-muted text-sm">{{ formatDate(review.createdAt) }}</td>
            </tr>
            <tr v-if="data.reviews.length === 0">
              <td colspan="4" class="text-muted text-sm" style="text-align: center; padding: 1rem">
                No reviews
              </td>
            </tr>
          </DataTable>
        </div>
      </div>

      <div v-if="data.addresses.length > 0" class="section">
        <h2 class="section-title">Addresses</h2>
        <div style="display: flex; flex-direction: column; gap: 0.75rem">
          <div v-for="address in data.addresses" :key="address.id" class="card">
            <div v-if="address.label" class="text-muted text-sm" style="margin-bottom: 0.25rem">
              {{ address.label }}
            </div>
            <div>{{ address.line1 }}</div>
            <div v-if="address.line2">{{ address.line2 }}</div>
            <div>{{ address.city }}, {{ address.state }} {{ address.zip }}</div>
            <div>{{ address.country }}</div>
          </div>
        </div>
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

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--color-stone);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-value {
  font-size: 0.9375rem;
  color: var(--color-charcoal);
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
</style>
