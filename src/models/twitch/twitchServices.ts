import { RequestHandler } from 'express'
import { getServerStates } from '../servers/serverServices'
import { fetchSteamProfile } from '../steam/steamServices'
import { RunFromApi } from '../wrs/interfaces'

const namesCache = new Map<string, string>()

const twitchAuth: RequestHandler = (req, res, next) => {
  req.headers.authorization = `Custom ${req.params.secret}`
  next()
}

const findMapOnPlayersServer = async (steamId64: string) => {
  const steamName = await fetchSteamName(steamId64)

  const serverStates = getServerStates().serverStates

  const server = serverStates.find(ss => ss.players.some(p => p.name === steamName))

  if (!server) {
    return undefined
  }

  return server.map
}

const fetchSteamName = async (steamId64: string): Promise<string> => {
  if (namesCache.has(steamId64)) {
    return namesCache.get(steamId64)!
  }

  let steamData = await fetchSteamProfile(steamId64)

  if (!steamData) {
    // try again once, sometimes steam go brr
    steamData = await fetchSteamProfile(steamId64)
  }

  if (!steamData) {
    // TODO:
    throw new Error()
  }

  namesCache.set(steamId64, steamData.name)

  setTimeout(() => {
    namesCache.delete(steamId64)
  }, 300000)

  return namesCache.get(steamId64)!
}

// TODO:
const runToString = (run: RunFromApi): string => {
  if (!run) return 'none'

  const apiTime = run.time

  const time = Math.floor(apiTime)
  const ms = apiTime.toFixed(3).slice(-3)

  let s :string|number = Math.floor(time % 60)
  if (s < 10) s = `0${s}`

  let m :string|number = Math.floor(time/60)

  const h = Math.floor(m/60)

  let tt: string

  if (h != 0) {
    m = m - h*60
    if (m < 10) m = `0${m}`
    tt = `${h}:${m}:${s}.${ms}`
  } else {
    if (m == 0) {
      tt = `${s}.${ms}`
    } else {
      tt = `${m}:${s}.${ms}`
    }
  }

  return `${tt} by ${run.player_name}`
}

export {
  twitchAuth,
  findMapOnPlayersServer,
  runToString,
}
