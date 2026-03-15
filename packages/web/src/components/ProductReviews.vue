<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@pinia/colada'
import { useAuthStore } from '@/stores/auth'
import { productReviewsQuery, reviewEligibilityQuery, useSubmitReview } from '@/queries/useReviews'
import StarRating from '@/components/StarRating.vue'
import ReviewForm from '@/components/ReviewForm.vue'

const props = defineProps<{ productId: string }>()

const authStore = useAuthStore()

const { data: reviewsData, isPending: loading } = useQuery(
  () => productReviewsQuery(props.productId),
)

const { data: eligibilityData } = useQuery({
  ...reviewEligibilityQuery(props.productId),
  enabled: computed(() => !!authStore.user),
})

const reviews = computed(() => reviewsData.value?.reviews ?? [])
const averageRating = computed(() => reviewsData.value?.averageRating ?? null)
const reviewCount = computed(() => reviewsData.value?.reviewCount ?? 0)
const canReview = computed(() => eligibilityData.value?.canReview ?? false)
const existingReview = computed(() => eligibilityData.value?.existingReview ?? null)

const { mutateAsync: submitReviewMutate, isLoading: submitting, error: submitError } = useSubmitReview()
const successMsg = ref(false)

async function submit(rating: number, body: string) {
  successMsg.value = false
  try {
    await submitReviewMutate({ productId: props.productId, rating, body: body || undefined })
    successMsg.value = true
  } catch {
    // error exposed via submitError
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
      <span class="reviews-count"
        >{{ reviewCount }} {{ reviewCount === 1 ? 'review' : 'reviews' }}</span
      >
    </div>

    <!-- Review form -->
    <ReviewForm
      v-if="authStore.user && canReview"
      :existing-review="existingReview"
      :submitting="submitting"
      :submit-error="submitError ? (submitError as Error).message : null"
      :submit-success="successMsg"
      @submit="submit"
    />

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

    <div v-else-if="reviews.length === 0" class="no-reviews">No reviews yet. Be the first!</div>

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

@media (max-width: 480px) {
  .review-date {
    margin-left: 0;
    width: 100%;
  }
}
</style>
