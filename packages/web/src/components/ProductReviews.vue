<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, type ApiReview } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import StarRating from '@/components/StarRating.vue'

const props = defineProps<{ productId: string }>()
const emit = defineEmits<{ reviewSubmitted: [] }>()

const authStore = useAuthStore()

const reviews = ref<ApiReview[]>([])
const averageRating = ref<number | null>(null)
const reviewCount = ref(0)
const canReview = ref(false)
const existingReview = ref<ApiReview | null>(null)
const loading = ref(true)

const formRating = ref(0)
const formBody = ref('')
const submitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref(false)

onMounted(async () => {
  const [reviewsRes, eligibilityRes] = await Promise.all([
    api.getProductReviews(props.productId),
    authStore.user ? api.getReviewEligibility(props.productId) : null,
  ])

  reviews.value = reviewsRes.reviews
  averageRating.value = reviewsRes.averageRating
  reviewCount.value = reviewsRes.reviewCount

  if (eligibilityRes) {
    canReview.value = eligibilityRes.canReview
    existingReview.value = eligibilityRes.existingReview
    if (eligibilityRes.existingReview) {
      formRating.value = eligibilityRes.existingReview.rating
      formBody.value = eligibilityRes.existingReview.body ?? ''
    }
  }

  loading.value = false
})

async function submit() {
  submitting.value = true
  submitError.value = null
  submitSuccess.value = false
  try {
    const review = await api.submitReview(props.productId, formRating.value, formBody.value || undefined)
    existingReview.value = review
    const reviewsRes = await api.getProductReviews(props.productId)
    reviews.value = reviewsRes.reviews
    averageRating.value = reviewsRes.averageRating
    reviewCount.value = reviewsRes.reviewCount
    submitSuccess.value = true
    emit('reviewSubmitted')
  } catch (e) {
    submitError.value = (e as Error).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="reviews">
    <h2 class="reviews-heading">Customer Reviews</h2>

    <!-- Aggregate summary -->
    <div v-if="reviewCount > 0" class="reviews-summary">
      <StarRating :rating="averageRating" size="md" />
      <span class="reviews-avg">{{ averageRating?.toFixed(1) }} out of 5</span>
      <span class="reviews-count">{{ reviewCount }} {{ reviewCount === 1 ? 'review' : 'reviews' }}</span>
    </div>

    <!-- Review form -->
    <div v-if="authStore.user && canReview" class="review-form">
      <h3 class="form-heading">{{ existingReview ? 'Edit your review' : 'Write a review' }}</h3>

      <div class="star-picker" role="group" aria-label="Select rating">
        <button v-for="n in 5" :key="n" class="star-btn" :class="{ 'star-btn--active': n <= formRating }" type="button"
          :aria-label="`${n} star${n > 1 ? 's' : ''}`" @click="formRating = n">★</button>
      </div>

      <textarea v-model="formBody" class="review-textarea" placeholder="Share your thoughts (optional)" rows="4" />

      <div class="form-actions">
        <button class="submit-btn" :disabled="submitting" @click="submit">
          {{ submitting ? 'Saving…' : existingReview ? 'Update review' : 'Submit review' }}
        </button>
        <span v-if="submitSuccess" class="success-msg">Review saved!</span>
        <span v-if="submitError" class="error-msg">{{ submitError }}</span>
      </div>
    </div>

    <!-- Not eligible (logged in but hasn't purchased) -->
    <p v-else-if="authStore.user && !canReview && !loading" class="review-notice">
      Purchase this product to leave a review.
    </p>

    <!-- Guest nudge -->
    <p v-else-if="!authStore.user && !loading" class="review-notice">
      <router-link to="/login" class="review-login-link">Log in</router-link> to leave a review.
    </p>

    <!-- Reviews list -->
    <div v-if="loading" class="review-loading">Loading reviews…</div>

    <div v-else-if="reviews.length === 0" class="no-reviews">
      No reviews yet. Be the first!
    </div>

    <ul v-else class="review-list">
      <li v-for="review in reviews" :key="review.id" class="review-item">
        <div class="review-header">
          <StarRating :rating="review.rating" size="sm" />
          <span class="reviewer-email">{{ review.user.email }}</span>
          <time class="review-date">{{ new Date(review.createdAt).toLocaleDateString() }}</time>
        </div>
        <p v-if="review.body" class="review-body">{{ review.body }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.reviews {
  margin-top: 4rem;
  padding-top: 3rem;
  border-top: 1px solid var(--color-border);
}

.reviews-heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.02em;
  margin-bottom: 1.25rem;
}

.reviews-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.reviews-avg {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.reviews-count {
  font-size: 0.875rem;
  color: var(--color-stone);
}

/* Form */
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

/* Notice */
.review-notice {
  font-size: 0.9375rem;
  color: var(--color-stone);
  margin-bottom: 2rem;
}

.review-login-link {
  color: var(--color-mint-dark);
  font-weight: 700;
  text-decoration: underline;
}

/* List */
.review-loading,
.no-reviews {
  font-size: 0.9375rem;
  color: var(--color-stone);
  padding: 1.5rem 0;
}

.review-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.review-item {
  padding: 1.25rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.reviewer-email {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.review-date {
  font-size: 0.8125rem;
  color: var(--color-stone);
  margin-left: auto;
}

.review-body {
  font-size: 0.9375rem;
  color: var(--color-stone);
  line-height: 1.65;
  margin: 0;
}
</style>
