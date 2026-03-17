<script setup lang="ts">
import { watch } from 'vue'
import { useQuery } from '@pinia/colada'
import { useForm, useStore } from '@tanstack/vue-form'
import { api } from 'api'
import type { ApiCreatePromoInput, ApiAdminPromo } from 'api'
import { adminProductOptionsQuery } from '@/queries/useAdminPromos'
import { BaseButton, BaseInput } from 'ui'
import { toDatetimeLocal } from '@/utils/format'
import { CreatePromoSchema, type CreatePromoInput } from 'schemas'

interface Props {
  initial?: ApiAdminPromo | null
  isSubmitting: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  initial: null,
  submitLabel: 'Save',
})

const emit = defineEmits<{
  submit: [values: ApiCreatePromoInput]
}>()

const { data: categories } = useQuery({
  key: ['categories'],
  query: () => api.getCategories(),
  staleTime: 5 * 60_000,
})

const { data: productOptions } = useQuery(adminProductOptionsQuery)

const form = useForm({
  defaultValues: {
    isAutomatic: props.initial?.isAutomatic ?? false,
    isActive: props.initial?.isActive ?? true,
    code: props.initial?.code ?? '',
    description: props.initial?.description ?? '',
    discountType: (props.initial?.discountType ?? 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING',
    discountValue: props.initial?.discountValue ?? 0,
    scope: (props.initial?.scope ?? 'ORDER') as 'ORDER' | 'PRODUCT' | 'CATEGORY',
    productId: props.initial?.productId ?? '',
    categoryId: props.initial?.categoryId ?? '',
    minOrderAmount: props.initial?.minOrderAmount ?? 0,
    maxUses: props.initial?.maxUses ?? 0,
    maxUsesPerUser: props.initial?.maxUsesPerUser ?? 0,
    expiresAt: toDatetimeLocal(props.initial?.expiresAt),
  } as CreatePromoInput,
  validators: {
    onChange: CreatePromoSchema
  },
  onSubmit: async ({ value }) => {
    emit('submit', {
      code: value.isAutomatic ? null : (value.code?.trim() || null),
      description: value.description.trim(),
      discountType: value.discountType,
      discountValue: value.discountType === 'FREE_SHIPPING' ? 0 : value.discountValue,
      scope: value.scope,
      productId: value.scope === 'PRODUCT' ? (value.productId || null) : null,
      categoryId: value.scope === 'CATEGORY' ? (value.categoryId || null) : null,
      minOrderAmount: value.minOrderAmount ? Number(value.minOrderAmount) : null,
      maxUses: value.maxUses ? Number(value.maxUses) : null,
      maxUsesPerUser: value.maxUsesPerUser ? Number(value.maxUsesPerUser) : null,
      expiresAt: value.expiresAt ? new Date(value.expiresAt).toISOString() : null,
      isActive: value.isActive,
      isAutomatic: value.isAutomatic,
    })
  },
})

const isAutomatic = useStore(form.store, (state) => state.values.isAutomatic)
const scope = useStore(form.store, (state) => state.values.scope)
const discountType = useStore(form.store, (state) => state.values.discountType)

watch(isAutomatic, (val) => {
  if (val) form.setFieldValue('code', '')
})

watch(scope, (val) => {
  if (val !== 'PRODUCT') form.setFieldValue('productId', '')
  if (val !== 'CATEGORY') form.setFieldValue('categoryId', '')
})

watch(discountType, (val) => {
  if (val === 'FREE_SHIPPING') form.setFieldValue('discountValue', 0)
})


</script>

<template>
  <form class="promo-form" @submit.prevent="form.handleSubmit">
    <!-- Flags -->
    <div class="flags-row">
      <form.Field name="isActive">
        <template #default="{ field }">
          <label class="checkbox-label">
            <input type="checkbox" :checked="field.state.value"
              @change="(e: Event) => field.handleChange((e.target as HTMLInputElement).checked)"
              @blur="field.handleBlur" />
            <span>Active</span>
          </label>
        </template>
      </form.Field>

      <form.Field name="isAutomatic">
        <template #default="{ field }">
          <label class="checkbox-label">
            <input type="checkbox" :checked="field.state.value"
              @change="(e: Event) => field.handleChange((e.target as HTMLInputElement).checked)"
              @blur="field.handleBlur" />
            <span>Automatic (no code required)</span>
          </label>
        </template>
      </form.Field>
    </div>

    <!-- Code — conditionally rendered; useStore ref is auto-unwrapped in template -->
    <div v-if="!isAutomatic" class="field">
      <form.Field name="code">
        <template #default="{ field }">
          <label class="field-label" :for="field.name">Promo Code</label>
          <BaseInput :id="field.name" placeholder="e.g. SAVE10" style="text-transform: uppercase"
            :value="field.state.value" :error="field.state.meta.isTouched && !field.state.meta.isValid"
            @input="(e: Event) => field.handleChange(((e.target as HTMLInputElement).value).toUpperCase())"
            @blur="field.handleBlur" />
          <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
            {{ field.state.meta.errors[0] }}
          </p>
        </template>
      </form.Field>
    </div>

    <!-- Description -->
    <div class="field">
      <form.Field name="description">
        <template #default="{ field }">
          <label class="field-label" :for="field.name">Description</label>
          <BaseInput :id="field.name" placeholder="e.g. 10% off everything" :value="field.state.value"
            :error="field.state.meta.isTouched && !field.state.meta.isValid"
            @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)" @blur="field.handleBlur" />
          <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
            {{ field.state.meta.errors[0] }}
          </p>
        </template>
      </form.Field>
    </div>

    <!-- Discount Type + Value -->
    <div class="field-row">
      <div class="field">
        <form.Field name="discountType">
          <template #default="{ field }">
            <label class="field-label" :for="field.name">Discount Type</label>
            <select :id="field.name" class="form-select" :value="field.state.value"
              @change="(e: Event) => field.handleChange((e.target as HTMLSelectElement).value as 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING')"
              @blur="field.handleBlur">
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed ($)</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
            </select>
          </template>
        </form.Field>
      </div>

      <div v-if="discountType !== 'FREE_SHIPPING'" class="field">
        <form.Field name="discountValue">
          <template #default="{ field }">
            <label class="field-label" :for="field.name">
              {{ discountType === 'PERCENTAGE' ? 'Percentage' : 'Amount ($)' }}
            </label>
            <BaseInput :id="field.name" type="number" placeholder="0" min="0" step="0.01"
              :value="String(field.state.value)" :error="field.state.meta.isTouched && !field.state.meta.isValid"
              @input="(e: Event) => field.handleChange(parseFloat((e.target as HTMLInputElement).value) || 0)"
              @blur="field.handleBlur" />
            <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
              {{ field.state.meta.errors[0] }}
            </p>
          </template>
        </form.Field>
      </div>
    </div>

    <!-- Scope -->
    <div class="field">
      <form.Field name="scope">
        <template #default="{ field }">
          <label class="field-label" :for="field.name">Scope</label>
          <select :id="field.name" class="form-select" :value="field.state.value"
            @change="(e: Event) => field.handleChange((e.target as HTMLSelectElement).value as 'ORDER' | 'PRODUCT' | 'CATEGORY')"
            @blur="field.handleBlur">
            <option value="ORDER">Order (applies to whole order)</option>
            <option value="PRODUCT">Product (specific product)</option>
            <option value="CATEGORY">Category (specific category)</option>
          </select>
        </template>
      </form.Field>
    </div>

    <!-- Product picker -->
    <div v-if="scope === 'PRODUCT'" class="field">
      <form.Field name="productId">
        <template #default="{ field }">
          <label class="field-label" :for="field.name">Product</label>
          <select :id="field.name" class="form-select"
            :class="{ 'select-error': field.state.meta.isTouched && !field.state.meta.isValid }"
            :value="field.state.value" @change="(e: Event) => field.handleChange((e.target as HTMLSelectElement).value)"
            @blur="field.handleBlur">
            <option value="">Select a product…</option>
            <option v-for="p in productOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
            {{ field.state.meta.errors[0] }}
          </p>
        </template>
      </form.Field>
    </div>

    <!-- Category picker -->
    <div v-if="scope === 'CATEGORY'" class="field">
      <form.Field name="categoryId">
        <template #default="{ field }">
          <label class="field-label" :for="field.name">Category</label>
          <select :id="field.name" class="form-select"
            :class="{ 'select-error': field.state.meta.isTouched && !field.state.meta.isValid }"
            :value="field.state.value" @change="(e: Event) => field.handleChange((e.target as HTMLSelectElement).value)"
            @blur="field.handleBlur">
            <option value="">Select a category…</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
          <p v-if="field.state.meta.isTouched && field.state.meta.errors[0]" class="field-error">
            {{ field.state.meta.errors[0] }}
          </p>
        </template>
      </form.Field>
    </div>

    <div class="divider" />
    <p class="section-label">Optional Constraints</p>

    <div class="field-row">
      <div class="field">
        <form.Field name="minOrderAmount">
          <template #default="{ field }">
            <label class="field-label" :for="field.name">Min Order Amount ($)</label>
            <BaseInput :id="field.name" type="number" placeholder="None" min="0" step="0.01" :value="field.state.value"
              @input="(e: Event) => field.handleChange(Number((e.target as HTMLInputElement).value))"
              @blur="field.handleBlur" />
          </template>
        </form.Field>
      </div>

      <div class="field">
        <form.Field name="maxUses">
          <template #default="{ field }">
            <label class="field-label" :for="field.name">Max Total Uses</label>
            <BaseInput :id="field.name" type="number" placeholder="Unlimited" min="1" step="1"
              :value="field.state.value"
              @input="(e: Event) => field.handleChange(Number((e.target as HTMLInputElement).value))"
              @blur="field.handleBlur" />
          </template>
        </form.Field>
      </div>

      <div class="field">
        <form.Field name="maxUsesPerUser">
          <template #default="{ field }">
            <label class="field-label" :for="field.name">Max Uses Per User</label>
            <BaseInput :id="field.name" type="number" placeholder="Unlimited" min="1" step="1"
              :value="field.state.value"
              @input="(e: Event) => field.handleChange(Number((e.target as HTMLInputElement).value))"
              @blur="field.handleBlur" />
          </template>
        </form.Field>
      </div>
    </div>

    <div style="max-width: 280px">
      <form.Field name="expiresAt">
        <template #default="{ field }">
          <div class="field">
            <label class="field-label" :for="field.name">Expires At</label>
            <input :id="field.name" type="datetime-local" class="form-input" :value="field.state.value"
              @input="(e: Event) => field.handleChange((e.target as HTMLInputElement).value)"
              @blur="field.handleBlur" />
          </div>
        </template>
      </form.Field>
    </div>

    <div class="form-actions">
      <form.Subscribe>
        <template #default="{ canSubmit, isSubmitting: formSubmitting }">
          <BaseButton type="submit" variant="primary" :loading="props.isSubmitting || formSubmitting"
            :disabled="!canSubmit || props.isSubmitting">
            {{ props.submitLabel }}
          </BaseButton>
        </template>
      </form.Subscribe>
    </div>
  </form>
</template>

<style scoped>
.promo-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.flags-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-charcoal);
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type='checkbox'] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-mint-dark);
  cursor: pointer;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
}

.field-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-stone);
}

.field-error {
  font-size: 0.8125rem;
  color: var(--color-error);
  font-weight: 600;
}

.form-select,
.form-input {
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.9375rem;
  background: white;
  color: var(--color-charcoal);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
}

.form-select:focus,
.form-input:focus {
  border-color: var(--color-mint);
}

.select-error {
  border-color: var(--color-error);
}

.divider {
  border-top: 1px solid var(--color-border);
  margin: 0.25rem 0;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-stone);
  margin-bottom: -0.5rem;
}

.form-actions {
  padding-top: 0.5rem;
}
</style>
