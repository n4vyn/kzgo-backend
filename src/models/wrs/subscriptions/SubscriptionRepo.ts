import { EntityRepoAbstract } from '../../../db/EntityRepoAbstract'

interface Subscription {
  endpoint: string,
  expirationTime: string,
  keys: {
    p256dh: string,
    auth: string,
  },
}

class SubscriptionRepository extends EntityRepoAbstract<Subscription> {
  constructor () {
    super('subscriptions')
    this.collection.createIndex({ endpoint: 1 }, { name: 'endpoint_1', unique: true })
  }

  async findByEndpoint (endpoint: string): Promise<Subscription | null> {
    return this.collection.findOne({ endpoint })
  }

  async deleteByEndpoint (endpoint: string) {
    return this.collection.deleteOne({ endpoint })
  }
}

export const SubscriptionRepo = new SubscriptionRepository()
