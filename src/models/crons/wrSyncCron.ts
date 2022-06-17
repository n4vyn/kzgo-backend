import { Cron } from './Cron'
import { MapRepo } from '../maps/MapRepo'
import { KzMode, KzRunType } from '../../types'
import { refetchForMap } from '../wrs/wrServices'

new Cron(
  'wrSync',
  '0 0 2 * * *',
  process,
)

async function process () {
  const maps = await MapRepo.getAll()

  const combinations: { mode: KzMode, type: KzRunType }[] = [
    { mode: 'kz_timer', type: 'pro' },
    { mode: 'kz_timer', type: 'tp' },
    { mode: 'kz_simple', type: 'pro' },
    { mode: 'kz_simple', type: 'tp' },
    { mode: 'kz_vanilla', type: 'pro' },
    { mode: 'kz_vanilla', type: 'tp' },
  ]

  // 1675+1612+886 = 4173 WRs (June 2022)
  // 4173 * 1,2 = 5000 (very roughly 5000 seconds)
  // aka 1h 23m of runtime, not sure how often it is okay to run this

  const wait = () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(1)
      }, 750)
    })
  }

  // let time = Date.now()

  for (const { mode, type } of combinations) {
    for (const map of maps) {
      // const time2 = Date.now()
      if (mode === 'kz_simple' && !map.sp) continue
      if (mode === 'kz_vanilla' && !map.vp) continue
      await refetchForMap(map.id, mode, type)
      // console.log(map.id, mode, type, time2-time)
      // time = time2
      await wait()
    }
  }
}
