import Gamedig, { QueryResult, Player } from 'gamedig'
import { Logger } from '../../utils/Logger'
import { MapRepo } from '../maps/MapRepo'
import { ServerRepo } from './ServerRepo'

interface IServerState {
  ip: string,
  port: number,
  type: string,
  label: string,
  name: string,
  map: {
    name: string,
    tier: number
  },
  players: Player[],
  maxPlayers: number,
  tags: string,
  errBefore: boolean,
}

interface ThankYouTypescriptThisIsNecessaryYes {
  tags: string | null
}

const serverStates: IServerState[] = []
let lastUpdated = '---'

ServerRepo.getAll()
  .then(servers => {
    for (const s of servers) {
      serverStates.push({
        ...s,
        name: 'loading',
        map: {
          name: 'loading',
          tier: 0,
        },
        players: [],
        tags: 'loading',
        errBefore: false,
        maxPlayers: 0,
      })
    }
    fetchServerStates()
  })
  .catch(error => {
    Logger.error(error)
  })

setInterval(() => {
  fetchServerStates()
}, 1000*30)

const fetchServerStates = (): void => {
  const promises: Promise<QueryResult>[] = []
  lastUpdated = new Date().toISOString()

  for (const server of serverStates) {
    promises.push(Gamedig.query({
      type: 'csgo',
      host: server.ip,
      port: server.port,
    }))
  }

  for (let i = 0; i < promises.length; i++) {
    const promise = promises[i]

    promise.then(async state => {
      if (!state) return

      let mapName = state.map.split('/').pop()!.toLowerCase()

      const mapInfo = await MapRepo.findByName(mapName)
      let tier = 0

      if (mapInfo) {
        tier = mapInfo.tier
      } else {
        // if mapname is too long it comes shorter, gotta retry, but can't do it right away because bkz_measure could false find to bkz_measure2_b03
        const retry = await MapRepo.findByName(new RegExp(`^${mapName}`))
        if (retry) {
          mapName = retry.name
          tier = retry.tier
        }
      }

      serverStates[i] = {
        ...serverStates[i],
        name: state.name,
        map: {
          name: mapName,
          tier: tier,
        },
        tags: (state.raw as ThankYouTypescriptThisIsNecessaryYes)?.tags ?? '',
        players: state.players,
        maxPlayers: state.maxplayers,
        errBefore: false,
      }
    })
      .catch(() => {
        if (serverStates[i].errBefore) {
          serverStates[i] = {
            ...serverStates[i],
            name: 'Server not responding',
            map: {
              name: '-------',
              tier: 0,
            },
            tags: 'rip',
            players: [],
            maxPlayers: 0,
          }
        } else {
          serverStates[i].errBefore = true
          for (const player of serverStates[i].players) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (player?.raw as any).time += 30
          }
        }
      })
  }
}

const getServerStates = () => {
  return { serverStates, lastUpdated }
}

export {
  getServerStates,
}
