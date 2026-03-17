<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@pinia/colada'
import { adminOrderQuery } from '@/queries/useAdminOrders'
import { formatPrice, formatDate, shortId } from '@/utils/format'
import { DataTable } from 'ui'
import type { ApiProductVariant } from 'api'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params['id'] as string)

const { data, status } = useQuery(() => adminOrderQuery(id.value))

function getVariantLabel(variant: ApiProductVariant): string {
  if (!variant.values?.length) return 'Default'
  return variant.values.map((v) => v.option.value).join(' / ')
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">
        Order <code style="font-size: 1rem">{{ shortId(id) }}</code>
      </h1>
      <button class="back-btn" @click="router.push('/orders')">← Back to Orders</button>
    </div>

    <div v-if="status === 'pending'" class="text-muted">Loading...</div>

    <template v-else-if="data">
      <div class="detail-grid section">
        <div class="card">
          <div class="section-title" style="margin-bottom: 1rem">Order Info</div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem">
            <div class="detail-field">
              <span class="detail-label">Order ID</span>
              <code class="detail-value">{{ data.id }}</code>
            </div>
            <div class="detail-field">
              <span class="detail-label">Date</span>
              <span class="detail-value">{{ formatDate(data.createdAt) }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">Customer</span>
              <span class="detail-value">
                <a class="user-link" @click="router.push(`/users/${data.user.id}`)">
                  {{ data.user.email }}
                </a>
              </span>
            </div>
          </div>
        </div>

        <div v-if="data.address" class="card">
          <div class="section-title" style="margin-bottom: 1rem">Shipping Address</div>
          <div class="address-lines">
            <div v-if="data.address.label" class="text-muted text-sm">{{ data.address.label }}</div>
            <div>{{ data.address.line1 }}</div>
            <div v-if="data.address.line2">{{ data.address.line2 }}</div>
            <div>{{ data.address.city }}, {{ data.address.state }} {{ data.address.zip }}</div>
            <div>{{ data.address.country }}</div>
          </div>
        </div>
        <div v-else class="card">
          <div class="section-title" style="margin-bottom: 0.5rem">Shipping Address</div>
          <span class="text-muted text-sm">No address provided</span>
        </div>
      </div>

      <div v-if="data.promo" class="card section">
        <div class="section-title" style="margin-bottom: 0.75rem">Promo Applied</div>
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap">
          <code>{{ data.promo.code ?? 'Automatic' }}</code>
          <span class="text-muted text-sm">{{ data.promo.description }}</span>
          <span class="badge badge-success">-{{ formatPrice(data.discountAmount) }}</span>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Items</h2>
        <div class="card" style="padding: 0; overflow: hidden">
          <DataTable>
            <template #head>
              <th>Product</th>
              <th>Variant</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </template>
            <tr v-for="item in data.orderItems" :key="item.variantId">
              <td>{{ item.variant.product.name }}</td>
              <td class="text-muted text-sm">{{ getVariantLabel(item.variant) }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ formatPrice(item.price) }}</td>
              <td>{{ formatPrice(item.price * item.quantity) }}</td>
            </tr>
          </DataTable>
        </div>
      </div>

      <div class="card section" style="max-width: 320px; margin-left: auto">
        <div class="totals">
          <div class="total-row">
            <span class="text-muted">Subtotal</span>
            <span>{{ formatPrice(data.total - data.shippingCost + data.discountAmount) }}</span>
          </div>
          <div v-if="data.discountAmount > 0" class="total-row">
            <span class="text-muted">Discount</span>
            <span style="color: #16a34a">-{{ formatPrice(data.discountAmount) }}</span>
          </div>
          <div class="total-row">
            <span class="text-muted">Shipping</span>
            <span>{{ data.shippingCost > 0 ? formatPrice(data.shippingCost) : 'Free' }}</span>
          </div>
          <div class="total-row total-row--final">
            <span>Total</span>
            <span>{{ formatPrice(data.total) }}</span>
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

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
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

.user-link {
  cursor: pointer;
  color: var(--color-mint-dark);
  text-decoration: underline;
}

.address-lines {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9375rem;
}

.totals {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9375rem;
}

.total-row--final {
  border-top: 1px solid var(--color-border);
  padding-top: 0.5rem;
  font-weight: 700;
}
</style>
