import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import products from './routes/products.js'
import carts from './routes/carts.js'
import orders from './routes/orders.js'
import { cors } from 'hono/cors'

const app = new Hono()

app.use(cors({
  origin: '*',
}))

app.route('/api/products', products)
app.route('/api/carts', carts)
app.route('/api/orders', orders)

serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
