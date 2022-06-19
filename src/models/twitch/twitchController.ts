import Express from 'express'
import Axios from 'axios'
import { findMapOnPlayersServer, runToString, twitchAuth } from './twitchServices'
import { auth } from '../../middlewares/auth/auth'
import { MapRepo } from '../maps/MapRepo'

const router = Express.Router()

const modesMap = new Map([
  ['kz_timer', 'kz_timer'],
  ['kzt', 'kz_timer'],
  ['KZT', 'kz_timer'],
  ['kz_simple', 'kz_simple'],
  ['skz', 'kz_simple'],
  ['SKZ', 'kz_simple'],
  ['kz_vanilla', 'kz_vanilla'],
  ['vnl', 'kz_vanilla'],
  ['VNL', 'kz_vanilla'],
])

const errMsg = 'not found'

router.use(auth('TwitchStreamer'))

// todo: this doesn't work anymore

router.get('/:secret/map', twitchAuth, async (req, res) => {
  const map = await findMapOnPlayersServer(req.steamId64!)

  if (!map) {
    res.send(errMsg)
    return
  }

  if (map.tier) {
    const mapData = await MapRepo.findByName(map.name)

    if (!mapData) {
      res.send(errMsg)
      return
    }

    res.send(`${map.name} [t${map.tier}] by ${mapData.mapperNames.join(', ')}`)
  } else {
    res.send(`${map.name} - not global`)
  }

})

router.get('/:secret/tier', twitchAuth, async (req, res) => {
  const map = await findMapOnPlayersServer(req.steamId64!)

  if (!map) {
    res.send(errMsg)
    return
  }

  if (map.tier) {
    res.send(`${map.name} [t${map.tier}]`)
  } else {
    res.send(`${map.name} - not global`)
  }
})

router.get('/:secret/wr', twitchAuth, async (req, res) => {
  const map = await findMapOnPlayersServer(req.steamId64!)

  if (!map) {
    res.send(errMsg)
    return
  }

  const { q1, q2 } = req.query as { q1: string, q2: string }
  let mode = 'kz_timer'
  let stage = '0'

  if (q1 !== 'null') {
    if (/[0-9]+/.test(q1)) {
      stage = q1
    }

    if (modesMap.has(q1)) {
      mode = modesMap.get(q1) as string
    }
  }

  if (q2 !== 'null') {
    if (/[0-9]+/.test(q2)) {
      stage = q2
    }

    if (modesMap.has(q2)) {
      mode = modesMap.get(q2) as string
    }
  }

  const promises = [
    await Axios.get(`https://kztimerglobal.com/api/v2.0/records/top?map_name=${map.name}&stage=${stage}&modes_list_string=${mode}&has_teleports=true&limit=1`),
    await Axios.get(`https://kztimerglobal.com/api/v2.0/records/top?map_name=${map.name}&stage=${stage}&modes_list_string=${mode}&has_teleports=false&limit=1`),
  ]

  const [resTp, resPro] = await Promise.all(promises)

  res.send(`${map.name}; TP: ${runToString(resTp.data[0])}; PRO: ${runToString(resPro.data[0])}`)
})

export default router
