import Axios from 'axios'
import { config } from '../../config'
import { Discord } from '../../utils/Discord'

interface SteamResponse {
  steamid: string
  communityvisibilitystate: number
  profilestate: number
  personaname: string
  profileurl: string
  avatar: string
  avatarmedium: string
  avatarfull: string
  avatarhash: string
  personastate: number
  realname: string
  primaryclanid: string
  timecreated: number
  personastateflags: number
  loccountrycode: string
}

export const fetchSteamProfile = async (steamId64: string): Promise<SteamResponse | null> => {
  try {
    const result = await Axios.get(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.steam.apiKey}&steamids=${steamId64}`, {
        timeout: 4000,
      })

    return result.data.response.players[0]
  } catch (error) {
    // this sometimes just fails, had full logs of this stuff for some reason
    if (!error.isAxiosError) {
      Discord.sendError(error, 'Steamdata get non axios error')
    }
  }

  return null
}

export const fetchMultipleSteamProfiles = async (steamId64s: string[]): Promise<SteamResponse[]> => {
  const query = `&steamids=${steamId64s.join(',')}`

  const response = await Axios.get(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}${query}`, {
    })

  return response.data.response.players
}
