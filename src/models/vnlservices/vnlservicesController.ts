import Express from 'express'
import fs from 'fs'
import Discord from '../../utils/Discord'
import { auth } from '../../middlewares/auth/auth'
import { CompletionRepo } from '../completions/CompletionRepo'
import { updateVnlMaps } from '../maps/functions/updateVnlMaps'
import { MapRepo } from '../maps/MapRepo'
import { recacheMaps } from '../maps/mapServices'

const router = Express.Router()

router.use(auth('VnlMod'))

router.post('/maps/bulk', async (req, res) => {
  const updatedMaps = req.body
  const { pro, tp } = await CompletionRepo.findByModeOrThrow('kz_vanilla')

  for (const { id, vp, tier, isKzPro } of updatedMaps) {
    const val = vp ? 1 : -1
    pro[tier] += val
    pro.total += val

    if (!isKzPro) {
      tp[tier] += val
      tp.total += val
    }

    await MapRepo.updateById(id, { vp })
  }

  await CompletionRepo.updateBoth('kz_vanilla', pro, tp)
  await recacheMaps()

  res.sendStatus(204)
})

router.post('/maps', (req, res) => {
  fs.writeFile('./src/fileDB/vnlPossibleMaps.txt', req.body.txt, error => {
    if (error) {
      Discord.sendError(error, 'VnlServices write error')
      return
    }

    updateVnlMaps(req.body.txt)

    res.sendStatus(200)
  })
})

router.get('/maps', (req, res) => {
  fs.readFile('./src/fileDB/vnlPossibleMaps.txt', 'utf-8', (error, data) => {
    if (error) {
      Discord.sendError(error, 'VnlServices read error')
      return
    }
    res.json({ data })
  })
})

export default router
