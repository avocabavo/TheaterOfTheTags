import { createTagShard, type TagCreationProps } from './Tag'
import * as Y from 'yjs'
import type { RelationshipShard } from './schema'

export type RelationshipCreationProps = {
  companion: string
  tag: TagCreationProps
}
export function createRelationshipShard(
  { companion, tag }: RelationshipCreationProps
): RelationshipShard {
  const relationshipShard: RelationshipShard = new Y.Map()

  relationshipShard.set('uuid', crypto.randomUUID())
  relationshipShard.set('companion', companion)
  relationshipShard.set('tag', createTagShard(tag))

  return relationshipShard
}
