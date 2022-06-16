import { CompletionRepo } from '../../completions/CompletionRepo'
import { MapRepo } from '../MapRepo'

const updateVnlMaps = async (txt: string): Promise<void> => {
  const vnlPossibleMaps = new Set(txt.split('\n'))

  const proCompletions = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    total: 0,
  }

  const tpCompletions = JSON.parse(JSON.stringify(proCompletions))

  const maps = await MapRepo.getAll()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const mapsToUpdate: { id: number, query: any }[] = []
  const mapsToUpdate: { id: number, vp: boolean | undefined }[] = []

  for (const map of maps) {
    const oldState = map.vp
    const isKzPro = map.name.startsWith('kzpro')
    if (vnlPossibleMaps.has(map.name)) {
      proCompletions[map.tier]++
      if (!isKzPro) tpCompletions[map.tier]++
      map.vp = true
    } else {
      if (map.vp) map.vp = false
    }

    if (map.vp !== oldState) {
      if (map.vp) {
        // mapsToUpdate.push({ id: map.id, query: { $set: { vp: true } } })
        mapsToUpdate.push({ id: map.id, vp: true })
      } else {
        // mapsToUpdate.push({ id: map.id, query: { $unset: { vp: 1 } } })
        mapsToUpdate.push({ id: map.id, vp: undefined })
      }
    }
  }

  // vnlCompletions.total = vnlCompletions['1']+vnlCompletions['2']+vnlCompletions['3']+vnlCompletions['4']+vnlCompletions['5']+vnlCompletions['6']+vnlCompletions['7']
  proCompletions.total = Object.values(proCompletions).reduce((prev: number, curr: number) => curr + prev, 0)
  tpCompletions.total = Object.values(tpCompletions).reduce((prev: number, curr: number) => curr + prev, 0)

  await CompletionRepo.updateBoth('kz_vanilla', proCompletions, tpCompletions)

  for (const { id, vp } of mapsToUpdate) {
    MapRepo.updateById(id, { vp: vp })
    // KzMap.updateOne({ id }, query ).then()
  }
}

export {
  updateVnlMaps,
}
