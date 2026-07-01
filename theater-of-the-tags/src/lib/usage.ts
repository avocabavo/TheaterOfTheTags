import * as Y from 'yjs'
import { doc, fellowships, heroes, situations } from './yjs'
import type { Usage } from './schema'

function isTagShard(value: unknown): value is Y.Map<any> {
  return value instanceof Y.Map && value.has('name') && (
    value.has('scratched') || value.has('tiers')
  )
}

function visitTag(value: unknown, visitor: (tag: Y.Map<any>)=> void) {
  if (isTagShard(value)) {
    visitor(value)
  }
}

function visitTagArray(parent: Y.Map<any>, key: string, visitor: (tag: Y.Map<any>)=> void) {
  const value = parent.get(key)
  if (!(value instanceof Y.Array)) return

  value.toArray().forEach(item=> visitTag(item, visitor))
}

function visitThemeTags(theme: unknown, visitor: (tag: Y.Map<any>)=> void) {
  if (!(theme instanceof Y.Map)) return

  visitTag(theme.get('primaryTag'), visitor)
  visitTagArray(theme, 'powerTags', visitor)
  visitTagArray(theme, 'weaknessTags', visitor)
}

function visitHeroTags(hero: unknown, visitor: (tag: Y.Map<any>)=> void) {
  if (!(hero instanceof Y.Map)) return

  visitTagArray(hero, 'relationships', visitor)
  visitTagArray(hero, 'backpack', visitor)
  visitTagArray(hero, 'looseTags', visitor)

  const themes = hero.get('themes')
  if (themes instanceof Y.Array) {
    themes.toArray().forEach(theme=> visitThemeTags(theme, visitor))
  }
}

function visitTopLevelLooseTags(collection: Y.Map<Y.Map<any>>, visitor: (tag: Y.Map<any>)=> void) {
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

export function rollInvokedTags() {
  updateMatchingUsage('invoked', 'tapped')
}

export function refreshTappedTags() {
  updateMatchingUsage('tapped', 'ready')
}
