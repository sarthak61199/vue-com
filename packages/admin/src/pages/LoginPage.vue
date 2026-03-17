<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useForm } from '@tanstack/vue-form'
import { LoginSchema } from 'schemas'
import { BaseButton, BaseInput } from 'ui'

const authStore = useAuthStore()
const router = useRouter()

const form = useForm({
  defaultValues: { email: '', password: '' },
  validators: { onChange: LoginSchema },
  onSubmit: async ({ value }) => {
    await authStore.login(value.email, value.password)
    if (authStore.user) {
      router.push('/')
    }
  },
})
</script>

<template>
  <main class="page">
    <div class="login-card">
      <div class="card-accent" />

      <div class="card-body">
        <div class="card-header">
          <p class="page-label">Plant Shop</p>
          <h1 class="card-title">Admin Sign in</h1>
        </div>

        <form class="form" @submit.prevent="form.handleSubmit">
          <form.Field name="email">
            <template #default="{ field }">
              <div class="field">
                <label class="field-label" :for="field.name">Email</label>
                <BaseInput
                  :id="field.name"
                  placeholder="admin@plantshop.com"
                  autocomplete="email"
                  :value="field.state.value"
                  :error="field.state.meta.isTouched && !field.state.meta.isValid"
                  @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
                  @blur="field.handleBlur"
                />
                <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="error-msg">
                  {{ field.state.meta.errors[0].message }}
                </p>
              </div>
            </template>
          </form.Field>

          <form.Field name="password">
            <template #default="{ field }">
              <div class="field">
                <label class="field-label" :for="field.name">Password</label>
                <BaseInput
                  :id="field.name"
                  type="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  :value="field.state.value"
                  :error="field.state.meta.isTouched && !field.state.meta.isValid"
                  @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
                  @blur="field.handleBlur"
                />
                <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="error-msg">
                  {{ field.state.meta.errors[0].message }}
                </p>
              </div>
            </template>
          </form.Field>

          <p v-if="authStore.error" class="error-msg">{{ authStore.error }}</p>

          <form.Subscribe>
            <template #default="{ canSubmit, isSubmitting }">
              <BaseButton
                type="submit"
                size="lg"
                full-width
                :loading="isSubmitting || authStore.loading"
                :disabled="!canSubmit"
                style="margin-top: 0.25rem"
              >
                {{ isSubmitting || authStore.loading ? 'Signing in…' : 'Sign in' }}
              </BaseButton>
            </template>
          </form.Subscribe>
        </form>
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
  min-height: 100vh;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card-hover);
  overflow: hidden;
}

.card-accent {
  height: 4px;
  background: linear-gradient(90deg, var(--color-mint) 0%, var(--color-mint-dark) 100%);
}

.card-body {
  padding: 2.25rem 2rem;
}

.card-header {
  margin-bottom: 1.75rem;
}

.page-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-mint-dark);
  margin-bottom: 0.375rem;
}

.card-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.03em;
  line-height: 1;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
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
  font-weight: 600;
}
</style>
