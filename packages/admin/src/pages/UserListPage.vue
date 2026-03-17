<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@pinia/colada'
import { useRouter } from 'vue-router'
import { adminUsersQuery } from '@/queries/useAdminUsers'
import { useDebounce } from '@/composables/useDebounce'
import { formatDate } from '@/utils/format'
import { DataTable, PaginationControls } from 'ui'

const router = useRouter()
const page = ref(1)
const searchInput = ref('')
const search = useDebounce(searchInput)

const filters = computed(() => ({ page: page.value, search: search.value || undefined }))
const { data, status } = useQuery(() => adminUsersQuery(filters.value))

function onSearch() {
  page.value = 1
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Users</h1>
      <div class="search-bar">
        <input v-model="searchInput" placeholder="Search by email…" @input="onSearch" />
      </div>
    </div>

    <div v-if="status === 'pending'" class="text-muted">Loading...</div>

    <template v-else-if="data">
      <div class="card" style="padding: 0; overflow: hidden">
        <DataTable>
          <template #head>
            <th>Email</th>
            <th>Role</th>
            <th>Orders</th>
            <th>Reviews</th>
            <th>Joined</th>
          </template>
          <tr v-for="user in data.users" :key="user.id" class="clickable" @click="router.push(`/users/${user.id}`)">
            <td>{{ user.email }}</td>
            <td>
              <span :class="['badge', user.role === 'ADMIN' ? 'badge-info' : 'badge-success']">
                {{ user.role }}
              </span>
            </td>
            <td>{{ user._count.orders }}</td>
            <td>{{ user._count.reviews }}</td>
            <td class="text-muted text-sm">{{ formatDate(user.createdAt) }}</td>
          </tr>
          <tr v-if="data.users.length === 0">
            <td colspan="5" class="text-muted text-sm" style="text-align: center; padding: 1.5rem">
              No users found
            </td>
          </tr>
        </DataTable>
      </div>

      <PaginationControls :page="page" :total="data.total" :page-size="20" @prev="page--" @next="page++" />
    </template>
  </div>
</template>
