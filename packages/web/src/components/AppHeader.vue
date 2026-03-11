<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'

const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()

const cartItemCount = computed(() =>
  cartStore.cartItems.reduce((acc, item) => acc + item.quantity, 0),
)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const menuOpen = ref(false)
const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}
const route = useRoute()
watch(() => route.path, () => {
  menuOpen.value = false
})
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <router-link to="/" class="logo">Store.</router-link>
      <button class="hamburger" @click="toggleMenu">
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>
      <nav class="nav" :class="{ 'nav-open': menuOpen }">
        <router-link to="/cart" class="nav-link cart-link">
          <span>Cart</span>
          <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
        </router-link>
        <template v-if="authStore.user">
          <span class="user-email">{{ authStore.user.email }}</span>
          <router-link to="/wishlist" class="nav-link">Wishlist</router-link>
          <router-link to="/profile" class="nav-link">Profile</router-link>
          <button class="nav-btn" @click="handleLogout">Sign out</button>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-link">Sign in</router-link>
        </template>
      </nav>
    </div>
    <div v-if="menuOpen" class="nav-overlay" @click="menuOpen = false"></div>
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

.user-email {
  font-size: 0.8125rem;
  color: var(--color-stone);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-btn {
  background: none;
  border: none;
  padding: 0;
  font-family: 'Titillium Web', sans-serif;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-charcoal);
  cursor: pointer;
  transition: color 0.2s ease;
}

.nav-btn:hover {
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

.hamburger {
  display: none;
}

@media (max-width: 640px) {
  .hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    z-index: 110;
  }

  .hamburger-bar {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--color-charcoal);
    border-radius: 2px;
  }

  .nav {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 75vw;
    max-width: 300px;
    background: white;
    border-left: 1px solid var(--color-border);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 5rem 1.5rem 2rem;
    transform: translateX(100%);
    transition: transform 0.25s ease;
    z-index: 105;
  }

  .nav.nav-open {
    transform: translateX(0);
  }

  .nav-link {
    padding: 0.875rem 0;
    border-bottom: 1px solid var(--color-border);
    width: 100%;
    font-size: 0.875rem;
  }

  .nav-btn {
    padding: 0.875rem 0;
    border-bottom: 1px solid var(--color-border);
    width: 100%;
    text-align: left;
    font-size: 0.875rem;
  }

  .user-email {
    max-width: none;
    padding: 0.875rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .nav-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 100;
  }
}
</style>
