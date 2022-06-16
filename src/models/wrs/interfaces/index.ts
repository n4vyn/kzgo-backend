import { KzMode } from '../../../types'

export interface RunFromApi {
  id: number,
  steamid64: string,
  player_name: string,
  steam_id: string,
  server_id: number,
  map_id: number,
  stage: number,
  mode: KzMode,
  tickrate: number,
  time: number,
  teleports: number,
  created_on: string,
  updated_on: string,
  updated_by: number,
  place: number,
  top_100: number,
  top_100_overall: number,
  server_name: string,
  map_name: string,
  points: number,
  record_filter_id: number,
  replay_id: number,
}

export interface WorldRecordBc { // broadcast format
  mapName: string,
  playerName: string,
  steamId: string,
  time: number,
  teleports: number,
  mode: string,
  diff: number | null,
  createdOn: string,
}
