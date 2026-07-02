import * as Y from 'yjs'
import YAML from 'yaml'
import {
  DEFAULT_SITUATION_BACKGROUND_COLOR,
  type SituationShard,
  type StatusTagShard,
  type TagShard,
} from './schema'
import { createStatusTagShardFromData } from './StatusTag'
import { createTagShardFromData } from './Tag'

export type SituationCreationProps = {
  situationName: string
}

function normalizeBackgroundColor(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_SITUATION_BACKGROUND_COLOR
  return value.trim()
}

export function getSituationNameFromData(data: any) {
  if (typeof data?.situationName !== 'string') return ''
  return data.situationName.trim()
}

export function parseSituationDataFromYaml(yamlText: string) {
  try {
    return YAML.parse(yamlText)
  } catch (e) {
    throw new Error('Invalid YAML')
  }
}

function createLooseTagShardFromData(data: any): TagShard | StatusTagShard {
  if (Array.isArray(data?.tiers)) {
    return createStatusTagShardFromData(data)
  }

  return createTagShardFromData(data)
}

export function createSituationShard({
  situationName
}: SituationCreationProps): SituationShard {
  const situationShard: SituationShard = new Y.Map()

  situationShard.set('uuid', crypto.randomUUID())
  situationShard.set('situationName', situationName)
  situationShard.set('backgroundColor', DEFAULT_SITUATION_BACKGROUND_COLOR)
  situationShard.set('looseTags', new Y.Array<TagShard | StatusTagShard>())

  return situationShard
}

export function createSituationShardFromData(data: any): SituationShard {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid situation data')
  }

  const situationName = getSituationNameFromData(data)

  if (!situationName) {
    throw new Error('Situation data needs a situation name')
  }

  const situationShard: SituationShard = new Y.Map()

  situationShard.set('uuid', crypto.randomUUID())
  situationShard.set('situationName', situationName)
  situationShard.set('backgroundColor', normalizeBackgroundColor(data.backgroundColor))

  const looseTags = new Y.Array<TagShard | StatusTagShard>()
  looseTags.push(
    (Array.isArray(data.looseTags) ? data.looseTags : [])
      .map((tag: any) => createLooseTagShardFromData(tag))
  )
  situationShard.set('looseTags', looseTags)

  return situationShard
}

export function createSituationShardFromYaml(yamlText: string): SituationShard {
  return createSituationShardFromData(parseSituationDataFromYaml(yamlText))
}
