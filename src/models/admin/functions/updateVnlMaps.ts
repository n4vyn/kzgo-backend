import { Completion } from '../../completions/completionModel'
import { KzMap } from '../../maps/mapModel'
import { getAllMaps } from '../../maps/mapRepository'

const updateVnlMaps = async (txt: string): Promise<void> => {
  const vnlPossibleMaps = new Set(txt.split('\n'))

  const vnlCompletions = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    total: 0,
  }

  const maps = await getAllMaps()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapsToUpdate: { id: number, query: any }[] = []

  for (const map of maps) {
    const oldState = map.vp
    if (vnlPossibleMaps.has(map.name)) {
      vnlCompletions[map.tier]++
      map.vp = true
    } else {
      if (map.vp) map.vp = false
    }

    if (map.vp !== oldState) {
      if (map.vp) {
        mapsToUpdate.push({ id: map.id, query: { $set: { vp: true } } })
      } else {
        mapsToUpdate.push({ id: map.id, query: { $unset: { vp: 1 } } })
      }
    }
  }

  vnlCompletions.total = vnlCompletions['1']+vnlCompletions['2']+vnlCompletions['3']+vnlCompletions['4']+vnlCompletions['5']+vnlCompletions['6']+vnlCompletions['7']

  Completion.updateOne({
    mode: 'kz_vanilla',
  }, {
    $set: {
      ...vnlCompletions,
    },
  })
    .then()

  for (const { id, query } of mapsToUpdate) {
    KzMap.updateOne({ id }, query ).then()
  }
}

export {
  updateVnlMaps,
}
