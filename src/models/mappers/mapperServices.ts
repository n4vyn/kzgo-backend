import { MapRepo } from '../maps/MapRepo'
import { recacheMaps } from '../maps/mapServices'
import { MapperRepo } from './MapperRepo'

const getAllMappers = async () => {
  return MapperRepo.getAll()
}

const renameMapper = async (mapperId: string, newName: string) => {
  await MapperRepo.rename(mapperId, newName)
  await MapRepo.renameMapper(mapperId, newName)
  await recacheMaps()
}

export {
  getAllMappers,
  renameMapper,
}
