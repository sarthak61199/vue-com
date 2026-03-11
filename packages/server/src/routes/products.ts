import { Hono } from 'hono'
import { validate } from '../lib/validate.js'
import { ProductQuerySchema } from 'schemas'
import { listProducts, getProductById } from '../services/product.service.js'
import { handleServiceError } from '../lib/errors.js'

const products = new Hono()

products.get('/', validate('query', ProductQuerySchema), async (c) => {
  const q = c.req.valid('query')
  const result = await listProducts(q)
  return c.json(result)
})

products.get('/:id', async (c) => {
  try {
    const product = await getProductById(c.req.param('id'))
    return c.json(product)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

export default products
