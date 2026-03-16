<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from '@tanstack/vue-form'
import { ChangePasswordSchema } from 'schemas'
import { api } from '@/services/api'
import { BaseInput, BaseButton } from 'ui'

const success = ref('')
const error = ref('')

const form = useForm({
  defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  validators: { onChange: ChangePasswordSchema },
  onSubmit: async ({ value }) => {
    success.value = ''
    error.value = ''
    try {
      await api.changePassword(value.currentPassword, value.newPassword)
      success.value = 'Password updated successfully.'
      form.reset()
    } catch (e) {
      error.value = (e as Error).message
    }
  },
})
</script>

<template>
  <form class="pw-form" @submit.prevent="form.handleSubmit">
    <form.Field name="currentPassword">
      <template #default="{ field }">
        <div class="form-group">
          <label class="form-label" :for="field.name">Current Password</label>
          <BaseInput :id="field.name" type="password" autocomplete="current-password" :value="field.state.value"
            :error="field.state.meta.isTouched && !field.state.meta.isValid"
            @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)" @blur="field.handleBlur" />
          <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
            {{ field.state.meta.errors[0].message }}
          </p>
        </div>
      </template>
    </form.Field>

    <form.Field name="newPassword">
      <template #default="{ field }">
        <div class="form-group">
          <label class="form-label" :for="field.name">New Password</label>
          <BaseInput :id="field.name" type="password" autocomplete="new-password" :value="field.state.value"
            :error="field.state.meta.isTouched && !field.state.meta.isValid"
            @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)" @blur="field.handleBlur" />
          <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
            {{ field.state.meta.errors[0].message }}
          </p>
        </div>
      </template>
    </form.Field>

    <form.Field name="confirm" :validators="{
      onChange: ({ value, fieldApi }) =>
        value !== fieldApi.form.getFieldValue('newPassword') ? 'Passwords do not match.' : undefined,
    }">
      <template #default="{ field }">
        <div class="form-group">
          <label class="form-label" :for="field.name">Confirm New Password</label>
          <BaseInput :id="field.name" type="password" autocomplete="new-password" :value="field.state.value"
            :error="field.state.meta.isTouched && !field.state.meta.isValid"
            @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)" @blur="field.handleBlur" />
          <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
            {{ field.state.meta.errors[0] }}
          </p>
        </div>
      </template>
    </form.Field>

    <p v-if="error" class="form-msg error-msg">{{ error }}</p>
    <p v-if="success" class="form-msg success-msg">{{ success }}</p>

    <form.Subscribe>
      <template #default="{ canSubmit, isSubmitting }">
        <BaseButton type="submit" variant="dark" :loading="isSubmitting" :disabled="!canSubmit">
          {{ isSubmitting ? 'Updating…' : 'Update Password' }}
        </BaseButton>
      </template>
    </form.Subscribe>
  </form>
</template>

<style scoped>
.pw-form {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 440px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-stone);
}

.field-error {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-error);
}

.form-msg {
  font-size: 0.875rem;
  font-weight: 700;
}

.error-msg {
  color: var(--color-error);
}

.success-msg {
  color: var(--color-mint-dark);
}

@media (max-width: 480px) {
  .pw-form {
    max-width: none;
    padding: 1.25rem;
  }
}
</style>
