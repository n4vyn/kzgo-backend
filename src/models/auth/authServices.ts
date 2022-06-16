import bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import { Role } from '../../middlewares/auth/auth'

import { AuthEntity, AuthRepo } from './AuthRepo'

export const setPassword = async (setPwToken: string, password: string) => {
  const hashedPw = await bcrypt.hash(password, 10)
  await AuthRepo.setPassword(setPwToken, hashedPw)
  return hashedPw
}

export const createUser = async (name: string, password: string, roles: Role[]): Promise<string> => {
  const hashedPw = await bcrypt.hash(password, 10)
  const token = randomBytes(24).toString('hex')
  await AuthRepo.create(name, hashedPw, roles, token)
  return token
}

export const login = async (user: AuthEntity, password: string): Promise<string | null> => {
  if (!(await bcrypt.compare(password, user.password))) {
    return null
  }

  const token = randomBytes(24).toString('hex')

  await AuthRepo.setToken(user.name, token)

  return token
}
