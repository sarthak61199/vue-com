import { Hono } from 'hono'
import prisma from '../lib/prisma.js'

const products = new Hono()

products.get('/', async (c) => {
  const items = await prisma.product.findMany()
  return c.json(items)
})

products.get('/:id', async (c) => {
  const { id } = c.req.param()
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return c.json({ error: 'Product not found' }, 404)
  return c.json(product)
})

export default products
