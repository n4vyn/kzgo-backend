import express from 'express'
import { fetchSteamProfile } from './steamServices'

const router = express.Router()

router.get('/:steamid64', async (req, res) => {
  if (!/^[0-9]{17}$/.test(req.params.steamid64)) {
    res.status(400).json({ message: 'Invalid steamId64.' })
  }

  const steamData = await fetchSteamProfile(req.params.steamid64)

  if (!steamData) {
    res.sendStatus(500)
    return
  }

  res.json({
    country: steamData.loccountrycode,
    avatar: steamData.avatarfull,
    name: steamData.personaname,
  })
})

export default router
