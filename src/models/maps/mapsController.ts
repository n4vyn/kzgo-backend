import express from 'express'
import { auth } from '../../middlewares/auth/auth'
import { editMap, getAllMapsCached, getMrdates, recacheMaps, renameMap, setMrdates } from './mapServices'
import { MapRepo } from './MapRepo'
import { CompletionRepo } from '../completions/CompletionRepo'
import { WrRepos } from '../wrs/WrRepos'
import { KzMode } from '../../types'

const router = express.Router()

// Hello czech people. Mrdat stands for Map Release Dates and I know I am funny, thanks.
router.get('/mrd', async (req, res) => {
  res.json(getMrdates())
})

router.post('/recache', auth('MapMod'), async (req, res) => {
  recacheMaps()
  res.sendStatus(204)
})

// --- top secret auth routes from here

router.post('/mrd', auth('MapMod'), async (req, res) => {
  try {
    setMrdates(req.body.data)
    res.sendStatus(204)
  } catch (error) {
    res.status(500).send(error)
  }
})

router.post('/deglobal/:mapName', auth('MapMod'), async (req, res) => {
  const result = await MapRepo.deleteByName(req.params.mapName)
  if (!result.ok || result.value === null) {
    res.sendStatus(500)
    return
  }

  const map = result.value

  if (!map.name.startsWith('skz') && !map.name.startsWith('vnl')) {
    await CompletionRepo.incTierAndTotal('kz_timer', result.value.tier, -1, req.params.mapName.startsWith('kzpro'))
  }
  if (map.sp) {
    await CompletionRepo.incTierAndTotal('kz_simple', result.value.tier, -1, req.params.mapName.startsWith('kzpro'))
  }
  if (map.vp) {
    await CompletionRepo.incTierAndTotal('kz_vanilla', result.value.tier, -1, req.params.mapName.startsWith('kzpro'))
  }

  for (const mode of ['kz_timer', 'kz_simple', 'kz_vanilla'] as KzMode[]) {
    await WrRepos[mode].deleteByMapName(req.body.mapName)
  }

  res.sendStatus(204)
})

router.post('/rename', auth('MapMod'), async (req, res) => {
  await renameMap(req.body.renameFrom, req.body.renameTo)
  res.sendStatus(204)
})

// --- most general handlers at the bottom

router.patch('/', auth('MapMod'), async (req, res) => {
  await editMap(req.body.data.id, req.body.data)
  res.sendStatus(204)
})

router.get('/regex/:name', auth('MapMod'), async (req, res) => {
  const maps = await MapRepo.getByRegex(new RegExp(req.params.name, 'i'))
  res.json(maps)
})

router.get('/:name', async (req, res) => {
  const maps = await MapRepo.findByName(req.params.name)
  res.json(maps)
})

router.get('/', (req, res) => {
  res.json(getAllMapsCached())
})

export default router
