import dotenv from 'dotenv'

dotenv.config()

export const config = {
  env: process.env.NODE_ENV,
  server: {
    port: process.env.PORT ?? 5000,
  },
  db: {
    uri: process.env.MONGO_URI ?? '',
  },
  discord: {
    token: process.env.DISCORD_BOT_TOKEN ?? '',
    channels: {
      error: process.env.DISCORD_CHANNEL_ERROR ?? '',
      log: process.env.DISCORD_CHANNEL_LOG ?? '',
    },
  },
  steam: {
    apiKey: process.env.STEAM_API_KEY ?? '',
  },
  webPush: {
    email: process.env.VAPID_EMAIL ?? '',
    publicKey: process.env.PUBLIC_VAPID_KEY ?? '',
    privateKey: process.env.PRIVATE_VAPID_KEY ?? '',
  },
}
