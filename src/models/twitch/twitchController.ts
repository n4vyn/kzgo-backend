import Express, { RequestHandler } from 'express'
import { findMapOnPlayersServer, getWrText } from './twitchServices'
import { MapRepo } from '../maps/MapRepo'
import { config } from '../../config'
import { KzMode } from '../../types'

const router = Express.Router()

const modesMap = new Map<string, KzMode>([
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

const auth: RequestHandler = (req, res, next) => {
  // started making this generic but it will be only for nykan anyways.. Sikari will soon finish the new overlay
  if (req.params.secret !== config.server.twitchSecret) {
    res.sendStatus(401)
    return
  }

  next()
}

router.get('/:secret/map', auth, async (req, res) => {
  const map = await findMapOnPlayersServer(config.server.twitchSteamId)

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

router.get('/:secret/tier', auth, async (req, res) => {
  const map = await findMapOnPlayersServer(config.server.twitchSteamId)

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

router.get('/:secret/wr', auth, async (req, res) => {
  const map = await findMapOnPlayersServer(config.server.twitchSteamId)

  if (!map) {
    res.send(errMsg)
    return
  }

  const { q1, q2 } = req.query as { q1: string, q2: string }
  let mode: KzMode = 'kz_timer'
  let stage = '0'

  if (q1 !== 'null') {
    if (/[0-9]+/.test(q1)) {
      stage = q1
    }

    if (modesMap.has(q1)) {
      mode = modesMap.get(q1)!
    }
  }

  if (q2 !== 'null') {
    if (/[0-9]+/.test(q2)) {
      stage = q2
    }

    if (modesMap.has(q2)) {
      mode = modesMap.get(q2)!
    }
  }

  const txt = await getWrText(map.name, stage, mode)
  res.send(txt)
})

export default router
