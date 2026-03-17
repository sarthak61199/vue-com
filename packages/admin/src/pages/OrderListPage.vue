<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@pinia/colada'
import { useRouter } from 'vue-router'
import { adminOrdersQuery } from '@/queries/useAdminOrders'
import { useDebounce } from '@/composables/useDebounce'
import { formatPrice, formatDate, shortId } from '@/utils/format'
import { DataTable, PaginationControls } from 'ui'

const router = useRouter()
const page = ref(1)
const searchInput = ref('')
const search = useDebounce(searchInput)

const filters = computed(() => ({ page: page.value, search: search.value || undefined }))
const { data, status } = useQuery(() => adminOrdersQuery(filters.value))

function onSearch() {
  page.value = 1
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Orders</h1>
      <div class="search-bar">
        <input
          v-model="searchInput"
          placeholder="Search by email…"
          @input="onSearch"
        />
      </div>
    </div>

    <div v-if="status === 'pending'" class="text-muted">Loading...</div>

    <template v-else-if="data">
      <div class="card" style="padding: 0; overflow: hidden">
        <DataTable>
          <template #head>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Discount</th>
            <th>Date</th>
          </template>
          <tr
            v-for="order in data.orders"
            :key="order.id"
            class="clickable"
            @click="router.push(`/orders/${order.id}`)"
          >
            <td><code class="text-sm">{{ shortId(order.id) }}</code></td>
            <td>{{ order.user.email }}</td>
            <td>{{ order._count.orderItems }}</td>
            <td>{{ formatPrice(order.total) }}</td>
            <td>
              <span v-if="order.discountAmount > 0" class="badge badge-success">
                -{{ formatPrice(order.discountAmount) }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="text-muted text-sm">{{ formatDate(order.createdAt) }}</td>
          </tr>
          <tr v-if="data.orders.length === 0">
            <td colspan="6" class="text-muted text-sm" style="text-align: center; padding: 1.5rem">
              No orders found
            </td>
          </tr>
        </DataTable>
      </div>

      <PaginationControls :page="page" :total="data.total" :page-size="20" @prev="page--" @next="page++" />
    </template>
  </div>
</template>
