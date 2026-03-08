<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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
            <input
              id="email"
              v-model="email"
              type="email"
              class="field-input"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </div>

          <div class="field">
            <label class="field-label" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="field-input"
              placeholder="••••••••"
              autocomplete="new-password"
              required
            />
          </div>

          <div class="field">
            <label class="field-label" for="confirm">Confirm password</label>
            <input
              id="confirm"
              v-model="confirm"
              type="password"
              class="field-input"
              :class="{ 'field-input--error': confirmError }"
              placeholder="••••••••"
              autocomplete="new-password"
              required
            />
          </div>

          <p v-if="confirmError" class="error-msg">{{ confirmError }}</p>
          <p v-else-if="authStore.error" class="error-msg">{{ authStore.error }}</p>

          <button type="submit" class="submit-btn" :disabled="authStore.loading">
            <span v-if="authStore.loading" class="spinner" />
            <span>{{ authStore.loading ? 'Creating account…' : 'Create account' }}</span>
          </button>
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

/* Form */
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

.field-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: 'Titillium Web', sans-serif;
  font-size: 1rem;
  color: var(--color-charcoal);
  background: var(--color-cream);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.field-input::placeholder {
  color: var(--color-stone-light);
}

.field-input:focus {
  border-color: var(--color-mint);
  box-shadow: 0 0 0 3px var(--color-mint-50);
  background: white;
}

.field-input--error {
  border-color: #d94f4f;
  box-shadow: 0 0 0 3px rgba(217, 79, 79, 0.1);
}

.error-msg {
  font-size: 0.875rem;
  color: #d94f4f;
  font-weight: 700;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.9375rem;
  background: var(--color-mint);
  color: var(--color-charcoal);
  font-family: 'Titillium Web', sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease;
  margin-top: 0.25rem;
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-mint-dark);
  color: white;
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(26, 32, 40, 0.2);
  border-top-color: var(--color-charcoal);
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Switch */
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
