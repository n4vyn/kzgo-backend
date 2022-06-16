import { Express } from 'express'

// this one works for the auth middleware in authServices
declare global {
  namespace Express {
    interface Request {
      steamId64?: string,
    }
  }
}

// this one works in controllers and for tests
// declare module 'express' {
//   interface Request {
//     userEmail?: string

//     cookies: {
//       jwt?: string
//     }
//   }
// }
