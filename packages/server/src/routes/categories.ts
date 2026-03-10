import { Hono } from 'hono'
import prisma from '../lib/prisma.js'

const categories = new Hono()

categories.get('/', async (c) => {
  const all = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return c.json(all)
})

export default categories
