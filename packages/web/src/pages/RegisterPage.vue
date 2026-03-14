<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const confirm = ref('')
const confirmError = ref<string | null>(null)

const handleSubmit = async () => {
  confirmError.value = null
  if (password.value !== confirm.value) {
    confirmError.value = 'Passwords do not match.'
    return
  }
  await authStore.register(email.value, password.value)
  if (authStore.user) router.push('/')
}
</script>

<template>
  <main class="page">
    <div class="auth-card">
      <div class="card-accent" />

      <div class="card-body">
        <div class="card-header">
          <p class="page-label">Get started</p>
          <h1 class="page-title">Create account</h1>
        </div>

        <form class="form" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field-label" for="email">Email</label>
            <BaseInput
              id="email"
              v-model="email"
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
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
              required
            />
          </div>

          <div class="field">
            <label class="field-label" for="confirm">Confirm password</label>
            <BaseInput
              id="confirm"
              v-model="confirm"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
              :error="!!confirmError"
              required
            />
          </div>

          <p v-if="confirmError" class="error-msg">{{ confirmError }}</p>
          <p v-else-if="authStore.error" class="error-msg">{{ authStore.error }}</p>

          <BaseButton
            type="submit"
            size="lg"
            full-width
            :loading="authStore.loading"
            style="margin-top: 0.25rem"
          >
            {{ authStore.loading ? 'Creating account…' : 'Create account' }}
          </BaseButton>
        </form>

        <p class="switch-text">
          Already have an account?
          <router-link to="/login" class="switch-link">Sign in →</router-link>
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
