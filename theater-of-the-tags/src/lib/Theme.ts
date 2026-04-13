import * as Y from 'yjs'
import { createTagShard } from './Tag'
import type { ThemeShard } from './schema'

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
}: ThemeCreationProps): ThemeShard {
  const themeShard = new Y.Map() as ThemeShard

  themeShard.set('might', might)
  themeShard.set('themeType', themeType)

  const themeTag = createTagShard({
    name: themeTagName,
    nature: 'theme'
  })
  themeShard.set('themeTag', themeTag)

  themeShard.set('powerTags', new Y.Array())
  themeShard.set('weaknessTags', new Y.Array())

  themeShard.set('quest', '')

  themeShard.set('abandon', 0)
  themeShard.set('improve', 0)
  themeShard.set('milestone', 0)

  return themeShard
}