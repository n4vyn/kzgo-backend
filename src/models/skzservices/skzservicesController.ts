import Express from 'express'
import { auth } from '../../middlewares/auth/auth'
import { CompletionRepo } from '../completions/CompletionRepo'
import { MapRepo } from '../maps/MapRepo'
import { recacheMaps } from '../maps/mapServices'
import { refetchForMap } from '../wrs/wrServices'

const router = Express.Router()

router.use(auth('SkzMod'))

router.post('/maps/bulk', async (req, res) => {
  const updatedMaps = req.body
  const { pro, tp } = await CompletionRepo.findByModeOrThrow('kz_simple')

  for (const { id, sp, tier, isKzPro } of updatedMaps) {
    const val = sp ? 1 : -1
    pro[tier] += val
    pro.total += val

    if (!isKzPro) {
      tp[tier] += val
      tp.total += val
    }

    await MapRepo.updateById(id, { sp })
  }

  await CompletionRepo.updateBoth('kz_simple', pro, tp)
  await recacheMaps()

  res.sendStatus(204)
})


router.post('/wrs/refetch/:mapId', async (req, res) => {
  if (!/^[0-9]{3,4}$/.test(req.params.mapId)) {
    res.status(400).json({ message: 'Invalid mapId.' })
    return
  }

  const mapId = parseInt(req.params.mapId, 10)

  await refetchForMap(mapId, 'kz_simple', 'pro')
  await refetchForMap(mapId, 'kz_simple', 'tp')

  res.sendStatus(204)
})

export default router
