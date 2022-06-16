/* eslint-disable no-console */
import fs from 'fs'

interface ILevel {
  color: string,
  file?: fs.WriteStream
}

const levels: Record<string, ILevel> = {
  info: {
    color: '\x1b[32m',
  },
  error: {
    color: '\x1b[31m',
  },
}

for (const level of Object.keys(levels)) {
  // have to use process cause config depends on logger
  levels[level].file = fs.createWriteStream(`./logs/${process.env.NODE_ENV}/${level}.log`, { flags: 'a' })
}

const log = (level: keyof typeof levels, msg: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${levels[level].color}%s \x1b[0m%s`, level, msg)
  }

  if (process.env.NODE_ENV !== 'testing') {
    levels[level].file!.write(`[${new Date().toISOString()}] ${msg}\n`)
  }
}

// did this as quick fix cause I had winston logger already imported everywhere and found out it sucks when you pass error into it
export default class Logger {
  public static readonly info = (msg: string, msg2 = '') => {
    log('info', msg + msg2)
  }

  public static readonly error = (error: Error | string) => {
    if (error instanceof Error) {
      log('error', `${error.name}: ${error.message} \n ${error.stack}`)
    } else {
      log('error', error)
    }
  }
}
