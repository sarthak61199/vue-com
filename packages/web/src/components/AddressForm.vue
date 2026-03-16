<script setup lang="ts">
import { ref } from 'vue'
import { useCreateAddress } from '@/queries/useAddresses'
import type { ApiAddress } from '@/services/api'
import { useForm } from '@tanstack/vue-form'
import { CreateAddressSchema, type CreateAddressSchemaType } from 'schemas'
import { BaseInput, BaseButton } from 'ui'

const emit = defineEmits<{
  saved: [address: ApiAddress]
  cancel: []
}>()

const { mutateAsync: createAddress } = useCreateAddress()
const error = ref('')

const form = useForm({
  defaultValues: { label: '', line1: '', line2: '', city: '', state: '', zip: '', country: 'US' } as CreateAddressSchemaType,
  validators: { onChange: CreateAddressSchema },
  onSubmit: async ({ value }) => {
    error.value = ''
    try {
      const result = await createAddress(value)
      form.reset()
      emit('saved', result)
    } catch (e) {
      error.value = (e as Error).message
    }
  },
})
</script>

<template>
  <form class="address-form" @submit.prevent="form.handleSubmit">
    <div class="form-row">
      <form.Field name="label">
        <template #default="{ field }">
          <div class="form-group">
            <label class="form-label" :for="field.name">Label <span class="optional">(optional)</span></label>
            <BaseInput :id="field.name" placeholder="Home, Work…" :value="field.state.value"
              @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
              @blur="field.handleBlur" />
          </div>
        </template>
      </form.Field>
    </div>

    <div class="form-row">
      <form.Field name="line1">
        <template #default="{ field }">
          <div class="form-group">
            <label class="form-label" :for="field.name">Street Address *</label>
            <BaseInput :id="field.name" placeholder="123 Main St" :value="field.state.value"
              :error="field.state.meta.isTouched && !field.state.meta.isValid"
              @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
              @blur="field.handleBlur" />
            <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
              {{ field.state.meta.errors[0].message }}
            </p>
          </div>
        </template>
      </form.Field>
    </div>

    <div class="form-row">
      <form.Field name="line2">
        <template #default="{ field }">
          <div class="form-group">
            <label class="form-label" :for="field.name">Apt, Suite <span class="optional">(optional)</span></label>
            <BaseInput :id="field.name" placeholder="Apt 4B" :value="field.state.value"
              @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
              @blur="field.handleBlur" />
          </div>
        </template>
      </form.Field>
    </div>

    <div class="form-row form-row--3">
      <form.Field name="city">
        <template #default="{ field }">
          <div class="form-group">
            <label class="form-label" :for="field.name">City *</label>
            <BaseInput :id="field.name" placeholder="New York" :value="field.state.value"
              :error="field.state.meta.isTouched && !field.state.meta.isValid"
              @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
              @blur="field.handleBlur" />
            <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
              {{ field.state.meta.errors[0].message }}
            </p>
          </div>
        </template>
      </form.Field>

      <form.Field name="state">
        <template #default="{ field }">
          <div class="form-group">
            <label class="form-label" :for="field.name">State *</label>
            <BaseInput :id="field.name" placeholder="NY" :value="field.state.value"
              :error="field.state.meta.isTouched && !field.state.meta.isValid"
              @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
              @blur="field.handleBlur" />
            <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
              {{ (field.state.meta.errors[0] as any)?.message }}
            </p>
          </div>
        </template>
      </form.Field>

      <form.Field name="zip">
        <template #default="{ field }">
          <div class="form-group">
            <label class="form-label" :for="field.name">ZIP *</label>
            <BaseInput :id="field.name" placeholder="10001" :value="field.state.value"
              :error="field.state.meta.isTouched && !field.state.meta.isValid"
              @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
              @blur="field.handleBlur" />
            <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
              {{ field.state.meta.errors[0].message }}
            </p>
          </div>
        </template>
      </form.Field>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <form.Subscribe>
      <template #default="{ canSubmit, isSubmitting }">
        <div class="form-actions">
          <BaseButton type="submit" variant="dark" :loading="isSubmitting" :disabled="!canSubmit">
            {{ isSubmitting ? 'Saving…' : 'Save Address' }}
          </BaseButton>
          <BaseButton type="button" variant="ghost" @click="emit('cancel')"> Cancel </BaseButton>
        </div>
      </template>
    </form.Subscribe>
  </form>
</template>

<style scoped>
.address-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.form-row--3 {
  grid-template-columns: 2fr 1fr 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-stone);
}

.optional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.6875rem;
  color: var(--color-stone);
  opacity: 0.7;
}

.field-error {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-error);
}

.form-error {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-error);
}

.form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 480px) {
  .form-row--3 {
    grid-template-columns: 1fr;
  }
}
</style>
