import { AxiosError } from 'axios'
import { Client, Intents, MessageEmbed, TextChannel } from 'discord.js'
import { config } from '../config'
import { Logger } from './Logger'

enum Colors {
  green = '#00ff00',
  orange = '#ffa500',
  red = '#ff0000',
  aqua = '#00fffb',
}

enum Channels {
  error = 'error',
  log = 'log'
}

interface IErrorFormat {
  title: string,
  message: string,
}

interface SendEmbedInput {
  title: string,
  content: string,
  color: Colors,
  channel: Channels,
  authorName?: string,
  asCodeBlock?: boolean,
}

class DiscordC {
  constructor () {
    this.client.on('ready', async () => {
      Logger.info(`Logged in as ${this.client.user?.tag}!`)
      this.makeReady()
      if (config.env === 'production') {
        const channel = this.getChannel(Channels.log)
        channel.send('I have just restarted! Check up on me el bastardo!')
      }
    })

    this.client.login(config.discord.token)
  }

  private makeReady

  public ready = new Promise(resolve => {
    this.makeReady = resolve
  })

  private readonly client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
    ],
  })

  public readonly Colors = Colors
  public readonly Channels = Channels

  public sendText = async (text: string) => {
    const channel = this.getChannel(Channels.log)
    await channel.send(text)
  }

  public sendEmbed = async ({ title, content, color, authorName, channel, asCodeBlock = true }: SendEmbedInput) => {
    if (content.length > 4000) {
      content = content.slice(0, 4000)
    }

    const embed = new MessageEmbed({
      title,
      author: {
        name: authorName,
      },
      color,
      description: asCodeBlock ? `\`\`\`${ content }\`\`\`` : content,
    })

    await this.getChannel(channel).send({
      embeds: [embed],
    })
  }

  public sendError = (error: Error, path?: string) => {
    const { title, message } = this.formatError(error)
    this.sendEmbed({
      title,
      content: message,
      color: Colors.red,
      channel: Channels.error,
      authorName: path ?? 'Internal',
    })
  }

  private getChannel = (channelName: Channels): TextChannel => {
    const channel = this.client.channels.cache.get(config.discord.channels[channelName])
    if (channel) {
      return channel as TextChannel
    }

    throw new Error(`${channelName} channel not found`)
  }

  private formatError = (error: Error): IErrorFormat => {
    if (error instanceof AxiosError) {
      return {
        title: error.response?.config.url ?? 'Unknown Axios Error',
        message: error.response?.data as string,
      }
    } else if (error instanceof Error) {
      return {
        title: error.name,
        message: error.stack ?? 'Unknown stack.',
      }
    } else {
      return {
        title: 'Unknown Error Title',
        message: JSON.stringify(error),
      }
    }
  }
}

export const Discord = new DiscordC()
