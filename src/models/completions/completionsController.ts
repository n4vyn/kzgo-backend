import express from 'express'
import { auth } from '../../middlewares/auth/auth'
import { KzMode } from '../../types'
import { Logger } from '../../utils/Logger'
import { recalculateCompletions } from '../admin/functions/fetchMapsFromApi'
import { CompletionRepo } from './CompletionRepo'

const router = express.Router()

const modes = new Set(['kz_timer', 'kz_simple', 'kz_vanilla'])

router.get('/:mode', async (req, res) => {
  if (!modes.has(req.params.mode)) {
    res.sendStatus(400)
    return
  }

  CompletionRepo.findByModeOrThrow(req.params.mode as KzMode)
    .then(result => {
      res.json(result)
    })
    .catch(error => {
      Logger.error(error)
      res.json(error)
    })
})

router.post('/recalculate', auth('MapMod'), async (req, res) => {
  await recalculateCompletions()
  res.sendStatus(204)
})

export default router
