import { ErrorRequestHandler } from 'express'
import Discord from '../utils/Discord'
import logger from '../utils/logger'

export const errorRequestHandler: ErrorRequestHandler = (error, req, res, next) => {
  Discord.sendError(error, req.originalUrl)
  logger.error(error)
  res.status(500).send(error)
  next(error)
}
