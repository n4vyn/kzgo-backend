import { EntityRepoAbstract } from '../../db/EntityRepoAbstract'

interface Mapper {
  steamId: string,
  name: string,
}

class MapperRepository extends EntityRepoAbstract<Mapper> {
  constructor () {
    super('mappers')
    this.collection.createIndex({ steamId: 1 }, { name: 'steamId_1', unique: true })
    this.collection.createIndex({ name: 1 }, { name: 'name_1', unique: true })
  }

  async rename (steamId: string, newName: string) {
    return this.collection.updateOne({
      steamId,
    }, {
      $set: {
        name: newName,
      },
    })
  }
}

export const MapperRepo = new MapperRepository()
