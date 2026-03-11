import { Hono } from 'hono'
import { validate } from '../lib/validate.js'
import { AddCartItemSchema, UpdateCartItemSchema } from 'schemas'
import { createCart, getCart, addCartItem, updateCartItem, removeCartItem } from '../services/cart.service.js'
import { handleServiceError } from '../lib/errors.js'

const carts = new Hono()

carts.post('/', async (c) => {
  const cart = await createCart()
  return c.json(cart, 201)
})

carts.get('/:id', async (c) => {
  try {
    const cart = await getCart(c.req.param('id'))
    return c.json(cart)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

carts.post('/:id/items', validate('json', AddCartItemSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const cartItem = await addCartItem(c.req.param('id'), body.variantId, body.quantity)
    return c.json(cartItem, 201)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

carts.patch('/:id/items/:variantId', validate('json', UpdateCartItemSchema), async (c) => {
  try {
    const { id, variantId } = c.req.param()
    const body = c.req.valid('json')
    const cartItem = await updateCartItem(id, variantId, body.quantity)
    return c.json(cartItem)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

carts.delete('/:id/items/:variantId', async (c) => {
  try {
    const { id, variantId } = c.req.param()
    await removeCartItem(id, variantId)
    return c.json({ success: true })
  } catch (err) {
    return handleServiceError(err, c)
  }
})

export default carts
