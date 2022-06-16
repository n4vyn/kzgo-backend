import Axios from 'axios'
import Discord from '../../../utils/Discord'
import logger from '../../../utils/logger'
import { MapperRepo } from '../../mappers/MapperRepo'
import { MapWithMapperIds, MorbiusRepo } from '../../mapsWithMapperIds/MorbiusRepo'

// is always the same every release
const collectionID = '2360739736'

interface IWorkshopFileDetails {
  publishedfileid: string,
  result: number
  creator: string,
  creator_app_id: number,
  consumer_app_id: number,
  filename: string,
  file_size: number,
  file_url: string,
  hcontent_file: string,
  preview_url: string,
  hcontent_preview: string,
  title: string,
  description: string,
  time_created: number,
  time_updated: number,
  visibility: number,
  banned: number,
  ban_reason: string,
  subscriptions: number,
  favorited: number,
  lifetime_subscriptions: number,
  lifetime_favorited: number,
  views: number,
  tags: { tag : string }[],
}

interface ICollectionDetails {
  publishedfileid: string,
  result: number,
  children: {
    publishedfileid: string,
    sortorder: number,
    filetype: number
  }[]
}

/**
 * Fetches maps from collection. Saves them into MapWithMapperIds collection with mapperIds
 * fetched from steam workshop api along with release identifier (e.g. Jan 2022).
 * Also adds new mappers to Mapper collection (if their steamId64 doesn't already exist there)
 */
const fetchMapsFromWorkshop = async (): Promise<void> => {
  const result: MapWithMapperIds[] = []
  const date = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  // kek i actually benchmarked this, 10 times faster, VERY USEFUL FOR ME DOING IT ONCE HERE YES
  // const release = `${date.toString().slice(4, 7)} ${date.getFullYear()}`
  const release = `${months[date.getMonth()]} ${date.getFullYear()}`

  //get all items in collection of new release
  const collectionDetails = await getCollectionDetails()

  const mapperIdToMapperName = new Map((await MapperRepo.getAll()).map(x => ([x.steamId, x.name])))
  const mappersToInsert: { steamId: string, name: string }[] = []

  for (const item of collectionDetails.children) {
    const workshopFileDetails = await getWorkshopFileDetails(item.publishedfileid)

    if (!workshopFileDetails.title) {
      Discord.sendEmbed({
        channel: Discord.Channels.log,
        color: Discord.Colors.orange,
        title: 'Fetch maps from workshop - map without title',
        content: JSON.stringify(workshopFileDetails),
      })
      continue
    }

    const mapName = workshopFileDetails.title.toLowerCase()

    if (!mapperIdToMapperName.has(workshopFileDetails.creator)) {
      const mapperName = await getMapperName(workshopFileDetails.creator)
      mapperIdToMapperName.set(workshopFileDetails.creator, mapperName)
      mappersToInsert.push({ steamId: workshopFileDetails.creator, name: mapperName })
      logger.info('new mapper added', mapperName)
    }

    result.push({ mapName, mapperIds: [workshopFileDetails.creator], release })
  }

  await MorbiusRepo.insertMany(result, { ordered: false })
    .catch(error => {
      Discord.sendEmbed({
        channel: Discord.Channels.log,
        color: Discord.Colors.orange,
        title: 'Fetch maps from workshop - insert to db',
        content: error,
      })
    })

  await MapperRepo.insertMany(mappersToInsert)
}

const getCollectionDetails = async (): Promise<ICollectionDetails> => {
  const url = 'https://api.steampowered.com/ISteamRemoteStorage/GetCollectionDetails/v1/?format=json'
  const res = await Axios.post(url, `collectioncount=1&publishedfileids[0]=${collectionID}`)
  return res.data.response.collectiondetails[0]
}

const getWorkshopFileDetails = async (workshopID: string): Promise<IWorkshopFileDetails> => {
  const url = 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/?format=json'
  const res = await Axios.post(url, `itemcount=1&publishedfileids[0]=${workshopID}`)
  return res.data.response.publishedfiledetails[0]
}

const getMapperName = async (steamId64: string): Promise<string> => {
  const res = await Axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId64}`)
  return res.data.response.players[0].personaname
}

export {
  fetchMapsFromWorkshop,
}
