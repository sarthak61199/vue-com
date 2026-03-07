<script setup lang="ts"></script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <span class="footer-brand">Store.</span>
      <p class="footer-copy">© 2026 Store. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border);
  background: white;
  margin-top: auto;
}

.footer-inner {
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 1.5rem;
  padding-block: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-brand {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.02em;
}

.footer-copy {
  font-size: 0.8125rem;
  color: var(--color-stone-light);
}
</style>
