import { EntityRepoAbstract } from '../../db/EntityRepoAbstract'

export interface Cron {
  name: string,
  timePattern: string,
  lastRunDate: Date,
}

class CronRepository extends EntityRepoAbstract<Cron> {
  constructor () {
    super('crons')
    this.collection.createIndex({ name: 1 }, { name: 'name_1', unique: true })
  }

  async findByName (name: string): Promise<Cron | null> {
    return this.collection.findOne({ name })
  }

  async upsert (name: string, timePattern: string) {
    return this.collection.updateOne(
      { name },
      { $set: { timePattern } },
      { upsert: true },
    )
  }

  async updateLastRunDate (name: string) {
    return this.collection.updateOne({ name }, {
      $currentDate: {
        lastRunDate: true,
      },
    })
  }
}

export const CronRepo = new CronRepository()
