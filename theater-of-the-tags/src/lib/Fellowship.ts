import * as Y from 'yjs'
import YAML from 'yaml'
import type { FellowshipShard, StatusTagShard, TagShard } from './schema'
import { createStatusTagShardFromData } from './StatusTag'
import { createTagShardFromData } from './Tag'

export type FellowshipCreationProps = {
  fellowshipName: string
}

export function getFellowshipNameFromData(data: any) {
  if (typeof data?.fellowshipName !== 'string') return ''
  return data.fellowshipName.trim()
}

export function parseFellowshipDataFromYaml(yamlText: string) {
  try {
    return YAML.parse(yamlText)
  } catch (e) {
    throw new Error('Invalid YAML')
  }
}

function normalizeBubbleValue(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(3, Math.trunc(value)))
}

function createLooseTagShardFromData(data: any): TagShard | StatusTagShard {
  if (Array.isArray(data?.tiers)) {
    return createStatusTagShardFromData(data)
  }

  return createTagShardFromData(data)
}

export function createFellowshipShard({
  fellowshipName
}: FellowshipCreationProps): FellowshipShard {
  const fellowshipShard: FellowshipShard = new Y.Map()

  fellowshipShard.set('uuid', crypto.randomUUID())
  fellowshipShard.set('fellowshipName', fellowshipName)
  fellowshipShard.set('looseTags', new Y.Array<TagShard | StatusTagShard>())
  fellowshipShard.set('quest', '')
  fellowshipShard.set('abandon', 0)
  fellowshipShard.set('improve', 0)
  fellowshipShard.set('milestone', 0)
  fellowshipShard.set('specialImprovements', new Y.Array<string>())

  return fellowshipShard
}

export function createFellowshipShardFromData(data: any): FellowshipShard {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid fellowship data')
  }

  const fellowshipName = getFellowshipNameFromData(data)

  if (!fellowshipName) {
    throw new Error('Fellowship data needs a fellowship name')
  }

  const fellowshipShard: FellowshipShard = new Y.Map()

  fellowshipShard.set('uuid', crypto.randomUUID())
  fellowshipShard.set('fellowshipName', fellowshipName)

  const looseTags = new Y.Array<TagShard | StatusTagShard>()
  looseTags.push(
    (Array.isArray(data.looseTags) ? data.looseTags : [])
      .map((tag: any) => createLooseTagShardFromData(tag))
  )
  fellowshipShard.set('looseTags', looseTags)

  fellowshipShard.set('quest', typeof data.quest === 'string' ? data.quest : '')
  fellowshipShard.set('abandon', normalizeBubbleValue(data.abandon))
  fellowshipShard.set('improve', normalizeBubbleValue(data.improve))
  fellowshipShard.set('milestone', normalizeBubbleValue(data.milestone))

  const specialImprovements = new Y.Array<string>()
  specialImprovements.push(
    (Array.isArray(data.specialImprovements) ? data.specialImprovements : [])
      .filter((improvement: unknown): improvement is string => typeof improvement === 'string')
  )
  fellowshipShard.set('specialImprovements', specialImprovements)

  return fellowshipShard
}

export function createFellowshipShardFromYaml(yamlText: string): FellowshipShard {
  return createFellowshipShardFromData(parseFellowshipDataFromYaml(yamlText))
}
