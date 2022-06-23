import { Filter, FindOptions } from 'mongodb'
import { EntityRepoAbstract } from '../../db/EntityRepoAbstract'

export interface KzMap {
  id: number
  name: string
  tier: number
  workshopId: string
  bonuses: number
  sp: boolean
  vp: boolean
  mapperNames: string[]
  mapperIds: string[]
  date: string
}

type Unrequire<T> = { [K in keyof T]?: T[K] }

type UpdateInput = Unrequire<Omit<KzMap, 'id'>>

class MapRepository extends EntityRepoAbstract<KzMap> {
  constructor () {
    super('maps')
    this.collection.createIndex({ id: 1 }, { name: 'id_1', unique: true })
    this.collection.createIndex({ name: 1 }, { name: 'name_1', unique: true })
  }

  async getWithQuery (filter: Filter<KzMap>, options: FindOptions): Promise<KzMap[]> {
    return this.collection.find(filter, options).toArray()
  }

  async getByRegex (name: RegExp): Promise<KzMap[]> {
    return this.collection.find({ name }).toArray()
  }

  async findByName (name: string | RegExp): Promise<KzMap | null> {
    return this.collection.findOne({ name })
  }

  async findById (id: number): Promise<KzMap | null> {
    return this.collection.findOne({ id })
  }

  async updateById (id: number, mapData: UpdateInput) {
    return this.collection.updateOne({
      id,
    }, {
      $set: {
        ...mapData,
      },
    })
  }

  async findAndDeleteByName (name: string) {
    return this.collection.findOneAndDelete({ name })
  }

  async rename (oldName: string, newName: string) {
    return this.collection.updateOne({
      name: oldName,
    }, {
      $set: {
        name: newName,
      },
    })
  }

  async renameMapper (mapperId: string, newName: string) {
    return this.collection.updateMany({
      mapperIds: {
        $elemMatch: {
          $eq: mapperId,
        },
      },
    }, {
      $set: {
        'mapperNames.$': newName,
      },
    })
  }
}

export const MapRepo = new MapRepository()
