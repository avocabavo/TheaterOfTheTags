import * as Y from 'yjs'
import { type TagNature, type TagShard } from './schema'

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
  const tagShard: TagShard = new Y.Map()

  tagShard.set('uuid', crypto.randomUUID())
  tagShard.set('name', name)
  tagShard.set('nature', nature)
  tagShard.set('scratched', scratched)

  return tagShard
}
