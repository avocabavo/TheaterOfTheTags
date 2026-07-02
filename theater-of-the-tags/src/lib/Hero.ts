import * as Y from 'yjs'
import YAML from 'yaml'
import {
  DEFAULT_HERO_BACKGROUND_COLOR,
  type HeroShard,
  type ThemeShard,
} from './schema'
import { createTagShard, createTagShardFromData } from './Tag'
import { createStatusTagShard, createStatusTagShardFromData } from './StatusTag'
import { createThemeShardFromData } from './Theme'

export type HeroCreationProps = {
  characterName: string
  playerName: string
}

function normalizeBackgroundColor(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_HERO_BACKGROUND_COLOR
  return value.trim()
}

export function getHeroCharacterNameFromData(data: any) {
  if (typeof data?.characterName !== 'string') return ''
  return data.characterName.trim()
}

export function parseHeroDataFromYaml(yamlText: string) {
  try {
    return YAML.parse(yamlText)
  } catch (e) {
    throw new Error('Invalid YAML')
  }
}

export function createHeroShard({
  characterName, playerName
}: HeroCreationProps): HeroShard {
  const heroShard: HeroShard = new Y.Map()

  heroShard.set('uuid', crypto.randomUUID())
  heroShard.set('characterName', characterName)
  heroShard.set('playerName', playerName)
  heroShard.set('backgroundColor', DEFAULT_HERO_BACKGROUND_COLOR)
  const relationshipTags = new Y.Array<ReturnType<typeof createTagShard>>()
  heroShard.set('relationships', relationshipTags)
  heroShard.set('promise', 0)
  heroShard.set('quintessences', new Y.Array<string>())

  const backpackTags = new Y.Array<ReturnType<typeof createTagShard>>()
  heroShard.set('backpack', backpackTags)

  heroShard.set('notes', '')

  const themes = new Y.Array<ThemeShard>()
  heroShard.set('themes', themes)

  const looseTags = new Y.Array<
    ReturnType<typeof createTagShard>
    | ReturnType<typeof createStatusTagShard>
  >()
  heroShard.set('looseTags', looseTags)

  return heroShard
}

function normalizePromiseValue(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(5, Math.trunc(value)))
}

function createLooseTagShardFromData(data: any) {
  if (Array.isArray(data?.tiers)) {
    return createStatusTagShardFromData(data)
  }

  return createTagShardFromData(data)
}

export function createHeroShardFromData(data: any): HeroShard {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid hero data')
  }

  const characterName = getHeroCharacterNameFromData(data)

  if (!characterName) {
    throw new Error('Hero data needs a character name')
  }

  if (typeof data.playerName !== 'string' || !data.playerName.trim()) {
    throw new Error('Hero data needs a player name')
  }

  const heroShard: HeroShard = new Y.Map()

  heroShard.set('uuid', crypto.randomUUID())
  heroShard.set('characterName', characterName)
  heroShard.set('playerName', data.playerName.trim())
  heroShard.set('backgroundColor', normalizeBackgroundColor(data.backgroundColor))

  const relationshipTags = new Y.Array<ReturnType<typeof createTagShard>>()
  relationshipTags.push(
    (Array.isArray(data.relationships) ? data.relationships : [])
      .map((tag: any) => createTagShardFromData(tag))
  )
  heroShard.set('relationships', relationshipTags)

  heroShard.set('promise', normalizePromiseValue(data.promise))

  const quintessences = new Y.Array<string>()
  quintessences.push(
    (Array.isArray(data.quintessences) ? data.quintessences : [])
      .filter((quintessence: unknown): quintessence is string => typeof quintessence === 'string')
  )
  heroShard.set('quintessences', quintessences)

  const backpackTags = new Y.Array<ReturnType<typeof createTagShard>>()
  backpackTags.push(
    (Array.isArray(data.backpack) ? data.backpack : [])
      .map((tag: any) => createTagShardFromData(tag))
  )
  heroShard.set('backpack', backpackTags)

  heroShard.set('notes', typeof data.notes === 'string' ? data.notes : '')

  const themes = new Y.Array<ReturnType<typeof createThemeShardFromData>>()
  themes.push(
    (Array.isArray(data.themes) ? data.themes : [])
      .map((theme: any) => createThemeShardFromData(theme))
  )
  heroShard.set('themes', themes)

  const looseTags = new Y.Array<
    ReturnType<typeof createTagShard>
    | ReturnType<typeof createStatusTagShard>
  >()
  looseTags.push(
    (Array.isArray(data.looseTags) ? data.looseTags : [])
      .map((tag: any) => createLooseTagShardFromData(tag))
  )
  heroShard.set('looseTags', looseTags)

  return heroShard
}

export function createHeroShardFromYaml(yamlText: string): HeroShard {
  return createHeroShardFromData(parseHeroDataFromYaml(yamlText))
}
