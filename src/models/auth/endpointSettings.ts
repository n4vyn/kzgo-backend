export enum Roles {
  Admin = 'Admin',
  MapMod = 'MapMod',
  VnlMod = 'VnlMod',
  TwitchStreamer = 'TwitchStreamer',
}

export interface IEndpointSettings {
  METHODS?: {
    ALL?: Set<Roles>,
    GET?: Set<Roles>,
    POST?: Set<Roles>,
    PATCH?: Set<Roles>,
    PUT?: Set<Roles>,
    DELETE?: Set<Roles>,
  }
  WILDCARD?: boolean, // think of this as an *, could be translated as 'apply for all child routes'
  // [key: string]: IEndpointSettings
  [key: string]: any,
}

export const endpointSettings: IEndpointSettings = {
  auth: {
    user: {
      METHODS: {
        PUT: new Set([Roles.Admin]),
      },
    },
  },
  admin: {
    WILDCARD: true,
    METHODS: {
      ALL: new Set([Roles.Admin]),
    },
  },
  maps: {
    METHODS: {
      PATCH: new Set([Roles.MapMod]),
    },
    mrd: {
      METHODS: {
        POST: new Set([Roles.MapMod]),
      },
    },
    rename: {
      METHODS: {
        POST: new Set([Roles.Admin]),
      },
    },
    deglobal: {
      WILDCARD: true,
      METHODS: {
        POST: new Set([Roles.Admin]),
      },
    },
  },
  mappers: {
    METHODS: {
      ALL: new Set([Roles.Admin]),
    },
  },
  vnlservices: {
    WILDCARD: true,
    METHODS: {
      ALL: new Set([Roles.VnlMod]),
    },
  },
  twitch: {
    METHODS: {
      ALL: new Set([Roles.TwitchStreamer]),
    },
  },
  wrs: {
    fetch: {
      WILDCARD: true,
      METHODS: {
        ALL: new Set([Roles.Admin]),
      },
    },
  },
}
