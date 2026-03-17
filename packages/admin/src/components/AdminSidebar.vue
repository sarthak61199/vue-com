<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const navLinks = [
  { label: 'Dashboard', to: '/' },
  { label: 'Orders', to: '/orders' },
  { label: 'Users', to: '/users' },
  { label: 'Promos', to: '/promos' },
  { label: 'Reviews', to: '/reviews' },
]

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <span class="sidebar-logo">🌿</span>
      <span class="sidebar-title">Plant Shop<br /><small>Admin</small></span>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="sidebar-link"
        active-class="sidebar-link--active"
        exact-active-class="sidebar-link--active"
      >
        {{ link.label }}
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <span class="sidebar-user">{{ authStore.user?.email }}</span>
      <button class="sidebar-logout" @click="handleLogout">Logout</button>
    </div>
  </aside>
</template>

<style scoped>
aside {
  width: 220px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-logo {
  font-size: 1.375rem;
  line-height: 1;
}

.sidebar-title {
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.2;
}

.sidebar-title small {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-stone);
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.75rem 0;
}

.sidebar-link {
  display: block;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  color: var(--color-stone);
  text-decoration: none;
  border-radius: 6px;
  margin: 0 0.5rem;
  transition: background 0.15s, color 0.15s;
}

.sidebar-link:hover {
  background: var(--color-cream);
  color: var(--color-charcoal);
}

.sidebar-link--active {
  background: var(--color-cream);
  color: var(--color-mint-dark);
  font-weight: 600;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-user {
  font-size: 0.8rem;
  color: var(--color-stone);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-logout {
  background: none;
  border: 1px solid var(--color-border);
  padding: 0.375rem 0.625rem;
  border-radius: 5px;
  font-size: 0.8125rem;
  cursor: pointer;
  color: var(--color-stone);
  font-family: inherit;
  transition: border-color 0.15s, color 0.15s;
}

.sidebar-logout:hover {
  border-color: var(--color-charcoal);
  color: var(--color-charcoal);
}
</style>
