import * as Y from 'yjs'
import { createTagShard } from './Tag'

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
export type ThemeCreationProps = {
  might: Might
  themeType: ThemeType
  themeTagName: string
}
export function createThemeShard({
  might, themeType, themeTagName
}: ThemeCreationProps): Y.Map<any> {
  const shard = new Y.Map()

  shard.set('might', might)
  shard.set('themeType', themeType)

  const themeTag = createTagShard({
    name: themeTagName,
    nature: 'theme'
  })
  shard.set('themeTag', themeTag)

  shard.set('powerTags', new Y.Array())
  shard.set('weaknessTags', new Y.Array())

  shard.set('quest', '')

  shard.set('abandon', 0)
  shard.set('improve', 0)
  shard.set('milestone', 0)

  return shard
}