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

const runToString = (run: RunFromApi): string => {
  if (!run) return 'none'
  const seconds = Math.floor(run.time)
  const ms = run.time.toFixed(3).slice(-3)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor((seconds % 3600) % 60)

  const pad = (num: number) => (`0${num}`).slice(-2)
  const result = `${pad(m)}:${pad(s)}.${ms} by ${run.player_name}`

  if (h > 0) {
    return `${h}:${result}`
  }

  return result
}

export {
  twitchAuth,
  findMapOnPlayersServer,
  runToString,
}
