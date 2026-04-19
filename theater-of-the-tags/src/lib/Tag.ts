import * as Y from 'yjs'
import YAML from 'yaml'
import { type TagNature, type TagShard } from './schema'

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

  return createTagShard({
    name: data.name ?? '',
    nature: data.nature ?? 'power',
    scratched: data.scratched ?? false,
  })
}
