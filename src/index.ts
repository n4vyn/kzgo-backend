import { connect } from './db'

// eslint-disable-next-line @typescript-eslint/no-empty-function
export let appReady = new Promise(()=>{})

// makinig sure everything is loaded in order
connect()
  .then(async () => {
    const { initFixtures } = await import('./utils/fixtures')
    await initFixtures()

    const { default: Discord } = await import('./utils/Discord')
    await Discord.ready

    import('./models/crons')

    appReady = (await import('./app')).appReady // todo
  })

// import { KzMode, KzRunType } from './types'
// connect()
//   .then(async () => {
//     const { MapRepo } = await import('./models/maps/MapRepo')

//     const maps = await MapRepo.getAll()

//     const combinations: { mode: KzMode, type: KzRunType }[] = [
//       // { mode: 'kz_timer', type: 'pro' },
//       { mode: 'kz_timer', type: 'tp' },
//       { mode: 'kz_simple', type: 'pro' },
//       { mode: 'kz_simple', type: 'tp' },
//       { mode: 'kz_vanilla', type: 'pro' },
//       { mode: 'kz_vanilla', type: 'tp' },
//     ]

//     const wait = () => {
//       return new Promise(resolve => {
//         setTimeout(() => {
//           resolve(1)
//         }, 750)
//       })
//     }

//     const { refetchForMap } = await import('./models/wrs/wrServices')

//     let time = Date.now()

//     for (const { mode, type } of combinations) {
//       for (const map of maps) {
//         const time2 = Date.now()
//         if (mode === 'kz_simple' && !map.sp) continue
//         if (mode === 'kz_vanilla' && !map.vp) continue
//         await refetchForMap(map.id, mode, type)
//         console.log(map.id, mode, type, time2-time)
//         time = time2
//         await wait()
//       }
//     }
//   })
