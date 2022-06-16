import express from 'express'
import { auth } from '../../middlewares/auth/auth'
import { MorbiusRepo } from '../mapsWithMapperIds/MorbiusRepo'
import { fetchMapsFromApi } from './functions/fetchMapsFromApi'
import { fetchMapsFromWorkshop } from './functions/fetchMapsFromWorkshop'

const router = express.Router()

router.use(auth('Admin'))

router.post('/fetchMapsFromWorkshop', async (req, res) => {
  try {
    await fetchMapsFromWorkshop()
    res.sendStatus(204)
  } catch (error) {
    res.status(500).send(error)
  }
})

router.get('/releasebatch/:release', async (req, res) => {
  res.json(await MorbiusRepo.getByRelease(req.params.release))
})

router.patch('/releasebatch/:mapName', async (req, res) => {
  res.json(await MorbiusRepo.updateByMapName(req.params.mapName, req.body.data))
})

router.post('/fetchMapsFromApi', async (req, res) => {
  try {
    await fetchMapsFromApi()
    res.sendStatus(204)
  } catch (error) {
    res.status(500).send(error)
  }
})

export default router
