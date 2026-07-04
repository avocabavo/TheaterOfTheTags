import * as Y from 'yjs'
import YAML from 'yaml'
import {
  DEFAULT_SITUATION_BACKGROUND_COLOR,
  mightOptions,
  type Might,
  type MightAspectShard,
  type SituationShard,
  type StatusTagShard,
  type TagShard,
} from './schema'
import { createStatusTagShardFromData } from './StatusTag'
import { createTagShardFromData } from './Tag'

export type SituationCreationProps = {
  situationName: string
  baseMight: Might
}

function normalizeBackgroundColor(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_SITUATION_BACKGROUND_COLOR
  return value.trim()
}

function normalizeMight(value: unknown): Might {
  return mightOptions.includes(value as Might) ? value as Might : 'origin'
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

export function createMightAspectShard({
  might,
  name,
}: {
  might: Might
  name: string
}): MightAspectShard {
  const mightAspectShard: MightAspectShard = new Y.Map()

  mightAspectShard.set('uuid', crypto.randomUUID())
  mightAspectShard.set('might', might)
  mightAspectShard.set('name', name)

  return mightAspectShard
}

export function createMightAspectShardFromData(data: any): MightAspectShard {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid might aspect data')
  }

  const name = typeof data.name === 'string' ? data.name.trim() : ''

  if (!name) {
    throw new Error('Might aspect data needs a name')
  }

  return createMightAspectShard({
    might: normalizeMight(data.might),
    name,
  })
}

export function createSituationShard({
  situationName,
  baseMight,
}: SituationCreationProps): SituationShard {
  const situationShard: SituationShard = new Y.Map()

  situationShard.set('uuid', crypto.randomUUID())
  situationShard.set('situationName', situationName)
  situationShard.set('backgroundColor', DEFAULT_SITUATION_BACKGROUND_COLOR)
  situationShard.set('baseMight', baseMight)
  situationShard.set('mightAspects', new Y.Array<MightAspectShard>())
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
  situationShard.set('baseMight', normalizeMight(data.baseMight))

  const mightAspects = new Y.Array<MightAspectShard>()
  mightAspects.push(
    (Array.isArray(data.mightAspects) ? data.mightAspects : [])
      .map((aspect: any) => createMightAspectShardFromData(aspect))
  )
  situationShard.set('mightAspects', mightAspects)

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
