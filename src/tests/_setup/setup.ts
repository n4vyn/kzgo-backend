import { before } from 'mocha'

import { appReady } from '../../app'
import { dropDatabase } from '../../db/index_mongoose'

before(async () => {
  await appReady
  await dropDatabase()
})
