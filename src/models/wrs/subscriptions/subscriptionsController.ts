import express from 'express'
import { SubscriptionRepo } from './SubscriptionRepo'

const router = express.Router()

router.post('/subscribe', async (req, res) => {
  const sub = req.body

  // don't really need validation, if sub is invalid it will just get removed in 10 mins
  if (!sub.endpoint) {
    res.sendStatus(400)
    return
  }

  try {
    await SubscriptionRepo.insertOne(sub)
    res.sendStatus(201)
  } catch (error) {
    if (error.code === 11000) {
      //duplicate error, do nothing?
      res.sendStatus(200)
    } else {
      throw error
    }
  }
})

router.post('/unsubscribe', async (req, res) => {
  const sub = req.body

  await SubscriptionRepo.deleteByEndpoint(sub.endpoint)
  res.sendStatus(204)
})

router.post('/checkSubStatus', async (req, res) => {
  const sub = req.body

  if (!sub.endpoint) {
    res.sendStatus(400)
    return
  }

  const s = await SubscriptionRepo.findByEndpoint(sub.endpoint)
  if (s) res.json(s)
  else res.sendStatus(404)
})

export default router
