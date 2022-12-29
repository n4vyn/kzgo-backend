import { EntityRepoAbstract } from '../../db/EntityRepoAbstract'
import { KzMode, KzRunType } from '../../types'
import { RunFromApi } from './interfaces'

interface WorldRecord {
  mapId: number,
  mapName: string,
  // mode: KzMode,
  pro: boolean, // without this I would have to do queries like if (mode === pro) query.tps = {$eq: 0} else $ne
  time: number,
  diff: number | null,
  tps: number,
  playerName: string,
  steamId: string,
  steamId64: string,
  previousSteamId: string | null,
  serverId: number,
  serverName: string,
  createdOn: string,
}

class WrRepository extends EntityRepoAbstract<WorldRecord> {
  constructor (mode: KzMode | 'latest') {
    super(`wrs_${mode}`)
    if (mode !== 'latest') {
      this.collection.createIndex({ mapId: 1, pro: 1 }, { name: 'mapId_1_pro_1', unique: true })
      this.collection.createIndex({ mapName: 1, pro: 1 }, { name: 'mapName_1_pro_1', unique: true })
    }
    this.collection.createIndex({ steamId: 1 }, { name: 'steamId_1' })
    this.collection.createIndex({ steamId64: 1 }, { name: 'steamId64_1' })
  }

  async getAllForType (type: KzRunType): Promise<Pick<WorldRecord, 'mapId' | 'createdOn' | 'time' | 'diff' | 'steamId'>[]> {
    return this.collection.find({
      pro: type === 'pro',
    })
      .project({ mapId: 1, createdOn: 1, time: 1, diff: 1, steamId: 1 })
      .toArray() as any // jeez
  }

  async findByMapIdAndType (mapId: number, type: KzRunType): Promise<WorldRecord | null> {
    return this.collection.findOne({
      mapId,
      pro: type === 'pro',
    })
  }

  async deleteByMapName (mapName: string) {
    return this.collection.deleteMany({ mapName })
  }

  async deleteByMapIds (ids: number[]) {
    return this.collection.deleteMany({ mapId: { $in: ids } })
  }
}

class WrRepositories {
  public readonly kz_timer: WrRepository
  public readonly kz_simple: WrRepository
  public readonly kz_vanilla: WrRepository
  // public readonly latest: WrRepository

  constructor () {
    this.kz_timer = new WrRepository('kz_timer')
    this.kz_simple = new WrRepository('kz_simple')
    this.kz_vanilla = new WrRepository('kz_vanilla')
    // this.latest = new WrRepository('latest')
  }

  async countPlayerWrs (mode: KzMode, type: KzRunType, steamId: string) {
    return this[mode].collection.count({ pro: type === 'pro', steamId })
  }

  async countAndGroupBy (mode: KzMode, type: KzRunType): Promise<{ _id: string, count: number }[]> {
    return this[mode].collection.aggregate([
      { $match: { pro: type === 'pro', steamId: { $ne: null } } },
      { $group: { _id: '$steamId64', count: { $sum: 1 } } },
      { $sort: { 'count': -1 } },
      { $limit: 100 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]).toArray() as any
  }

  async getForMode (mode: KzMode) {
    return this[mode].getAll()
  }

  async getForModeAndType (mode: KzMode, type: KzRunType) {
    return this[mode].collection.find({ pro: type === 'pro' }).toArray()
  }

  async findByMapId (mode: KzMode, type: KzRunType, mapId: number): Promise<WorldRecord | null> {
    return this[mode].collection.findOne({
      mapId,
      pro: type === 'pro',
    })
  }

  // async findLatest (mode: KzMode, type: KzRunType): Promise<WorldRecord | null> {
  //   return this.latest.collection.findOne({
  //     mode,
  //     pro: type === 'pro',
  //   })
  // }

  async insertNew (run: RunFromApi) {
    return this[run.mode].insertOne(this.convertFormat(run, null, null))
  }

  async update (run: RunFromApi, diff: number | null, previousSteamId: string | null) {
    const wr = this.convertFormat(run, diff, previousSteamId)

    return this[run.mode].collection.updateOne({
      mapId: wr.mapId,
      pro: wr.tps === 0,
    }, {
      $set: {
        ...wr,
      },
    }, {
      upsert: true,
    })
  }

  // async upsertLatestWr (run: RunFromApi) {
  //   const wr = this.convertFormat(run, null)
  //   return this.latest.collection.updateOne({
  //     mode: run.mode,
  //     pro: wr.tps === 0,
  //   }, {
  //     $set: { ...wr },
  //   }, {
  //     upsert: true,
  //   })
  // }

  async renameMap (oldName: string, newName: string) {
    const match = { mapName: oldName }
    const set = { $set: { mapName: newName } }

    this.kz_timer.collection.updateMany(match, set)
    this.kz_simple.collection.updateMany(match, set)
    this.kz_vanilla.collection.updateMany(match, set)
    // this.latest.collection.updateMany(match, set)
  }

  private convertFormat (run: RunFromApi, diff: number | null, previousSteamId: string | null): WorldRecord {
    return {
      mapName: run.map_name,
      pro: run.teleports === 0,
      time: run.time,
      diff: diff,
      tps: run.teleports,
      playerName: run.player_name,
      steamId: run.steam_id,
      steamId64: run.steamid64,
      serverId: run.server_id,
      serverName: run.server_name,
      mapId: run.map_id,
      createdOn: run.created_on,
      previousSteamId,
    }
  }
}

export const WrRepos = new WrRepositories()
