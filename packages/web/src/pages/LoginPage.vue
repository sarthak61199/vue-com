<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')

const handleSubmit = async () => {
  await authStore.login(email.value, password.value)
  if (authStore.user) {
    const redirectTo = route.query.redirectTo
    router.push(typeof redirectTo === 'string' ? redirectTo : '/')
  }
}
</script>

<template>
  <main class="page">
    <div class="auth-card">
      <div class="card-accent" />

      <div class="card-body">
        <div class="card-header">
          <p class="page-label">Welcome back</p>
          <h1 class="page-title">Sign in</h1>
        </div>

        <form class="form" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field-label" for="email">Email</label>
            <BaseInput
              id="email"
              v-model.trim="email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </div>

          <div class="field">
            <label class="field-label" for="password">Password</label>
            <BaseInput
              id="password"
              v-model.trim="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>

          <p v-if="authStore.error" class="error-msg">{{ authStore.error }}</p>

          <BaseButton
            type="submit"
            size="lg"
            full-width
            :loading="authStore.loading"
            style="margin-top: 0.25rem"
          >
            {{ authStore.loading ? 'Signing in…' : 'Sign in' }}
          </BaseButton>
        </form>

        <p class="switch-text">
          Don't have an account?
          <router-link to="/register" class="switch-link">Create one →</router-link>
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card-hover);
  overflow: hidden;
}

.card-accent {
  height: 4px;
  background: linear-gradient(90deg, var(--color-mint) 0%, var(--color-mint-dark) 100%);
}

.card-body {
  padding: 2.5rem;
}

.card-header {
  margin-bottom: 2rem;
}

.page-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-mint-dark);
  margin-bottom: 0.5rem;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.04em;
  line-height: 1;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-stone);
}

.error-msg {
  font-size: 0.875rem;
  color: var(--color-error);
  font-weight: 700;
}

.switch-text {
  font-size: 0.875rem;
  color: var(--color-stone);
  text-align: center;
}

.switch-link {
  font-weight: 700;
  color: var(--color-mint-dark);
  transition: letter-spacing 0.2s ease;
}

.switch-link:hover {
  letter-spacing: 0.04em;
}
</style>
