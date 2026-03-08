<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { computed } from 'vue'

const cartStore = useCartStore()

const cartItemCount = computed(() =>
  cartStore.cartItems.reduce((acc, item) => acc + item.quantity, 0),
)
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <router-link to="/" class="logo">Store.</router-link>
      <nav class="nav">
        <router-link to="/orders" class="nav-link">My Orders</router-link>
        <router-link to="/cart" class="nav-link cart-link">
          <span>Cart</span>
          <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
        </router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.03em;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-charcoal);
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--color-mint-dark);
}

.cart-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding-inline: 4px;
  background: var(--color-mint);
  color: var(--color-charcoal);
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 10px;
}
</style>
