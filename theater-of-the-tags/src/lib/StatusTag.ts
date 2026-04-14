import * as Y from 'yjs'
import type { StatusNature, StatusTagShard } from './schema'

export const LIMIT = 6

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
  const statusTagShard: StatusTagShard = new Y.Map()

  const yTiers = new Y.Array<boolean>()
  yTiers.push(tiers)

  statusTagShard.set('uuid', crypto.randomUUID())
  statusTagShard.set('name', name)
  statusTagShard.set('nature', nature)
  statusTagShard.set('tiers', yTiers)

  return statusTagShard
}
