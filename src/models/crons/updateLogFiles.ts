import { createStreams } from '../../utils/Logger'
import { Cron } from './Cron'

new Cron(
  'updateLogFiles',
  '0 1 0 1 * *',
  createStreams,
)
