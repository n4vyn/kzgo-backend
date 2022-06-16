import express from 'express'
import { z } from 'zod'
import { SubscriptionRepo } from './SubscriptionRepo'

const router = express.Router()

const inputSchema = z.object({
  endpoint: z.string(),
  expirationTime: z.string(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

router.post('/subscribe', async (req, res) => {
  const sub = await inputSchema.safeParseAsync(req.body)

  if (!sub.success) {
    res.sendStatus(400)
    return
  }

  SubscriptionRepo.insertOne(sub.data)
    .then(() => {
      res.sendStatus(201)
    })
    .catch(error => {
      if (error.code === 11000) {
        //duplicate error, do nothing?
        res.sendStatus(200)
      } else {
        throw error
      }
    })
})

router.post('/unsubscribe', async (req, res) => {
  const sub = await inputSchema.safeParseAsync(req.body)

  if (!sub.success) {
    res.sendStatus(400)
    return
  }

  SubscriptionRepo.deleteByEndpoint(sub.data.endpoint)
    .then(() => {
      res.sendStatus(201)
    })
})

router.post('/checkSubStatus', async (req, res) => {
  const sub = await inputSchema.safeParseAsync(req.body)

  if (!sub.success) {
    res.sendStatus(400)
    return
  }

  SubscriptionRepo.findByEndpoint(sub.data.endpoint)
    .then(s => {
      if (s) res.json(s)
      else res.sendStatus(404)
    })
})

export default router
