import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import products from './routes/products.js'
import carts from './routes/carts.js'
import orders from './routes/orders.js'
import auth from './routes/auth.js'
import reviews from './routes/reviews.js'
import wishlist from './routes/wishlist.js'
import addresses from './routes/addresses.js'
import categories from './routes/categories.js'
import promos from './routes/promos.js'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono().basePath('/api')

app.use(logger())
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

app.onError((err, c) => {
  console.error(`[${c.req.method}] ${c.req.path}`, err)
  return c.json({ error: 'Internal server error' }, 500)
})

app.route('/auth', auth)
app.route('/products', products)
app.route('/carts', carts)
app.route('/orders', orders)
app.route('/reviews', reviews)
app.route('/wishlist', wishlist)
app.route('/addresses', addresses)
app.route('/categories', categories)
app.route('/promos', promos)

serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
