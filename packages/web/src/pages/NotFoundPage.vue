<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue'
</script>

<template>
  <main class="page">
    <EmptyState
      heading="Page not found"
      message="The page you're looking for doesn't exist or has been moved."
      link-to="/"
      link-text="Back to home →"
    />
  </main>
</template>

<style scoped>
.page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
