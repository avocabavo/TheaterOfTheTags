import { Document, isScalar, visit, type Pair } from 'yaml'

const flowSequenceKeys = new Set(['tiers', 'dice'])

function isFlowSequencePair(value: unknown): value is Pair {
  if (!value || typeof value !== 'object' || !('key' in value)) return false

  const key = (value as Pair).key
  return isScalar(key)
    && typeof key.value === 'string'
    && flowSequenceKeys.has(key.value)
}

export function stringifyYaml(data: unknown) {
  const doc = new Document(data)

  visit(doc, {
    Seq(_key, node, path) {
      const parent = path[path.length - 1]
      if (isFlowSequencePair(parent)) {
        node.flow = true
      }
    },
  })

  return doc.toString({ indent: 2 })
}
