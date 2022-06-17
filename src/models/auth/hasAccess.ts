// I wanted to make a 'fully automatic' auth middleware, that could be required even just once globally
// and no further specifications would be needed (like I didn't want to import the middleware everywhere, call it in every route
// and even import and specify required roles in each of the middleware use)
// I liked the idea of having something like endpointSettings where I would define required roles for each endpoint
// However I kept changing stuff around and it ended up as probably not the best solution for this case,
// I don't have any overlapping roles required and the structure of this api is kind of weird so the setting object becomes a bit unnecessarily messy
// However it was fun to make and I would like to find use for it in other projects or at least share it with yall on git

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from '../../utils/Logger'
import { AuthRepo } from './AuthRepo'
import { endpointSettings, IEndpointSettings, Roles } from './endpointSettings'

const hasAccess = async (
  token: string,
  originalUrl: string,
  method: string,
  params: { [key: string]: string },
): Promise<boolean> => {
  console.log('---------')

  const requestEndpoint = originalUrl.split('/').slice(2)
  const paramKeys = Object.keys(params)

  const endpoint = goDeep(endpointSettings, requestEndpoint, paramKeys)

  console.log({
    originalUrl,
    requestEndpoint,
    endpoint,
  })

  // endpoint not defined in endpoints
  // allowed unless defined
  if (endpoint === null) {
    return true
  }

  // allowed unless defined
  if (endpoint.METHODS === undefined) {
    return true
  }

  const requiredRoles = endpoint.METHODS[method] ? endpoint.METHODS[method] : endpoint.METHODS.ALL

  console.log(method)
  console.log('requiredRoles', requiredRoles)

  // allowed unless defined
  if (!requiredRoles) {
    return true
  }


  const accessRecord = await AuthRepo.findByToken(token)
  if (accessRecord === null) return false
  const tokenRoles = accessRecord.roles.map(str => Roles[str])
  Logger.info(`[ACCESS] ${accessRecord.name} accessed ${method} ${originalUrl}.`)

  if (tokenRoles.some(role => role === Roles.Admin || requiredRoles.has(role))) {
    return true
  }

  return false
}

const goDeep = (object: any, targets: string[], paramKeys: string[]): IEndpointSettings | null => {
  const currentTarget = targets.shift()
  if (!currentTarget) {
    return object
  }

  if (object.WILDCARD) {
    return object
  }

  if (object[currentTarget] !== undefined) {
    return goDeep(object[currentTarget], targets, paramKeys)
  } else {
    const key = paramKeys.find(key => object[key] !== undefined)
    // could also check if one of the param values equals currentTarget but values can be duplicates and keys cant
    // this should always be true (params is defined in another scope)
    // if (params[key] === currentTarget)
    if (!key) return null
    return goDeep(object[key], targets, paramKeys)
  }
}

export {
  hasAccess,
}
