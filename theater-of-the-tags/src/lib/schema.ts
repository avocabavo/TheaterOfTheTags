import * as Y from 'yjs'

export type TagNature = 'primary' | 'power' | 'weakness'
export type StatusNature = 'helpful' | 'hindering'
export type Might = 'origin' | 'adventure' | 'greatness'
export type OriginThemeType =
  'circumstance' |
  'devotion' |
  'past' |
  'people' |
  'personality' |
  'skill or trade' |
  'trait'
export type AdventureThemeType =
  'duty' |
  'influence' |
  'knowledge' |
  'prodigious ability' |
  'relic' |
  'uncanny being'
export type GreatnessThemeType =
  'destiny' |
  'dominion' |
  'mastery' |
  'monstrosity'
export type VaryingMightThemeType =
  'companion' |
  'magic' |
  'possessions'
export type ThemeType = OriginThemeType | AdventureThemeType | GreatnessThemeType | VaryingMightThemeType

export type TagData = {
  uuid: string
  name: string
  nature: TagNature
  scratched: boolean
}
export type TagShard = Y.Map<any>
export const TAG_KEYS = {
  uuid: 'uuid',
  name: 'name',
  nature: 'nature',
  scratched: 'scratched',
} as const

export type StatusTagData = {
  uuid: string
  name: string
  nature: StatusNature
  tiers: boolean[]
}
export type StatusTagShard = Y.Map<any>
export const STATUS_TAG_KEYS = {
  uuid: 'uuid',
  name: 'name',
  nature: 'nature',
  tiers: 'tiers',
} as const

export type ThemeData = {
  uuid: string
  might: Might
  themeType: ThemeType
  primaryTag: TagShard
  powerTags: Y.Array<TagShard>
  weaknessTags: Y.Array<TagShard>
  quest: string
  abandon: number
  improve: number
  milestone: number
}
export type ThemeShard = Y.Map<any>
export const THEME_KEYS = {
  uuid: 'uuid',
  might: 'might',
  themeType: 'themeType',
  primaryTag: 'primaryTag',
  powerTags: 'powerTags',
  weaknessTags: 'weaknessTags',
  quest: 'quest',
  abandon: 'abandon',
  improve: 'improve',
  milestone: 'milestone',
} as const

export type HeroData = {
  uuid: string
  characterName: string
  playerName: string
  promise: number
  quintessences: Y.Array<string>
  backpack: Y.Array<string>
  notes: string
  themes: Y.Array<ThemeShard>
}
export type HeroShard = Y.Map<any>
