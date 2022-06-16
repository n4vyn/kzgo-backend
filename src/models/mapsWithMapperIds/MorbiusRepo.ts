import { EntityRepoAbstract } from '../../db/EntityRepoAbstract'

export interface MapWithMapperIds {
  mapName: string,
  mapperIds: string[],
  release: string
}

// this is only for the pre-release phase, I have to fetch mapper info from steam
// and then during release I pair it with data from api, after that data from this collection is not touched
// todo: I might as well just clear it each time, since no edits are done in this collection but on the actual maps

// I couldn't think of a name that would not be confusing/hard to read in code so I just went with this because I am hilarious
class MorbiusRepository extends EntityRepoAbstract<MapWithMapperIds> {
  constructor () {
    super('morbius')
    this.collection.createIndex({ mapName: 1 }, { name: 'mapName_1', unique: true })
    this.collection.createIndex({ release: 1 }, { name: 'release_1' })
  }

  async getByRelease (release: string) {
    return this.collection.find({ release }).project({ _id: 0 }).toArray()
  }

  async updateByMapName (mapName: string, data: MapWithMapperIds) {
    this.collection.updateOne({
      mapName,
    }, {
      $set: {
        ...data,
      },
    })
  }
}

export const MorbiusRepo = new MorbiusRepository()
