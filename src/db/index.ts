import { MongoClient } from 'mongodb'
import { config } from '../config'
import { Logger } from '../utils/Logger'

const client = new MongoClient(config.db.uri, { connectTimeoutMS: 5000 })

export const connect = async (): Promise<void> => {
  await client.connect()
  await client.db().command({ ping: 1 })
  Logger.info('Succesfully connected to mongo.')
}

export const getDb = () => {
  return client.db()
}

export const dropDatabase = async (): Promise<void> => {
  try {
    if (config.env !== 'testing') return
    client.db().dropDatabase()
    Logger.info('Database cleared.')
  } catch (error) {
    Logger.error(`Error dropping database: \n${error}`)
  }
}
