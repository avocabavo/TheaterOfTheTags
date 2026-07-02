import * as Y from 'yjs'
import { doc, fellowships, heroes, situations } from './yjs'
import type { StatusNature, TagNature, Usage } from './schema'
import { getThemeName } from './Theme'

type TagContext = {
  improvementInstruction?: string
}

export type InvokedTagSummary = {
  uuid: string
  name: string
  impact: string
  kind: 'tag' | 'status'
  nature: TagNature | StatusNature
  scratched: boolean
  tier: number
  improvementInstruction?: string
}

function isTagShard(value: unknown): value is Y.Map<any> {
  return value instanceof Y.Map && value.has('name') && (
    value.has('scratched') || value.has('tiers')
  )
}

function visitTag(
  value: unknown,
  visitor: (tag: Y.Map<any>, context: TagContext)=> void,
  context: TagContext = {},
) {
  if (isTagShard(value)) {
    visitor(value, context)
  }
}

function visitTagArray(
  parent: Y.Map<any>,
  key: string,
  visitor: (tag: Y.Map<any>, context: TagContext)=> void,
  context: TagContext = {},
) {
  const value = parent.get(key)
  if (!(value instanceof Y.Array)) return

  value.toArray().forEach(item=> visitTag(item, visitor, context))
}

function visitThemeTags(theme: unknown, visitor: (tag: Y.Map<any>, context: TagContext)=> void) {
  if (!(theme instanceof Y.Map)) return

  const themeName = getThemeName(theme)
  const themeImprovementInstruction = themeName ? `Improve ${themeName}` : ''

  visitTag(theme.get('primaryTag'), visitor)
  visitTagArray(theme, 'powerTags', visitor)
  visitTagArray(
    theme,
    'weaknessTags',
    visitor,
    themeImprovementInstruction ? { improvementInstruction: themeImprovementInstruction } : {}
  )
}

function visitHeroTags(hero: unknown, visitor: (tag: Y.Map<any>, context: TagContext)=> void) {
  if (!(hero instanceof Y.Map)) return

  const characterName = hero.get('characterName')
  const relationshipImprovementInstruction = typeof characterName === 'string' && characterName.trim()
    ? `Improve ${characterName.trim()}'s fellowship`
    : ''

  visitTagArray(
    hero,
    'relationships',
    visitor,
    relationshipImprovementInstruction
      ? { improvementInstruction: relationshipImprovementInstruction }
      : {}
  )
  visitTagArray(hero, 'backpack', visitor)
  visitTagArray(hero, 'looseTags', visitor)

  const themes = hero.get('themes')
  if (themes instanceof Y.Array) {
    themes.toArray().forEach(theme=> visitThemeTags(theme, visitor))
  }
}

function visitTopLevelLooseTags(
  collection: Y.Map<Y.Map<any>>,
  visitor: (tag: Y.Map<any>, context: TagContext)=> void,
) {
  collection.forEach(shard=> visitTagArray(shard, 'looseTags', visitor))
}

function updateMatchingUsage(from: Usage, to: Usage) {
  doc.transact(()=> {
    const visitor = (tag: Y.Map<any>)=> {
      if (tag.get('usage') === from) {
        tag.set('usage', to)
      }
    }

    visitTopLevelLooseTags(situations, visitor)
    visitTopLevelLooseTags(fellowships, visitor)
    heroes.forEach(hero=> visitHeroTags(hero, visitor))
  })
}

function formatImpact(value: number) {
  return value > 0 ? `+${value}` : `${value}`
}

function highestTier(tag: Y.Map<any>) {
  const tiers = tag.get('tiers')
  if (!(tiers instanceof Y.Array)) return 0

  const values = tiers.toArray()
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index]) return index + 1
  }

  return 0
}

function tagImpact(tag: Y.Map<any>) {
  if (tag.has('tiers')) {
    const nature = tag.get('nature') as StatusNature
    const tier = highestTier(tag)
    return nature === 'hindering' ? -tier : tier
  }

  const nature = tag.get('nature') as TagNature

  if (nature === 'weakness') return -1

  return tag.get('scratched') ? 3 : 1
}

export function getInvokedTagSummaries(): InvokedTagSummary[] {
  const summaries: InvokedTagSummary[] = []

  const visitor = (tag: Y.Map<any>, context: TagContext)=> {
    if (tag.get('usage') !== 'invoked') return
    const fallbackId = `invoked-${summaries.length}`
    const nature = tag.get('nature') as TagNature | StatusNature
    const kind = tag.has('tiers') ? 'status' : 'tag'
    const improvementInstruction = kind === 'tag' && nature === 'weakness'
      ? context.improvementInstruction
      : undefined

    summaries.push({
      uuid: typeof tag.get('uuid') === 'string' ? tag.get('uuid') : fallbackId,
      name: typeof tag.get('name') === 'string' ? tag.get('name') : '',
      impact: formatImpact(tagImpact(tag)),
      kind,
      nature,
      scratched: Boolean(tag.get('scratched')),
      tier: tag.has('tiers') ? highestTier(tag) : 0,
      ...(improvementInstruction ? { improvementInstruction } : {}),
    })
  }

  visitTopLevelLooseTags(situations, visitor)
  visitTopLevelLooseTags(fellowships, visitor)
  heroes.forEach(hero=> visitHeroTags(hero, visitor))

  return summaries
}

export function rollInvokedTags() {
  updateMatchingUsage('invoked', 'tapped')
}

export function refreshTappedTags() {
  updateMatchingUsage('tapped', 'ready')
}
