import * as Y from 'yjs'
import { type TagShard } from './schema'

export type TagNature = 'theme' | 'power' | 'weakness'
export type TagCreationProps = {
  name: string
  nature?: TagNature
  scratched?: boolean
}
export function createTagShard({
  name,
  nature = 'power',
  scratched = false,
}: TagCreationProps): TagShard {
  const tagShard = new Y.Map() as TagShard

  tagShard.set('uuid', crypto.randomUUID())
  tagShard.set('name', name)
  tagShard.set('nature', nature)
  tagShard.set('scratched', scratched)

  return tagShard
}