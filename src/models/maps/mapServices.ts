import fs from 'fs'
import { KzMode } from '../../types'
import { CompletionRepo } from '../completions/CompletionRepo'
import { WrRepos } from '../wrs/WrRepos'
import { KzMap, MapRepo } from './MapRepo'

let mrdates = JSON.parse(fs.readFileSync('./src/fileDB/mrd.json', 'utf8'))

let cachedMaps: KzMap[]

MapRepo.getAll()
  .then(maps => {
    cachedMaps = maps
  })

export const recacheMaps = async (): Promise<void> => {
  cachedMaps = await MapRepo.getAll()
}

setInterval(() => {
  recacheMaps()
}, 60000)

export const getAllMapsCached = (): KzMap[] => {
  return cachedMaps
}

export const getMrdates = () => {
  return mrdates
}

export const setMrdates = (mapReleaseDatesStringHehe: string): void => {
  fs.writeFileSync('./src/fileDB/mrd.json', mapReleaseDatesStringHehe, 'utf-8')
  mrdates = JSON.parse(mapReleaseDatesStringHehe)
}

export const renameMap = async (renameFrom: string, renameTo: string) => {
  await MapRepo.rename(renameFrom, renameTo)

  // todo decide if unnecessary, probably yes
  // await MapWithMapperIds.updateOne({ mapName: renameFrom }, {
  //   $set: { mapName: renameTo },
  // })

  await WrRepos.renameMap(renameFrom, renameTo)
}

export const deglobalMap = async (name: string) => {
  const result = await MapRepo.findAndDeleteByName(name)

  if (!result.ok || result.value === null) {
    throw new Error(`Delete failed. ${result.lastErrorObject}`)
  }

  const map = result.value

  if (!map.name.startsWith('skz') && !map.name.startsWith('vnl')) {
    await CompletionRepo.incTierAndTotal('kz_timer', result.value.tier, -1, name.startsWith('kzpro'))
  }
  if (map.sp) {
    await CompletionRepo.incTierAndTotal('kz_simple', result.value.tier, -1, name.startsWith('kzpro'))
  }
  if (map.vp) {
    await CompletionRepo.incTierAndTotal('kz_vanilla', result.value.tier, -1, name.startsWith('kzpro'))
  }

  for (const mode of ['kz_timer', 'kz_simple', 'kz_vanilla'] as KzMode[]) {
    await WrRepos[mode].deleteByMapName(name)
  }
}

export const editMapTier = async (map: KzMap, newTier: number) => {
  const isKzPro = map.name.startsWith('kzpro')
  const promises: Promise<void>[] = []

  if (!map.name.startsWith('skz') && !map.name.startsWith('vnl')) {
    promises.push(CompletionRepo.updateTier('kz_timer', map.tier, newTier, isKzPro))
  }

  if (map.sp) {
    promises.push(CompletionRepo.updateTier('kz_simple', map.tier, newTier, isKzPro))
  }

  if (map.vp) {
    promises.push(CompletionRepo.updateTier('kz_vanilla', map.tier, newTier, isKzPro))
  }

  MapRepo.updateById(map.id, { tier: newTier })

  await Promise.all(promises)
}

export const editMap = async (id: number, updatedMap: KzMap) => {
  const currentMap = await MapRepo.findById(id)

  if (!currentMap) {
    // TODO
    throw new Error(`Map to update with id ${id} not found.`)
  }

  if (currentMap.tier !== updatedMap.tier) {
    await editMapTier(currentMap, updatedMap.tier)
    currentMap.tier = updatedMap.tier
  }

  const isKzPro = currentMap.name.startsWith('kzpro')

  if (currentMap.sp !== updatedMap.sp) {
    if (updatedMap.sp) {
      CompletionRepo.incTierAndTotal('kz_simple', updatedMap.tier, 1, isKzPro)
    } else {
      CompletionRepo.incTierAndTotal('kz_simple', updatedMap.tier, -1, isKzPro)
    }

    currentMap.sp = updatedMap.sp
  }

  if (currentMap.vp !== updatedMap.vp) {
    if (updatedMap.sp) {
      CompletionRepo.incTierAndTotal('kz_vanilla', updatedMap.tier, 1, isKzPro)
    } else {
      CompletionRepo.incTierAndTotal('kz_vanilla', updatedMap.tier, -1, isKzPro)
    }

    currentMap.vp = updatedMap.vp
  }

  currentMap.name = updatedMap.name
  currentMap.mapperNames = updatedMap.mapperNames
  currentMap.mapperIds = updatedMap.mapperIds
  currentMap.bonuses = updatedMap.bonuses
  currentMap.date = updatedMap.date

  await MapRepo.updateById(currentMap.id, currentMap)
}
