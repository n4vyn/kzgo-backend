/* eslint-disable @typescript-eslint/no-var-requires */

import { Logger } from '../Logger'
import { config } from '../../config'
import { recalculateCompletions } from '../../models/admin/functions/fetchMapsFromApi'
import { AuthRepo } from '../../models/auth/AuthRepo'
import { createUser } from '../../models/auth/authServices'
import { MapperRepo } from '../../models/mappers/MapperRepo'
import { MapRepo } from '../../models/maps/MapRepo'
import { MorbiusRepo } from '../../models/mapsWithMapperIds/MorbiusRepo'
import { ServerRepo } from '../../models/servers/ServerRepo'
import { WrRepos } from '../../models/wrs/WrRepos'

const insertMapFixtures = async () => {
  if (await MapRepo.isNotEmpty()) return
  const mapFixtures = require('./maps.json')
  await MapRepo.insertMany(mapFixtures)
  await recalculateCompletions()
  Logger.info('Map fixtures inserted.')
}

const insertMapperFixtures = async () => {
  if (await MapperRepo.isNotEmpty()) return
  const mapperFixtures = require('./mappers.json')
  await MapperRepo.insertMany(mapperFixtures)
  Logger.info('Mapper fixtures inserted.')
}

// const insertMapWithMapperIdsFixtures = async () => {
//   if (await MorbiusRepo.isNotEmpty()) return
//   const mapWithMapperIdsFixtures = require('./mapWithMapperIdsFixtures.json')
//   await MorbiusRepo.insertMany(mapWithMapperIdsFixtures)
//   Logger.info('MapWithMapperIds fixtures inserted.')
// }

const insertWrFixtures = async () => {
  if (await WrRepos.kz_timer.isNotEmpty()) return
  const kztWrFixtures = require('./kzts.json')
  const skzWrFixtures = require('./skzs.json')
  const vnlWrFixtures = require('./vnls.json')
  await WrRepos.kz_timer.insertMany(kztWrFixtures)
  await WrRepos.kz_simple.insertMany(skzWrFixtures)
  await WrRepos.kz_vanilla.insertMany(vnlWrFixtures)
  Logger.info('WR fixtures inserted.')
}

const insertServerFixtures = async () => {
  if (await ServerRepo.isNotEmpty()) return
  const serverFixtures = require('./servers.json')
  await ServerRepo.insertMany(serverFixtures)
  Logger.info('Server fixtures inserted.')
}

const insertAuthFixtures = async () => {
  if (await AuthRepo.isNotEmpty()) return
  createUser('admin', 'admin', ['Admin'])
  createUser('mapmod', 'mapmod', ['MapMod'])
  createUser('vnlmod', 'vnlmod', ['VnlMod'])
  Logger.info('Server fixtures inserted.')
}

const initFixtures = async () => {
  if (config.env === 'production') return
  Logger.info('Init fixtures called.')
  insertMapFixtures()
  insertMapperFixtures()
  // insertMapWithMapperIdsFixtures()
  insertWrFixtures()
  insertServerFixtures()
  insertAuthFixtures()
}

export {
  initFixtures,
}
