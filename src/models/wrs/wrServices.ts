import Axios from 'axios'
import webpush from 'web-push'

import { Discord } from '../../utils/Discord'
import { KzMode, KzRunType } from '../../types'
import { WrRepos } from './WrRepos'
import { SubscriptionRepo } from './subscriptions/SubscriptionRepo'
import { config } from '../../config'
import { RunFromApi, WorldRecordBc } from './interfaces'
import { MapRepo } from '../maps/MapRepo'
import { fetchMultipleSteamProfiles } from '../steam/steamServices'
import { Logger } from '../../utils/Logger'

webpush.setVapidDetails(`mailto:${config.webPush.email}`, config.webPush.publicKey, config.webPush.privateKey)

export const getPlayerWrCount = async (mode: KzMode, type: KzRunType, steamId: string) => {
  return WrRepos.countPlayerWrs(mode, type, steamId)
}

export const getLeaderboards = async (mode: KzMode, type: KzRunType) => {
  const wrs = await WrRepos.countAndGroupBy(mode, type)
  const steams = await fetchMultipleSteamProfiles(wrs.map(x => x._id))
  return wrs.map(wr => ({ playerName: steams.find(s => s.steamid === wr._id)?.personaname, ...wr }))
}

export const getWrsForModeAndType = async (mode: KzMode, type: KzRunType) => {
  return WrRepos.getForModeAndType(mode, type)
}

export const getWrsForMode = async (mode: KzMode) => {
  return WrRepos.getForMode(mode)
}

export const cleanup = async () => {
  const maps = await MapRepo.getAll({ projection: { id: 1, sp: 1, vp: 1 } })
  const mapmap = new Map(maps.map(map => [map.id, { vp: map.vp, sp: map.sp }]))

  for (const mode of ['kz_timer', 'kz_simple', 'kz_vanilla'] as KzMode[]) {
    const all = await WrRepos[mode].getAll({ projection: { mapId: 1 } }) as { mapId: number }[]

    const moreover = new Set<number>()

    for (const { mapId } of all) {
      if (!mapmap.has(mapId)) {
        moreover.add(mapId)
      } else if (mode === 'kz_simple' && !mapmap.get(mapId)?.sp) {
        moreover.add(mapId)
      } else if (mode === 'kz_vanilla' && !mapmap.get(mapId)?.vp) {
        moreover.add(mapId)
      }
    }

    await WrRepos[mode].deleteByMapIds([...moreover])
  }
}

export const broadcast = async (payload: WorldRecordBc[]) => {
  if (payload.length === 0) return

  const subscriptions = await SubscriptionRepo.getAll()
  for (const sub of subscriptions) {
    webpush.sendNotification(sub, JSON.stringify(payload))
      .catch(error => {
        // if (error.body.includes('unsubscribed') || error.body.includes('expired')) {
        Logger.error(error)
        Logger.error(error.body)
        Discord.sendError(error)
        if (error.statusCode === 410) {
          SubscriptionRepo.deleteByEndpoint(sub.endpoint)
            .then()
            .catch(e => {
              Discord.sendError(e)
            })
        }
      })
  }
}

export const processRuns = async (runs: RunFromApi[], mode: KzMode, type: KzRunType): Promise<WorldRecordBc[]> => {
  // kz api is shit and sometimes skips wr and puts it in later after some newer WR is considered latest
  // therefore this logic that tried to optimise database reads skipped it too

  // let i = -1

  // const latestWrDate = (await WrRepos.findLatest(mode, type))?.createdOn ?? '0'

  // for (const run of runs) {
  //   if (run.created_on <= latestWrDate) break
  //   i++
  // }

  const currentWrMap = new Map((await WrRepos[mode].getAllForType(type)).map(wr => ([wr.mapId, wr])))

  const wrs: WorldRecordBc[] = []

  // for (i; i > -1; i--) {
  for (const run of runs.reverse()) {
    // const run = runs[i]

    // const oldRun = await WrRepos[mode].findByMapIdAndType(run.map_id, type)
    const oldRun = currentWrMap.get(run.map_id)

    let diff: number | null = null

    if (!oldRun) {
      await WrRepos.insertNew(run)
    } else {
      if (oldRun.createdOn >= run.created_on) continue
      diff = calcDiff(oldRun.time, run.time, oldRun.diff)
      await WrRepos.update(run, diff, oldRun.steamId)
    }

    currentWrMap.set(run.map_id, { mapId:run.map_id, createdOn: run.created_on, time: run.time, diff, steamId: run.steam_id })

    wrs.push({
      mapName: run.map_name,
      playerName: run.player_name,
      steamId: run.steam_id,
      time: run.time,
      teleports: run.teleports,
      mode: run.mode,
      diff: diff,
      createdOn: run.created_on,
      previousSteamId: oldRun?.steamId ?? null,
    })

    // if (i === 0) {
    //   await WrRepos.upsertLatestWr(run)
    // }
  }

  return wrs
}

/**
 * null means worlds first
 * old diff is only needed for testing
 * it could be used when wrs are tied, but i think returinng 0 is fine
 * negative diff should be fine to return, it will indicate old wr being cheated
 */
export const calcDiff = (oldTime: number, newTime: number, oldDiff: number | null): number | null => {
  if (!oldTime) return null
  const diff = ((oldTime * 1000) - (newTime * 1000)) / 1000
  if (diff === 0) return oldDiff
  return parseFloat(diff.toFixed(3))
}

export const refetchForMap = async (mapId: number, mode: KzMode, type: KzRunType): Promise<boolean> => {
  try {
    const response = await Axios.get(`https://kztimerglobal.com/api/v2.0/records/top?map_id=${mapId}&stage=0&modes_list_string=${mode}&has_teleports=${type === 'tp'}&limit=2`)

    const run: RunFromApi = response.data[0]

    if (!run) {
      // ? Nevim, asi nic
      // todo
    } else {
      let diff: number | null = -1

      if (response.data[1]) {
        diff = calcDiff(response.data[1].time, run.time, 0)
      }

      await WrRepos.update(run, diff, response.data[1].steamId)
    }

    return true
  } catch (error) {
    Logger.error(error)
    return false
  }
}
