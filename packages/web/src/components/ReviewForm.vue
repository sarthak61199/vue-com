<script setup lang="ts">
import { ref } from 'vue'
import { type ApiReview } from '@/services/api'

const props = defineProps<{
  existingReview: ApiReview | null
  submitting: boolean
  submitError: string | null
  submitSuccess: boolean
}>()

const emit = defineEmits<{
  submit: [rating: number, body: string]
}>()

const formRating = ref(props.existingReview?.rating ?? 0)
const formBody = ref(props.existingReview?.body ?? '')

function handleSubmit() {
  emit('submit', formRating.value, formBody.value)
}
</script>

<template>
  <div class="review-form">
    <h3 class="form-heading">{{ existingReview ? 'Edit your review' : 'Write a review' }}</h3>

    <div class="star-picker" role="group" aria-label="Select rating">
      <button
        v-for="n in 5"
        :key="n"
        class="star-btn"
        :class="{ 'star-btn--active': n <= formRating }"
        type="button"
        :aria-label="`${n} star${n > 1 ? 's' : ''}`"
        @click="formRating = n"
      >★</button>
    </div>

    <textarea
      v-model="formBody"
      class="review-textarea"
      placeholder="Share your thoughts (optional)"
      rows="4"
    />

    <div class="form-actions">
      <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
        {{ submitting ? 'Saving…' : existingReview ? 'Update review' : 'Submit review' }}
      </button>
      <span v-if="submitSuccess" class="success-msg">Review saved!</span>
      <span v-if="submitError" class="error-msg">{{ submitError }}</span>
    </div>
  </div>
</template>

<style scoped>
.review-form {
  background: var(--color-mint-50);
  border: 1px solid var(--color-mint-100);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2.5rem;
}

.form-heading {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-charcoal);
  margin-bottom: 1rem;
}

.star-picker {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.star-btn {
  font-size: 1.75rem;
  line-height: 1;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-stone);
  opacity: 0.35;
  padding: 0;
  transition: opacity 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.star-btn--active {
  color: var(--color-mint-dark);
  opacity: 1;
}

.star-btn:hover {
  opacity: 0.8;
  transform: scale(1.15);
}

.review-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9375rem;
  color: var(--color-charcoal);
  background: white;
  resize: vertical;
  box-sizing: border-box;
  margin-bottom: 1rem;
  transition: border-color 0.2s ease;
}

.review-textarea:focus {
  outline: none;
  border-color: var(--color-mint);
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.submit-btn {
  padding: 0.625rem 1.5rem;
  background: var(--color-charcoal);
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-mint-dark);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-msg {
  font-size: 0.875rem;
  color: var(--color-mint-dark);
  font-weight: 700;
}

.error-msg {
  font-size: 0.875rem;
  color: #c0392b;
}
</style>
