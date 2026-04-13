import * as Y from 'yjs'
import type { StatusTagShard } from './schema'

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
}: StatusCreationProps): StatusTagShard {
  const statusTagShard = new Y.Map() as StatusTagShard

  statusTagShard.set('name', name)
  statusTagShard.set('nature', nature)
  statusTagShard.set('tiers', tiers)

  return statusTagShard
}
