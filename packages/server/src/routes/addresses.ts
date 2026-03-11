import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'
import { validate } from '../lib/validate.js'
import { CreateAddressSchema } from 'schemas'
import { getUserAddresses, createAddress, deleteAddress } from '../services/address.service.js'
import { handleServiceError } from '../lib/errors.js'

const addresses = new Hono<AuthEnv>()

addresses.get('/', requireAuth, async (c) => {
  const userAddresses = await getUserAddresses(c.get('userId'))
  return c.json(userAddresses)
})

addresses.post('/', requireAuth, validate('json', CreateAddressSchema), async (c) => {
  const address = await createAddress(c.get('userId'), c.req.valid('json'))
  return c.json(address, 201)
})

addresses.delete('/:id', requireAuth, async (c) => {
  try {
    await deleteAddress(c.get('userId'), c.req.param('id'))
    return c.json({ success: true })
  } catch (err) {
    return handleServiceError(err, c)
  }
})

export default addresses
