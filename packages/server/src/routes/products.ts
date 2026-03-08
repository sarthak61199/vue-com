import { Hono } from 'hono'
import prisma from '../lib/prisma.js'

const products = new Hono()

products.get('/', async (c) => {
  const PAGE_SIZE = 9
  const raw = c.req.query('page')
  const page = Math.max(1, parseInt(raw ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({ skip, take: PAGE_SIZE, orderBy: { createdAt: 'asc' } }),
    prisma.product.count(),
  ])

  return c.json({ items, total })
})

products.get('/:id', async (c) => {
  const { id } = c.req.param()
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return c.json({ error: 'Product not found' }, 404)
  return c.json(product)
})

export default products
