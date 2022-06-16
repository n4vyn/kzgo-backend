import * as assert from 'assert'

import { describe, it } from 'mocha'
import request from 'supertest'

import { app } from '../../app'
import { config } from '../../config'

describe('Auth API', () => {
  it('should rename map in Maps, MapsWithMapperIds and all WRs', async () => {
    await request(app)
      .post('/api/maps/rename')
      .set({
        Authorization: `Bearer ${config.server.tokens.admin}`,
      })
      .send({
        renameFrom: 'kz_slidebober',
        renameTo: 'kz_bober',
      })
      .expect(204)

    // get from everywhere and check for renames
  })

})
