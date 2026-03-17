<template>
  <table class="data-table">
    <thead>
      <tr>
        <slot name="head" />
      </tr>
    </thead>
    <tbody>
      <slot />
    </tbody>
  </table>
</template>

<style scoped>
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table :deep(th) {
  text-align: left;
  padding: 0.625rem 0.75rem;
  font-weight: 600;
  color: var(--color-stone);
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
}

.data-table :deep(td) {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.data-table :deep(tbody tr:hover) {
  background: var(--color-cream);
}

.data-table :deep(tbody tr.clickable) {
  cursor: pointer;
}
</style>
