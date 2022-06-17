import { ErrorRequestHandler } from 'express'
import { Discord } from '../utils/Discord'
import { Logger } from '../utils/Logger'

export const errorRequestHandler: ErrorRequestHandler = (error, req, res, next) => {
  Discord.sendError(error, req.originalUrl)
  Logger.error(error)
  res.status(500).send(error)
  next(error)
}
