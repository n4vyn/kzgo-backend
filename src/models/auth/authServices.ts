import bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import { Role } from '../../middlewares/auth/auth'

import { AuthEntity, AuthRepo } from './AuthRepo'

export const createUser = async (name: string, password: string, roles: Role[]) => {
  const hashedPw = await bcrypt.hash(password, 10)
  await AuthRepo.create(name, hashedPw, roles)
}

export const login = async (user: AuthEntity, password: string) => {
  if (!(await bcrypt.compare(password, user.password))) {
    return null
  }

  const buffer = randomBytes(24)
  const token = buffer.toString('hex')

  await AuthRepo.setToken(user.name, token)

  return token
}
