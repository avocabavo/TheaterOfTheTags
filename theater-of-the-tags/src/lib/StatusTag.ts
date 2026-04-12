import * as Y from 'yjs'

export const LIMIT = 6

export type StatusNature = 'helpful' | 'hindering'
export type StatusCreationProps = {
  name: string
  nature?: StatusNature
  tiers?: Array<boolean>
}
export function createStatusTagShard({
  name,
  nature = 'helpful',
  tiers = Array(LIMIT).fill(false),
}: StatusCreationProps): Y.Map<any> {
  const shard = new Y.Map()

  shard.set('name', name)
  shard.set('nature', nature)
  shard.set('tiers', tiers)

  return shard
}