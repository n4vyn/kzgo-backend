import { Logger } from '../utils/Logger'
import { config as defaultConfig } from './default'

let envSpecificConfig = {}

if (process.env.NODE_ENV) {
  try {
    envSpecificConfig = require(`./${process.env.NODE_ENV}.json`)
  } catch (error) {
    Logger.error(`Env specific config for ${process.env.NODE_ENV} was not loaded: \n${error}`)
  }
}

const mergeConfigs = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recursion = (cfg: any, target: any) => {
    for (const [key, val] of Object.entries(cfg)) {
      if (typeof val !== 'object' && !(val instanceof Array)) {
        target[key] = val
      } else {
        recursion(cfg[key], target[key])
      }
    }
  }

  recursion(envSpecificConfig, defaultConfig)
}

mergeConfigs()

export const config = {
  ...defaultConfig,
}
