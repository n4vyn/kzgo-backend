import type { Express } from 'express'
import { createStreams } from './utils/Logger'

export let app: Express

let appReadyResolve: CallableFunction

export const appReady = new Promise(resolve => {
  appReadyResolve = resolve
})

// makinig sure everything is loaded in order
createStreams()
  .then(async () => {
    const { connect } = await import('./db')
    await connect()

    const { initFixtures } = await import('./utils/fixtures')
    await initFixtures()

    const { Discord } = await import('./utils/Discord')
    await Discord.ready

    import('./models/crons')

    const { start } = await import('./app')
    app = await start()

    appReadyResolve(1)
  })
