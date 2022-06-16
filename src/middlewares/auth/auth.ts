import type { RequestHandler } from 'express'
import { AuthRepo } from '../../models/auth/AuthRepo'
import logger from '../../utils/logger'

export type Role = 'JeffBezos' | 'Admin' | 'MapMod' | 'VnlMod' | 'TwitchStreamer'

export const auth = (requiredRole: Role): RequestHandler => {
  return async (req, res, next) => {
    const header = req.headers.authorization ?? ' '
    const [tokenType, token] = header.split(' ')

    if (tokenType !== 'Bearer') {
      res.sendStatus(401)
      return
    }

    const { originalUrl, method } = req

    const accessRecord = await AuthRepo.findByToken(token)

    if (accessRecord === null) {
      res.sendStatus(401)
      return
    }

    const allowed = accessRecord.roles.some(role => role === 'JeffBezos' || (role === 'Admin' && requiredRole !== 'JeffBezos') || role === requiredRole)
    logger.info(`[ACCESS${allowed ? '+' : '-'}] ${accessRecord.name} accessed ${method} ${originalUrl}.`)

    if (allowed) {
      next()
    } else {
      res.sendStatus(401)
      return
    }
  }
}
