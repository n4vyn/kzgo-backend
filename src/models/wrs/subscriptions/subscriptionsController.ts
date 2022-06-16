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

router.post('/subscribe', (req, res) => {
  const sub = inputSchema.parse(req.body)

  SubscriptionRepo.insertOne(sub)
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

router.post('/unsubscribe', (req, res) => {
  const sub = inputSchema.parse(req.body)

  SubscriptionRepo.deleteByEndpoint(sub.endpoint)
    .then(() => {
      res.sendStatus(201)
    })
})

router.post('/checkSubStatus', (req, res) => {
  const sub = inputSchema.parse(req.body)

  SubscriptionRepo.findByEndpoint(sub.endpoint)
    .then(s => {
      if (s) res.json(s)
      else res.sendStatus(404)
    })
})

export default router
