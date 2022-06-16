import { fetchMapsFromApi } from '../admin/functions/fetchMapsFromApi'
import { Cron } from './Cron'

new Cron(
  'mapSync',
  '0 0 5 * * *',
  fetchMapsFromApi,
)
