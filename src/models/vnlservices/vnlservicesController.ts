import Express from 'express'
import { auth } from '../../middlewares/auth/auth'
import { CompletionRepo } from '../completions/CompletionRepo'
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

export default router
