import * as Y from 'yjs'
import type { StatusNature, StatusTagShard } from './schema'

export const LIMIT = 6
const statusNatures: StatusNature[] = ['helpful', 'hindering']

export type StatusCreationProps = {
  name: string
  nature?: StatusNature
  tiers?: Array<boolean>
  initialTier?: number
}
export function createStatusTagShard({
  name,
  nature = 'helpful',
  tiers = Array(LIMIT).fill(false),
  initialTier
}: StatusCreationProps): StatusTagShard {
  const statusTagShard: StatusTagShard = new Y.Map()

  const yTiers = new Y.Array<boolean>()
  yTiers.push(tiers)

  if (
    initialTier != null
    && initialTier >= 1
    && initialTier <= tiers.length
  ) {
    yTiers.delete(initialTier-1, 1)
    yTiers.insert(initialTier-1, [true])
  }

  statusTagShard.set('uuid', crypto.randomUUID())
  statusTagShard.set('name', name)
  statusTagShard.set('nature', nature)
  statusTagShard.set('tiers', yTiers)
  statusTagShard.set('usage', 'ready')

  return statusTagShard
}

function isStatusNature(value: unknown): value is StatusNature {
  return statusNatures.includes(value as StatusNature)
}

export function createStatusTagShardFromData(data: any): StatusTagShard {
  const tiers = Array.isArray(data?.tiers)
    ? data.tiers.slice(0, LIMIT).map(Boolean)
    : Array(LIMIT).fill(false)

  while (tiers.length < LIMIT) {
    tiers.push(false)
  }

  return createStatusTagShard({
    name: typeof data?.name === 'string' ? data.name : '',
    nature: isStatusNature(data?.nature) ? data.nature : 'helpful',
    tiers,
  })
}
