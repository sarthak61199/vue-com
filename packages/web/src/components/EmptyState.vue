<script setup lang="ts">
defineProps<{
  heading: string
  message: string
  linkTo: string
  linkText: string
}>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-glyph" aria-hidden="true">○</div>
    <h2 class="empty-heading">{{ heading }}</h2>
    <p class="empty-message">{{ message }}</p>
    <router-link :to="linkTo" class="empty-link">{{ linkText }}</router-link>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 5rem 1.5rem;
  gap: 0;
}

.empty-glyph {
  font-size: 4rem;
  line-height: 1;
  color: var(--color-mint);
  margin-bottom: 1.5rem;
  opacity: 0.6;
  letter-spacing: -0.05em;
}

.empty-heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.03em;
  margin-bottom: 0.5rem;
}

.empty-message {
  font-size: 0.9375rem;
  color: var(--color-stone);
  margin-bottom: 1.75rem;
}

.empty-link {
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-mint-dark);
  transition: letter-spacing 0.2s ease;
}

.empty-link:hover {
  letter-spacing: 0.12em;
}
</style>
