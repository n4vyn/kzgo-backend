import { EntityRepoAbstract } from '../../db/EntityRepoAbstract'
import { Role } from '../../middlewares/auth/auth'

export interface AuthEntity {
  name: string
  password: string
  token: string | null
  roles: Role[]
}

class AuthRepository extends EntityRepoAbstract<AuthEntity> {
  constructor () {
    super('auth')
    this.collection.createIndex({ name: 1 }, { name: 'name_1', unique: true })
    this.collection.createIndex({ token: 1 }, { name: 'token_1' })
  }

  async findByName (name: string): Promise<AuthEntity | null> {
    return this.collection.findOne({ name })
  }

  async findByToken (token: string): Promise<AuthEntity | null> {
    return this.collection.findOne({ token })
  }

  async create (name: string, hashedPw: string, roles: Role[]) {
    return this.collection.insertOne({
      name,
      password: hashedPw,
      roles,
      token: null,
    })
  }

  async setToken (name: string, token: string) {
    return this.collection.findOneAndUpdate({
      name,
    }, {
      $set: {
        token,
      },
    })
  }
}

export const AuthRepo = new AuthRepository()
