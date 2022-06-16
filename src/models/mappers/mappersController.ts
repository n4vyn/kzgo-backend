import Express from 'express'
import { auth } from '../../middlewares/auth/auth'
import { renameMapper, getAllMappers } from './mapperServices'

const router = Express.Router()

router.use(auth('MapMod'))

router.get('/', async (req, res) => {
  res.json((await getAllMappers()))
})

router.post('/rename', async (req, res) => {
  await renameMapper(req.body.steamId, req.body.name)
  res.sendStatus(204)
})

export default router
