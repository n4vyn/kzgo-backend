import { before } from 'mocha'

import { appReady } from '../../app'
import { dropDatabase } from '../../db'

before(async () => {
  await appReady
  await dropDatabase()
})
