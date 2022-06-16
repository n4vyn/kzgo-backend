import { EntityRepoAbstract } from '../../db/EntityRepoAbstract'
import { KzMode } from '../../types'

export interface CompletionTiers {
  1: number,
  2: number,
  3: number,
  4: number,
  5: number,
  6: number,
  7: number,
  total: number,
}

interface Completion {
  mode: KzMode,
  tp: CompletionTiers,
  pro: CompletionTiers
}

class CompletionRepository extends EntityRepoAbstract<Completion> {
  constructor () {
    super('completions')
    this.collection.createIndex({ mode: 1 }, { name: 'mode_1', unique: true })
  }

  async findByModeOrThrow (mode: KzMode): Promise<Completion> {
    const completion = await this.collection.findOne({ mode })
    if (completion === null) throw new Error(`Completion for mode ${mode} not found.`)
    return completion
  }

  async updateBoth (mode: KzMode, pro: CompletionTiers, tp: CompletionTiers) {
    return this.collection.updateOne({
      mode,
    }, {
      $set: {
        pro,
        tp,
      },
    }, {
      upsert: true,
    })
  }

  async updateTier (mode: KzMode, tierDec: number | 'total', tierInc: number | 'total', isKzPro = false) {
    const incObject = {}

    incObject[`pro.${tierDec}`] = -1
    incObject[`pro.${tierInc}`] = 1

    if (!isKzPro) {
      incObject[`tp.${tierDec}`] = -1
      incObject[`tp.${tierInc}`] = 1
    }

    await this.collection.updateOne({
      mode,
    }, {
      $inc: incObject,
    })
  }

  async incTierAndTotal (mode: KzMode, tier: number, value: -1 | 1, isKzPro = false) {
    const incObject = {}

    incObject[`pro.${tier}`] = value
    incObject['pro.total'] = value

    if (!isKzPro) {
      incObject[`tp.${tier}`] = value
      incObject['tp.total'] = value
    }

    return this.collection.updateOne({
      mode,
    }, {
      $inc: incObject,
    })
  }
}

export const CompletionRepo = new CompletionRepository()
