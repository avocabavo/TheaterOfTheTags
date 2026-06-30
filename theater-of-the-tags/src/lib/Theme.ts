import * as Y from 'yjs'
import YAML from 'yaml'
import { createTagShard, createTagShardFromData } from './Tag'
import {
  mightOptions,
  type Might,
  type ThemeShard,
  type ThemeType,
  themeTypeOptions,
} from './schema'

export type ThemeCreationProps = {
  might: Might
  themeType: ThemeType
  primaryTagName: string
}
export function createThemeShard({
  might, themeType, primaryTagName
}: ThemeCreationProps): ThemeShard {
  const themeShard: ThemeShard = new Y.Map()

  themeShard.set('uuid', crypto.randomUUID())
  themeShard.set('might', might)
  themeShard.set('themeType', themeType)

  const primaryTag = createTagShard({
    name: primaryTagName,
    nature: 'primary'
  })
  themeShard.set('primaryTag', primaryTag)

  const powerTags = new Y.Array<ReturnType<typeof createTagShard>>()
  themeShard.set('powerTags', powerTags)
  const weaknessTags = new Y.Array<ReturnType<typeof createTagShard>>()
  themeShard.set('weaknessTags', weaknessTags)

  themeShard.set('quest', '')

  themeShard.set('abandon', 0)
  themeShard.set('improve', 0)
  themeShard.set('milestone', 0)

  return themeShard
}

function normalizeBubbleValue(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(3, Math.trunc(value)))
}

export function createThemeShardFromData(data: any): ThemeShard {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid theme data')
  }

  if (!mightOptions.includes(data.might)) {
    throw new Error('Theme data needs a valid might')
  }

  if (!themeTypeOptions.includes(data.themeType)) {
    throw new Error('Theme data needs a valid theme type')
  }

  if (!data.primaryTag || typeof data.primaryTag.name !== 'string' || !data.primaryTag.name.trim()) {
    throw new Error('Theme data needs a primary tag')
  }

  const themeShard: ThemeShard = new Y.Map()

  themeShard.set('uuid', crypto.randomUUID())
  themeShard.set('might', data.might)
  themeShard.set('themeType', data.themeType)
  themeShard.set('primaryTag', createTagShardFromData(data.primaryTag, 'primary'))

  const powerTags = new Y.Array<ReturnType<typeof createTagShard>>()
  powerTags.push(
    (Array.isArray(data.powerTags) ? data.powerTags : [])
      .map((tag: any) => createTagShardFromData(tag, 'power'))
  )
  themeShard.set('powerTags', powerTags)

  const weaknessTags = new Y.Array<ReturnType<typeof createTagShard>>()
  weaknessTags.push(
    (Array.isArray(data.weaknessTags) ? data.weaknessTags : [])
      .map((tag: any) => createTagShardFromData(tag, 'weakness'))
  )
  themeShard.set('weaknessTags', weaknessTags)

  themeShard.set('quest', typeof data.quest === 'string' ? data.quest : '')
  themeShard.set('abandon', normalizeBubbleValue(data.abandon))
  themeShard.set('improve', normalizeBubbleValue(data.improve))
  themeShard.set('milestone', normalizeBubbleValue(data.milestone))

  return themeShard
}

export function createThemeShardFromYaml(yamlText: string): ThemeShard {
  let data: any

  try {
    data = YAML.parse(yamlText)
  } catch (e) {
    throw new Error('Invalid YAML')
  }

  return createThemeShardFromData(data)
}
