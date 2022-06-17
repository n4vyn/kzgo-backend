import express, { Express } from 'express'
import 'express-async-errors'

import routes from './models/routes'
import { Logger } from './utils/Logger'
import { config } from './config'
import { errorRequestHandler } from './middlewares/errorHandler'

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
  res.redirect('https://kzgo.eu/admin/vnl')
})

app.use('/api', routes)

app.use(errorRequestHandler)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((req, res, next) => {
  res.status(404).json({ message: 'Handler for requested endpoint was not found.' })
})

export const start = (): Promise<Express> => {
  return new Promise(resolve => {
    app.listen(port, () => {
      Logger.info(`Server started on port ${port}.`)
      resolve(app)
    })
  })
}

