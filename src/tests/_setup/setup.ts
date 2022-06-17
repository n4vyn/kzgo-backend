import { before } from 'mocha'

import { appReady } from '../../index'
import { dropDatabase } from '../../db'

before(async () => {
  await appReady
  await dropDatabase()
})
