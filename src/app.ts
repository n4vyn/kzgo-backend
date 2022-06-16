import express from 'express'
import 'express-async-errors'

import routes from './models/routes'
import logger from './utils/logger'
import { config } from './config'
import { errorRequestHandler } from './middlewares/errorHandler'

let appReadyResolve: CallableFunction

const appReady = new Promise(resolve => {
  appReadyResolve = resolve
})

const app = express()

const port = config.server.port

app.use(express.json())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }

  next()
})

// legacy path redirect
app.get('/vnlservices/ui', (req, res) => {
  res.redirect('https://kzgo.eu/auth/vnl')
})

app.use('/api', routes)

app.use(errorRequestHandler)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((req, res, next) => {
  res.status(404).json({ message: 'Handler for requested endpoint was not found.' })
})

app.listen(port, () => {
  logger.info(`Server started on port ${port}.`)
  appReadyResolve(true)
})

export {
  app,
  appReady,
}
