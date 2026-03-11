import { Hono } from 'hono'
import { getAllCategories } from '../services/category.service.js'

const categories = new Hono()

categories.get('/', async (c) => {
  const all = await getAllCategories()
  return c.json(all)
})

export default categories
