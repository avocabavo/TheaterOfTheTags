import * as Y from 'yjs'
import { createTagShard } from './Tag'
import type { Might, ThemeShard, ThemeType } from './schema'

export type ThemeCreationProps = {
  might: Might
  themeType: ThemeType
  themeTagName: string
}
export function createThemeShard({
  might, themeType, themeTagName
}: ThemeCreationProps): ThemeShard {
  const themeShard: ThemeShard = new Y.Map()

  themeShard.set('uuid', crypto.randomUUID())
  themeShard.set('might', might)
  themeShard.set('themeType', themeType)

  const themeTag = createTagShard({
    name: themeTagName,
    nature: 'theme'
  })
  themeShard.set('themeTag', themeTag)

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
