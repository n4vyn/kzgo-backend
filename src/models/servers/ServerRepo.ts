import { EntityRepoAbstract } from '../../db/EntityRepoAbstract'

interface Server {
  name: string,
  label: string,
  ip: string,
  port: number,
  type: 'VIP' | 'PUB'
}

class ServerRepository extends EntityRepoAbstract<Server> {
  constructor () {
    super('servers')
  }
}

export const ServerRepo = new ServerRepository()
