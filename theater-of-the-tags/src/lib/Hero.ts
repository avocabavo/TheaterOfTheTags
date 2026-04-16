import * as Y from 'yjs'
import type { HeroShard } from './schema'
import type { createTagShard } from './Tag'

export type HeroCreationProps = {
  characterName: string
  playerName: string
}
export function createHeroShard({
  characterName, playerName
}: HeroCreationProps): HeroShard {
  const heroShard: HeroShard = new Y.Map()

  heroShard.set('uuid', crypto.randomUUID())
  heroShard.set('characterName', characterName)
  heroShard.set('playerName', playerName)
  heroShard.set('promise', 0)
  heroShard.set('quintessences', new Y.Array<string>())

  const backpackTags = new Y.Array<ReturnType<typeof createTagShard>>()
  heroShard.set('backpack', backpackTags)

  heroShard.set('notes', '')

  const themes = new Y.Array<ReturnType<typeof createHeroShard>>()
  heroShard.set('themes', themes)

  return heroShard
}