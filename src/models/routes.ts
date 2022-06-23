import express from 'express'

import auth from './auth/authController'
import admin from './admin/adminController'
import completions from './completions/completionsController'
import maps from './maps/mapsController'
import mappers from './mappers/mappersController'
import skzservices from './skzservices/skzservicesController'
import steam from './steam/steamController'
import servers from './servers/serversController'
import twitch from './twitch/twitchController'
import vnlservices from './vnlservices/vnlservicesController'
import wrs from './wrs/wrsController'

const router = express.Router()

router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: "Hey, thanks for checking in, I'm ♫ still a piece of garbage ♫",
  })
})

router.get('/flags/:country', (req, res) => {
  if (!/^[A-Z]{2}$/.test(req.params.country)) {
    res.sendStatus(400)
    return
  }

  res.sendFile(`/flags/${req.params.country}.png`, { root: '.' })
})

router.use('/auth', auth)
router.use('/admin', admin)
router.use('/completions', completions)
router.use('/maps', maps)
router.use('/mappers', mappers)
router.use('/skzservices', skzservices)
router.use('/steam', steam)
router.use('/servers', servers)
router.use('/twitch', twitch)
router.use('/vnlservices', vnlservices)
router.use('/wrs', wrs)

export default router
