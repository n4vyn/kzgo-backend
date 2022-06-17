import { CronJob } from 'cron'
import { Logger } from '../../utils/Logger'
import { Discord } from '../../utils/Discord'
import { CronRepo } from './CronRepo'

export class Cron {
  private job: CronJob

  constructor (
    private readonly name: string,
    timePattern: string,
    process: () => Promise<void>,
  ) {
    CronRepo.upsert(name, timePattern)
      .then(() => {
        this.job = new CronJob(
          timePattern,
          this.wrapProcess(process),
        )

        this.job.start()
      })
  }

  private wrapProcess (process: () => Promise<void>) {
    return async () => {
      await process()
        .catch(error => {
          Logger.error(error)
          Discord.sendError(error, `${this.name} cron failed`)
        })

      this.afterProcess()
    }
  }

  private afterProcess () {
    CronRepo.updateLastRunDate(this.name)
  }
}
