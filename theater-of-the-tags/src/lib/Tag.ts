import * as Y from 'yjs'
import YAML from 'yaml'
import { type TagNature, type TagShard } from './schema'

const tagNatures: TagNature[] = ['primary', 'power', 'weakness']

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

function isTagNature(value: unknown): value is TagNature {
  return tagNatures.includes(value as TagNature)
}

export function createTagShardFromData(data: any, natureOverride?: TagNature): TagShard {
  return createTagShard({
    name: typeof data?.name === 'string' ? data.name : '',
    nature: natureOverride ?? (isTagNature(data?.nature) ? data.nature : 'power'),
    scratched: Boolean(data?.scratched),
  })
}

export function createTagShardFromYaml(yamlText: string): TagShard {
  let data: any

  try {
    data = YAML.parse(yamlText)
  } catch (e) {
    throw new Error('Invalid YAML')
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid tag data')
  }

  return createTagShardFromData(data)
}
