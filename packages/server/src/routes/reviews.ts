import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'
import { validate } from '../lib/validate.js'
import { CreateReviewSchema } from 'schemas'
import { getProductReviews, getReviewEligibility, upsertReview } from '../services/review.service.js'
import { handleServiceError } from '../lib/errors.js'

const reviews = new Hono<AuthEnv>()

reviews.get('/product/:productId', async (c) => {
  const result = await getProductReviews(c.req.param('productId'))
  return c.json(result)
})

reviews.get('/eligibility/:productId', requireAuth, async (c) => {
  const result = await getReviewEligibility(c.get('userId'), c.req.param('productId'))
  return c.json(result)
})

reviews.post('/', requireAuth, validate('json', CreateReviewSchema), async (c) => {
  try {
    const { productId, rating, body: reviewBody } = c.req.valid('json')
    const { review, isNew } = await upsertReview(c.get('userId'), productId, rating, reviewBody)
    return c.json(review, isNew ? 201 : 200)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

export default reviews
