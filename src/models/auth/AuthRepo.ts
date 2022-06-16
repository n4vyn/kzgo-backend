import { EntityRepoAbstract } from '../../db/EntityRepoAbstract'
import { Role } from '../../middlewares/auth/auth'

export interface AuthEntity {
  name: string
  password: string
  token: string | null
  roles: Role[]
  setPwToken?: string
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

  async findByPwToken (setPwToken: string): Promise<AuthEntity | null> {
    return this.collection.findOne({ setPwToken })
  }

  async create (name: string, hashedPw: string, roles: Role[], setPwToken: string) {
    return this.collection.insertOne({
      name,
      password: hashedPw,
      roles,
      token: null,
      setPwToken,
    })
  }

  async setPassword (setPwToken: string, hashedPw: string) {
    return this.collection.updateOne({
      setPwToken,
    }, {
      $set: {
        password: hashedPw,
      },
      $unset: {
        setPwToken: 1,
      },
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
