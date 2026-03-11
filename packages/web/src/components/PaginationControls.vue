<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ page: number; total: number; pageSize: number }>()
const emit = defineEmits<{ (e: 'prev'): void; (e: 'next'): void }>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))
</script>

<template>
  <div class="pagination">
    <button class="pagination-btn" :disabled="page <= 1" @click="emit('prev')">← Prev</button>
    <span class="pagination-info">Page {{ page }} of {{ totalPages }}</span>
    <button class="pagination-btn" :disabled="page >= totalPages" @click="emit('next')">
      Next →
    </button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 3rem;
}

.pagination-btn {
  padding: 0.625rem 1.25rem;
  background: var(--color-charcoal);
  color: white;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-mint-dark);
}

.pagination-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--color-stone);
  font-weight: 700;
  letter-spacing: 0.04em;
}
</style>
