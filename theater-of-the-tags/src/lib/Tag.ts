import * as Y from 'yjs'

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
}: TagCreationProps): Y.Map<any> {
  const shard = new Y.Map()

  shard.set('uuid', crypto.randomUUID())
  shard.set('name', name)
  shard.set('nature', nature)
  shard.set('scratched', scratched)

  return shard
}