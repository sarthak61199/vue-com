<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useForm } from '@tanstack/vue-form'
import { RegisterSchema } from 'schemas'
import { BaseButton, BaseInput } from 'ui'

const authStore = useAuthStore()
const router = useRouter()

const form = useForm({
  defaultValues: { email: '', password: '', confirm: '' },
  validators: { onChange: RegisterSchema },
  onSubmit: async ({ value }) => {
    await authStore.register(value.email, value.password)
    if (authStore.user) router.push('/')
  },
})
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

        <form class="form" @submit.prevent="form.handleSubmit">
          <form.Field name="email">
            <template #default="{ field }">
              <div class="field">
                <label class="field-label" :for="field.name">Email</label>
                <BaseInput :id="field.name" type="email" placeholder="you@example.com" autocomplete="email"
                  :value="field.state.value" :error="field.state.meta.isTouched && !field.state.meta.isValid"
                  @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
                  @blur="field.handleBlur" />
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
                <BaseInput :id="field.name" type="password" placeholder="••••••••" autocomplete="new-password"
                  :value="field.state.value" :error="field.state.meta.isTouched && !field.state.meta.isValid"
                  @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
                  @blur="field.handleBlur" />
                <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="error-msg">
                  {{ field.state.meta.errors[0].message }}
                </p>
              </div>
            </template>
          </form.Field>

          <form.Field name="confirm" :validators="{
            onChange: ({ value, fieldApi }) =>
              value !== fieldApi.form.getFieldValue('password') ? 'Passwords do not match.' : undefined,
          }">
            <template #default="{ field }">
              <div class="field">
                <label class="field-label" :for="field.name">Confirm password</label>
                <BaseInput :id="field.name" type="password" placeholder="••••••••" autocomplete="new-password"
                  :value="field.state.value" :error="field.state.meta.isTouched && !field.state.meta.isValid"
                  @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
                  @blur="field.handleBlur" />
                <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="error-msg">
                  {{ field.state.meta.errors[0] }}
                </p>
              </div>
            </template>
          </form.Field>

          <p v-if="authStore.error" class="error-msg">{{ authStore.error }}</p>

          <form.Subscribe>
            <template #default="{ canSubmit, isSubmitting }">
              <BaseButton type="submit" size="lg" full-width :loading="isSubmitting || authStore.loading"
                :disabled="!canSubmit" style="margin-top: 0.25rem">
                {{ isSubmitting || authStore.loading ? 'Creating account…' : 'Create account' }}
              </BaseButton>
            </template>
          </form.Subscribe>
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
