import * as Y from 'yjs'

export type StatusNature = 'helpful' | 'hindering'
export type StatusCreationProps = {
  name: string;
  nature?: StatusNature;
  limit?: number;
  tiers?: Array<boolean>;
  exceeded?: boolean;
}
export function createStatusTagShard({
  name,
  nature = 'helpful',
  limit = 5,
  tiers = Array(limit).fill(false),
  exceeded = false,
}: StatusCreationProps): Y.Map<any> {
  const shard = new Y.Map()

  shard.set('name', name)
  shard.set('nature', nature)
  shard.set('limit', limit)
  shard.set('tiers', tiers)
  shard.set('exceeded', exceeded)

  return shard
}