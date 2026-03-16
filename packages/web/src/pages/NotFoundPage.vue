<script setup lang="ts">
import { EmptyState } from 'ui'
</script>

<template>
  <main class="page">
    <EmptyState
      heading="Page not found"
      message="The page you're looking for doesn't exist or has been moved."
    >
      <template #action>
        <router-link to="/" class="empty-link">Back to home →</router-link>
      </template>
    </EmptyState>
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
