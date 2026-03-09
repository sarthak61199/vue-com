import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'

const addresses = new Hono<AuthEnv>()

// Get all addresses for the current user
addresses.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const userAddresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return c.json(userAddresses)
})

// Create a new address
addresses.post('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{
    label?: string
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
    country?: string
  }>()

  if (!body.line1 || !body.city || !body.state || !body.zip) {
    return c.json({ error: 'line1, city, state, and zip are required' }, 400)
  }

  const address = await prisma.address.create({
    data: {
      userId,
      label: body.label ?? null,
      line1: body.line1,
      line2: body.line2 ?? null,
      city: body.city,
      state: body.state,
      zip: body.zip,
      country: body.country ?? 'US',
    },
  })

  return c.json(address, 201)
})

// Delete an address
addresses.delete('/:id', requireAuth, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const address = await prisma.address.findUnique({ where: { id } })
  if (!address) return c.json({ error: 'Address not found' }, 404)
  if (address.userId !== userId) return c.json({ error: 'Forbidden' }, 403)

  await prisma.address.delete({ where: { id } })
  return c.json({ success: true })
})

export default addresses
