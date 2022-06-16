import express from 'express'
import { fetchSteamProfile } from './steamServices'

const router = express.Router()

router.get('/:steamid64', async (req, res) => {
  const steamData = await fetchSteamProfile(req.params.steamid64)

  if (!steamData) {
    res.sendStatus(500)
    return
  }

  res.json(steamData)
})

export default router
