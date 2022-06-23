import express from 'express'
import { auth } from '../../middlewares/auth/auth'
import { deglobalMap, editMap, getAllMapsCached, getMrdates, recacheMaps, renameMap, setMrdates } from './mapServices'
import { MapRepo } from './MapRepo'

const router = express.Router()

router.get('/mrd', async (req, res) => {
  res.json(getMrdates())
})

router.get('/regex/:name', auth('MapMod'), async (req, res) => {
  const maps = await MapRepo.getByRegex(new RegExp(req.params.name, 'i'))
  res.json(maps)
})

router.get('/:name', async (req, res) => {
  const map = await MapRepo.findByName(req.params.name)
  res.json(map)
})

router.get('/', (req, res) => {
  res.json(getAllMapsCached())
})


router.post('/recache', auth('MapMod'), async (req, res) => {
  recacheMaps()
  res.sendStatus(204)
})

router.post('/mrd', auth('MapMod'), async (req, res) => {
  try {
    setMrdates(req.body.data)
    res.sendStatus(204)
  } catch (error) {
    res.status(500).send(error)
  }
})

router.post('/deglobal/:mapName', auth('MapMod'), async (req, res) => {
  await deglobalMap(req.params.mapName)
  res.sendStatus(204)
})

router.post('/rename', auth('MapMod'), async (req, res) => {
  await renameMap(req.body.renameFrom, req.body.renameTo)
  res.sendStatus(204)
})


router.patch('/', auth('MapMod'), async (req, res) => {
  await editMap(req.body.data.id, req.body.data)
  res.sendStatus(204)
})

export default router
