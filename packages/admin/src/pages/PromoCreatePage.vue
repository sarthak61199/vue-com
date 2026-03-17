<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQueryCache } from '@pinia/colada'
import { adminApi } from 'api'
import type { ApiCreatePromoInput } from 'api'
import PromoForm from '@/components/PromoForm.vue'

const router = useRouter()
const queryCache = useQueryCache()

const submitError = ref<string | null>(null)

const { mutateAsync: createPromo, isLoading } = useMutation({
  mutation: (data: ApiCreatePromoInput) => adminApi.createPromo(data),
  onSettled: () => queryCache.invalidateQueries({ key: ['admin', 'promos'] }),
})

async function handleSubmit(values: ApiCreatePromoInput) {
  submitError.value = null
  try {
    const promo = await createPromo(values)
    router.push(`/promos/${promo.id}`)
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Failed to create promo'
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">New Promo</h1>
      <button class="back-btn" @click="router.push('/promos')">← Back to Promos</button>
    </div>

    <div class="card" style="max-width: 760px">
      <p v-if="submitError" class="submit-error">{{ submitError }}</p>
      <PromoForm :is-submitting="isLoading" submit-label="Create Promo" @submit="handleSubmit" />
    </div>
  </div>
</template>

<style scoped>
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
</style>
