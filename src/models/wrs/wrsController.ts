import express, { RequestHandler } from 'express'
import type { ParamsDictionary } from 'express-serve-static-core'

import subscriptionsController from './subscriptions/subscriptionsController'
import { auth } from '../../middlewares/auth/auth'
import { cleanup, getLeaderboards, getPlayerWrCount, getWrsForMode, getWrsForModeAndType, refetchForMap } from './wrServices'
import { KzMode, KzRunType } from '../../types'

const modes = new Set<KzMode>(['kz_timer', 'kz_simple', 'kz_vanilla'])
const types = new Set<KzRunType>(['pro', 'tp'])

type Input = { mode: KzMode, type: KzRunType }

const validateInput = (typeToo = false): RequestHandler<ParamsDictionary, unknown, Input> => {
  return (req, res, next) => {
    const { mode, type } = req.params as Input

    if (!modes.has(mode)) {
      res.status(400).json({ message: 'Unknown KzMode.' })
      return
    }
    req.body.mode = mode

    if (typeToo && !types.has(type)) {
      res.status(400).json({ message: 'Unknown KzType.' })
      return
    }
    req.body.type = type

    next()
  }
}

const router = express.Router()

router.use('/', subscriptionsController)

router.get('/leaderboards/:mode/:type', validateInput(), async (req, res) => {
  const { mode, type } = req.body
  const leaderboards = await getLeaderboards(mode, type)
  res.json(leaderboards)
})

router.get('/player/:mode/:type/:steamId64', validateInput(true), async (req, res) => {
  const { mode, type } = req.body
  const count = await getPlayerWrCount(mode, type, req.params.steamId64)
  res.json({ count })
})

router.get('/:mode/:type', validateInput(true), async (req, res) => {
  const { mode, type } = req.body
  const wrs = await getWrsForModeAndType(mode, type)
  res.json(wrs)
})

router.get('/:mode', validateInput(), async (req, res) => {
  const { mode } = req.body
  const wrs = await getWrsForMode(mode)
  res.json(wrs)
})

router.post('/fetch/:mapId/:mode/:type', validateInput(true), auth('MapMod'), async (req, res) => {
  const { mode, type } = req.body
  await refetchForMap(parseInt(req.params.mapId, 10), mode, type)
  res.sendStatus(204)
})

router.post('/cleanup', auth('MapMod'), async (req, res) => {
  await cleanup()
  res.sendStatus(204)
})

export default router
