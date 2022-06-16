import express from 'express'
import { getServerStates } from './serverServices'

const router = express.Router()

router.get('/', (req, res) => {
  res.json(getServerStates())
})

export default router
