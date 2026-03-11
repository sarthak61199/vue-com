<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    rating: number | null
    count?: number
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)

const filled = computed(() => (props.rating != null ? Math.round(props.rating) : 0))
</script>

<template>
  <div class="star-rating" :class="size">
    <span
      v-for="n in 5"
      :key="n"
      class="star"
      :class="n <= filled ? 'star--filled' : 'star--empty'"
      aria-hidden="true"
      >{{ n <= filled ? '★' : '☆' }}</span
    >
    <span v-if="count !== undefined" class="star-count">({{ count }})</span>
  </div>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 0.1em;
}

.star {
  line-height: 1;
}

.star--filled {
  color: var(--color-mint-dark);
}

.star--empty {
  color: var(--color-stone);
  opacity: 0.4;
}

.star-count {
  color: var(--color-stone);
  margin-left: 0.25em;
}

.sm .star {
  font-size: 0.8rem;
}

.sm .star-count {
  font-size: 0.75rem;
}

.md .star {
  font-size: 1rem;
}

.md .star-count {
  font-size: 0.875rem;
}
</style>
