import * as Y from 'yjs'
import { createTagShard } from './Tag'
import type { Might, ThemeShard, ThemeType } from './schema'

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
