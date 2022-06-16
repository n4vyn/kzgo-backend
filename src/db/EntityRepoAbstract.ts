import { BulkWriteOptions, Collection, FindOptions, OptionalUnlessRequiredId, InsertOneOptions } from 'mongodb'
import { getDb } from '.'

export abstract class EntityRepoAbstract<T> {
  public collection: Collection<T>

  constructor (collectionName: string) {
    this.collection = getDb().collection<T>(collectionName)
  }

  async isNotEmpty (): Promise<boolean> {
    return !!(await this.collection.findOne({}))
  }

  async getAll (options?: FindOptions): Promise<T[]> {
    return this.collection.find({}, options).project({ _id: 0 }).toArray() as unknown as T[] //.. why typescript, why
  }

  async insertOne (docs: OptionalUnlessRequiredId<T>, options?: InsertOneOptions) {
    return this.collection.insertOne(docs, { ...options })
  }

  async insertMany (docs: OptionalUnlessRequiredId<T>[], options?: BulkWriteOptions) {
    return this.collection.insertMany(docs, { ...options })
  }
}
