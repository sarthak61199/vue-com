<script setup lang="ts">
import { ref } from 'vue'
import { useAddressStore } from '@/stores/address'
import type { ApiAddress } from '@/services/api'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'

const emit = defineEmits<{
  saved: [address: ApiAddress]
  cancel: []
}>()

const addressStore = useAddressStore()

const fields = ref({ label: '', line1: '', line2: '', city: '', state: '', zip: '', country: 'US' })
const error = ref('')
const loading = ref(false)

const submit = async () => {
  error.value = ''
  if (!fields.value.line1 || !fields.value.city || !fields.value.state || !fields.value.zip) {
    error.value = 'Street address, city, state and ZIP are required.'
    return
  }
  loading.value = true
  const result = await addressStore.createAddress({
    label: fields.value.label || null,
    line1: fields.value.line1,
    line2: fields.value.line2 || null,
    city: fields.value.city,
    state: fields.value.state,
    zip: fields.value.zip,
    country: fields.value.country || 'US',
  })
  loading.value = false
  if (result) {
    fields.value = { label: '', line1: '', line2: '', city: '', state: '', zip: '', country: 'US' }
    emit('saved', result)
  } else {
    error.value = addressStore.error ?? 'Failed to save address.'
  }
}
</script>

<template>
  <form class="address-form" @submit.prevent="submit">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="af-label">Label <span class="optional">(optional)</span></label>
        <BaseInput id="af-label" v-model="fields.label" placeholder="Home, Work…" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="af-line1">Street Address *</label>
        <BaseInput id="af-line1" v-model="fields.line1" placeholder="123 Main St" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="af-line2">Apt, Suite <span class="optional">(optional)</span></label>
        <BaseInput id="af-line2" v-model="fields.line2" placeholder="Apt 4B" />
      </div>
    </div>
    <div class="form-row form-row--3">
      <div class="form-group">
        <label class="form-label" for="af-city">City *</label>
        <BaseInput id="af-city" v-model="fields.city" placeholder="New York" />
      </div>
      <div class="form-group">
        <label class="form-label" for="af-state">State *</label>
        <BaseInput id="af-state" v-model="fields.state" placeholder="NY" />
      </div>
      <div class="form-group">
        <label class="form-label" for="af-zip">ZIP *</label>
        <BaseInput id="af-zip" v-model="fields.zip" placeholder="10001" />
      </div>
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>
    <div class="form-actions">
      <BaseButton type="submit" variant="dark" :loading="loading">
        {{ loading ? 'Saving…' : 'Save Address' }}
      </BaseButton>
      <BaseButton type="button" variant="ghost" @click="emit('cancel')"> Cancel </BaseButton>
    </div>
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

.form-error {
  font-size: 0.875rem;
  font-weight: 700;
  color: #d94f4f;
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
