import Axios from 'axios'
import Discord from '../../../utils/Discord'
import { KzMap, MapRepo } from '../../maps/MapRepo'
import { MapperRepo } from '../../mappers/MapperRepo'
import { MorbiusRepo } from '../../mapsWithMapperIds/MorbiusRepo'
import { CompletionRepo, CompletionTiers } from '../../completions/CompletionRepo'
import { KzMode } from '../../../types'

/**
 * - fetches maps from kz api, fetches all filters from kz api
 * - gets all local records of maps, mappers and join table
 * - goes through all maps from api, calculates the number of bonuses from filters
 * - checks against current map record with tier and bonuses, if it needs to be updated
 * - then checks only for new maps = mapName doesn't exist locally (idk about this now, should probably use ID?) - TODO
 * - gets map info from kz api and assigns mapperNames using mapperIdToMapperName collection
 *   (^ has to be prepared pre-release running the workshop script from admin ui)
 * - sets sp, vp (sp currently fully manual, vp depending on what is defined in vnlPossibleMaps.txt which some people manage)
 * - inserts new maps, updates edited maps, calls function to recalculate completions and sends report to discord log channel
 * - check for maps that exist locally but not in kz api - send deglobal warning to discord
 */
const fetchMapsFromApi = async () => {

  //get all maps
  const response = await Axios.get('http://kztimerglobal.com/api/v2.0/maps?limit=9999&is_validated=true')
  const mapsFromApi = response.data

  const currentMaps = new Map((await MapRepo.getAll()).map(m => {
    return [
      m.name,
      {
        tier: m.tier,
        bonuses: m.bonuses,
      },
    ]
  }))

  const mapsToMapperIds = new Map((await MorbiusRepo.getAll()).map(m => {
    return [
      m.mapName,
      m.mapperIds,
    ]
  }))

  const mapperIdToMapperName = new Map((await MapperRepo.getAll()).map(m => {
    return [
      m.steamId,
      m.name,
    ]
  }))

  //get record for every stage of each map
  const resultRecordFilters = await Axios.get('http://kztimerglobal.com/api/v2.0/record_filters?mode_ids=200&limit=9999&has_teleports=true')

  //filter out records that have only stage 0 (no bonus)
  const bonusFilters: { map_id: number, stage: number }[] = resultRecordFilters.data.filter(filter => filter.stage !== 0)
  const mapIdToBonusCount = new Map<number, number>()

  for (const { map_id, stage } of bonusFilters) {
    if (mapIdToBonusCount.get(map_id) ?? 0 < stage) {
      mapIdToBonusCount.set(map_id, stage)
    }
  }

  const newMaps: KzMap[] = []
  const mapNamesWithUnknownMapper: string[] = []
  const mapsToUpdate: Record<number, { tier?: number, bonuses?: number }> = {}
  const mapNamesFromApi = new Set<string>()
  const degloballedMaps: string[] = []

  for (const map of mapsFromApi) {
    mapNamesFromApi.add(map.name)

    const bonuses = mapIdToBonusCount.get(map.id) ?? 0

    if (currentMaps.has(map.name)) {
      const o = currentMaps.get(map.name)!
      const obj: { tier?: number, bonuses?: number } = {}
      if (o.tier !== map.difficulty) obj.tier = map.difficulty
      if (o.bonuses !== bonuses) obj.bonuses = bonuses
      if (obj.tier || obj.bonuses !== undefined) mapsToUpdate[map.id] = obj
    }

    if (currentMaps.has(map.name)) continue

    let mapperIds = mapsToMapperIds.get(map.name)

    if (!mapperIds) {
      mapNamesWithUnknownMapper.push(map.name)
      mapperIds = []
    }

    const mapObject: KzMap = {
      name: map.name,
      id: map.id,
      tier: map.difficulty,
      workshopId: map.workshop_url.split('=').pop(),
      bonuses,
      sp: false,
      vp: false,
      mapperNames: mapperIds.map(id => mapperIdToMapperName.get(id) ?? ''), // todo
      mapperIds: mapperIds,
      date: map.created_on === '0001-01-01T00:00:00' ? '2018-01-09T00:00:00' : map.created_on,
    }

    if (map.name.startsWith('skz')) {
      mapObject.sp = true
    }
    else if (map.name.startsWith('vnl')) {
      mapObject.vp = true
    }
    else {
      mapObject.sp = true
    }

    newMaps.push(mapObject)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [name, _] of currentMaps) {
    if (!mapNamesFromApi.has(name)) {
      degloballedMaps.push(name)
    }
  }

  if (newMaps.length !== 0 ) {
    await MapRepo.insertMany(newMaps, { ordered: false })
  }

  if (Object.keys(mapsToUpdate).length === 0) {
    for (const [id, obj] of Object.entries(mapsToUpdate)) {
      await MapRepo.updateById(parseInt(id, 10), obj)
    }
  }

  await recalculateCompletions()

  Discord.sendEmbed({
    color: Discord.Colors.aqua,
    title: 'Fetch maps from api',
    channel: Discord.Channels.log,
    asCodeBlock: false,

    content: `\`\`\`New maps\n${ JSON.stringify(newMaps, null, 2)}\`\`\``,
  })

  Discord.sendEmbed({
    color: Discord.Colors.aqua,
    title: 'Fetch maps from api',
    channel: Discord.Channels.log,
    asCodeBlock: false,

    content: `\`\`\`Updated maps\n${ JSON.stringify(mapsToUpdate)
    }\n\nDegloballed maps\n${ degloballedMaps.join(', ')
    }\n\nMaps with unknown mapper\n${ mapNamesWithUnknownMapper.join(', ') }\`\`\``,
  })

}

async function recalculateCompletions () {
  const maps = await MapRepo.getAll({ projection: { name: 1, tier: 1, sp: 1, vp: 1 } })

  const modes: KzMode[] = ['kz_timer', 'kz_simple', 'kz_vanilla']
  const proCompletions: {[key in KzMode]: CompletionTiers} = {
    'kz_timer': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, total: 0 },
    'kz_simple': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, total: 0 },
    'kz_vanilla': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, total: 0 },
  }
  const tpCompletions = JSON.parse(JSON.stringify(proCompletions))

  for (const map of maps) {
    const isKzPro = map.name.startsWith('kzpro')

    if (!map.name.startsWith('skz') && !map.name.startsWith('vnl')) {
      proCompletions.kz_timer[map.tier]++
      if (!isKzPro) tpCompletions.kz_timer[map.tier]++
    }

    if (map.sp) {
      proCompletions.kz_simple[map.tier]++
      if (!isKzPro) tpCompletions.kz_simple[map.tier]++
    }

    if (map.vp) {
      proCompletions.kz_vanilla[map.tier]++
      if (!isKzPro) tpCompletions.kz_vanilla[map.tier]++
    }
  }

  for (const mode of modes) {
    proCompletions[mode].total = Object.values(proCompletions[mode]).reduce((prev: number, curr: number) => curr + prev, 0)
    tpCompletions[mode].total = Object.values(tpCompletions[mode]).reduce((prev: number, curr: number) => curr + prev, 0)

    CompletionRepo.updateBoth(mode, proCompletions[mode], tpCompletions[mode])
      .then()
      // .catch(error => {
      //   Discord.sendError(error, 'fetchMapsFromApi - Completion.updateOne')
      //   // logToDiscord(new MessageEmbed({
      //   //   color: '#ffa500',
      //   //   title: 'fetchMapsFromApi - Completion.updateOne',
      //   //   description: `\`\`\`${ e }\`\`\``,
      //   // }))
      // })
  }
}

export {
  fetchMapsFromApi,
  recalculateCompletions,
}
