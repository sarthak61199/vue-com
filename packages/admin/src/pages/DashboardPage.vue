<script setup lang="ts">
import { useQuery } from '@pinia/colada'
import { dashboardStatsQuery } from '@/queries/useDashboard'
import { formatPrice, formatDate, shortId } from '@/utils/format'
import { DataTable } from 'ui'
import type { ApiAdminVariantSummary } from 'api'

const { data, status } = useQuery(dashboardStatsQuery)

function getVariantLabel(v: ApiAdminVariantSummary): string {
  const options = v.values.map((val) => val.option.value).join(' / ')
  return options || 'Default'
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
    </div>

    <div v-if="status === 'pending'" class="text-muted">Loading...</div>

    <template v-else-if="data">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Products</div>
          <div class="stat-value">{{ data.totalProducts }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Orders</div>
          <div class="stat-value">{{ data.totalOrders }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Users</div>
          <div class="stat-value">{{ data.totalUsers }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Revenue</div>
          <div class="stat-value">{{ formatPrice(data.totalRevenue) }}</div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Recent Orders</h2>
        <div class="card" style="padding: 0; overflow: hidden">
          <DataTable>
            <template #head>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Date</th>
            </template>
            <tr
              v-for="order in data.recentOrders"
              :key="order.id"
              class="clickable"
              @click="$router.push(`/orders/${order.id}`)"
            >
              <td><code class="text-sm">{{ shortId(order.id) }}</code></td>
              <td>{{ order.user.email }}</td>
              <td>{{ order._count.orderItems }}</td>
              <td>{{ formatPrice(order.total) }}</td>
              <td class="text-muted text-sm">{{ formatDate(order.createdAt) }}</td>
            </tr>
            <tr v-if="data.recentOrders.length === 0">
              <td colspan="5" class="text-muted text-sm" style="text-align: center; padding: 1.5rem">
                No orders yet
              </td>
            </tr>
          </DataTable>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Low Stock Alerts</h2>
        <div class="card" style="padding: 0; overflow: hidden">
          <DataTable>
            <template #head>
              <th>Product</th>
              <th>Variant</th>
              <th>Stock</th>
              <th>Price</th>
            </template>
            <tr v-for="variant in data.lowStockVariants" :key="variant.id">
              <td>{{ variant.product.name }}</td>
              <td>{{ getVariantLabel(variant) }}</td>
              <td>
                <span :class="['badge', variant.stock === 0 ? 'badge-danger' : 'badge-warning']">
                  {{ variant.stock === 0 ? 'Out of stock' : `${variant.stock} left` }}
                </span>
              </td>
              <td>{{ formatPrice(variant.price) }}</td>
            </tr>
            <tr v-if="data.lowStockVariants.length === 0">
              <td colspan="4" class="text-muted text-sm" style="text-align: center; padding: 1.5rem">
                All variants have sufficient stock
              </td>
            </tr>
          </DataTable>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--color-stone);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.375rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.section {
  margin-top: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-charcoal);
  margin-bottom: 0.75rem;
}
</style>
