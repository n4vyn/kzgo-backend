import Axios from 'axios'
import { KzMode, KzRunType } from '../../types'
import { MapRepo } from '../maps/MapRepo'
import { RunFromApi, WorldRecordBc } from '../wrs/interfaces'
import { broadcast, processRuns } from '../wrs/wrServices'
import { Cron } from './Cron'

const url = 'https://kztimerglobal.com/api/v2.0/records/top/recent?tickrate=128&stage=0&place_top_at_least=1&limit=50'

const combinations: { mode: KzMode, type: KzRunType }[] = [
  { mode: 'kz_timer', type: 'pro' },
  { mode: 'kz_timer', type: 'tp' },
  { mode: 'kz_simple', type: 'pro' },
  { mode: 'kz_simple', type: 'tp' },
  { mode: 'kz_vanilla', type: 'pro' },
  { mode: 'kz_vanilla', type: 'tp' },
]

let recordsToBroadcast: WorldRecordBc[] = []

const process = async () => {
  for (const c of combinations) {
    const response = await Axios.get(`${url}&modes_list=${c.mode}&has_teleports=${c.type === 'tp'}`)
    const processedRuns = await processRuns(response.data as RunFromApi[], c.mode, c.type)
    recordsToBroadcast.push(...processedRuns)
  }
  // filter out map newer than 2 days because there is a lot of wrs on new maps and it would spam
  const mapsToFetch = new Set(recordsToBroadcast.map(rec => rec.mapName))

  const maps = await MapRepo.getWithQuery({
    name: { $in: [...mapsToFetch] },
  }, {
    projection: { name: 1, date: 1 },
  })

  const mapmap = new Map(maps.map(({ name, date }) => [name, date]))

  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  recordsToBroadcast = recordsToBroadcast.filter(rec => new Date(mapmap.get(rec.mapName) ?? 0) < twoDaysAgo)

  //b-a sestupne, a-b vzestupne
  recordsToBroadcast.sort((a, b) => {
    return new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()
  })

  // 31 records was 4604Bytes, it's not possible to get over 8k Bytes so I'm not looping it
  if (Buffer.byteLength(JSON.stringify(recordsToBroadcast)) > 3950) {
    const half = Math.floor(recordsToBroadcast.length / 2)
    broadcast(recordsToBroadcast.slice(0, half))
    broadcast(recordsToBroadcast.slice(half))
  } else {
    broadcast(recordsToBroadcast)
  }

  recordsToBroadcast = []
}

new Cron(
  'fetchWrs',
  '0 */10 * * * *',
  process,
)
