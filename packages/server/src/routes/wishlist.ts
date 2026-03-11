import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'
import { validate } from '../lib/validate.js'
import { AddWishlistItemSchema } from 'schemas'
import { getWishlist, addToWishlist, removeFromWishlist } from '../services/wishlist.service.js'
import { handleServiceError } from '../lib/errors.js'

const wishlist = new Hono<AuthEnv>()

wishlist.get('/', requireAuth, async (c) => {
  const items = await getWishlist(c.get('userId'))
  return c.json(items)
})

wishlist.post('/', requireAuth, validate('json', AddWishlistItemSchema), async (c) => {
  try {
    const { productId } = c.req.valid('json')
    const item = await addToWishlist(c.get('userId'), productId)
    return c.json(item)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

wishlist.delete('/:productId', requireAuth, async (c) => {
  try {
    await removeFromWishlist(c.get('userId'), c.req.param('productId'))
    return c.json({ success: true })
  } catch (err) {
    return handleServiceError(err, c)
  }
})

export default wishlist
