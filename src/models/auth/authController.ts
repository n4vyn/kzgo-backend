import express from 'express'
import { auth } from '../../middlewares/auth/auth'
import { AuthRepo } from './AuthRepo'
import { createUser, login, setPassword } from './authServices'

const router = express.Router()

router.post('/user/password', async (req, res) => {
  const { setPwToken, password } = req.body

  const user = await AuthRepo.findByPwToken(setPwToken)

  if (!user) {
    res.status(400).json({ message: 'Bad token.' })
    return
  }

  const hashedPw = await setPassword(setPwToken, password)
  user.password = hashedPw

  const token = await login(user, password)

  if (!token) {
    res.sendStatus(401)
    return
  }

  res.json({ token })
})

router.put('/user', auth('JeffBezos'), async (req, res) => {
  const { name, password, roles } = req.body
  const setPwToken = await createUser(name, password, roles)

  res.json({
    setPwToken,
  })
})

router.get('/user', async (req, res) => {
  const header = req.headers.authorization ?? ' '
  const [tokenType, token] = header.split(' ')

  if (tokenType !== 'Bearer') {
    res.sendStatus(400)
    return
  }

  const user = await AuthRepo.findByToken(token)

  if (!user) {
    res.sendStatus(401)
    return
  }

  res.json({
    name: user.name,
    roles: user.roles,
  })
})

router.post('/', async (req, res) => {
  const { name, password } = req.body
  const user = await AuthRepo.findByName(name)

  if (!user) {
    res.sendStatus(401)
    return
  }

  const token = await login(user, password)

  if (!token) {
    res.sendStatus(401)
    return
  }

  res.json({ token })
})

export default router
