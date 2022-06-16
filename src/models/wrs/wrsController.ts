import express, { Request, Response } from 'express'

import subscriptionsController from './subscriptions/subscriptionsController'
import { auth } from '../../middlewares/auth/auth'
import { cleanup, getLeaderboards, getPlayerWrCount, getWrsForMode, getWrsForModeAndType, refetchForMap } from './wrServices'
import { KzMode, KzRunType } from '../../types'

const modes = new Set<KzMode>(['kz_timer', 'kz_simple', 'kz_vanilla'])
const types = new Set<KzRunType>(['pro', 'tp'])

const validateInput = async (req: Request, res: Response, typeToo?: boolean): Promise<{ mode: KzMode, type: KzRunType }> => {
  const result: { mode: KzMode, type: KzRunType } = { mode: 'kz_timer', type: 'pro' }

  const { mode, type } = req.params as { mode: KzMode, type: KzRunType }

  if (!modes.has(mode)) {
    res.status(400).json({ message: 'Unknown KzMode.' })
    throw new Error('Unknown KzMode.')
  }
  result.mode = mode

  if (typeToo) {
    if (!types.has(type)) {
      res.status(400).json({ message: 'Unknown KzType.' })
      throw new Error('Unknown KzType.')
    }
    result.type = type
  }

  return result
}

const router = express.Router()

router.use('/', subscriptionsController)

router.get('/leaderboards/:mode/:type', async (req, res) => {
  const { mode, type } = await validateInput(req, res, true).catch()
  const leaderboards = await getLeaderboards(mode, type)
  res.json(leaderboards)
})

router.get('/player/:mode/:type/:steamId64', async (req, res) => {
  const { mode, type } = await validateInput(req, res, true).catch()
  const count = await getPlayerWrCount(mode, type, req.params.steamId64)
  res.json({ count })
})

router.get('/:mode/:type', async (req, res) => {
  const { mode, type } = await validateInput(req, res, true).catch()
  const wrs = await getWrsForModeAndType(mode, type)
  res.json(wrs)
})

router.get('/:mode', async (req, res) => {
  const { mode } = await validateInput(req, res).catch()
  const wrs = await getWrsForMode(mode)
  res.json(wrs)
})

router.post('/fetch/:mapId/:mode/:type', auth('MapMod'), async (req, res) => {
  const { mode, type } = await validateInput(req, res, true).catch()
  await refetchForMap(parseInt(req.params.mapId, 10), mode, type)
  res.sendStatus(204)
})

router.post('/cleanup', auth('MapMod'), async (req, res) => {
  await cleanup()
  res.sendStatus(204)
})

export default router
