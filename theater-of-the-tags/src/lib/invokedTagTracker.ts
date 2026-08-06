import * as Y from 'yjs'
import type { Might } from './schema'
import {
  getInvokedTagSummary,
  isTagShard,
  type InvokedTagSummary,
  type TagContext,
} from './usage'

type SummaryNode = {
  summaries: () => InvokedTagSummary[]
  refreshContext: () => void
  destroy: () => void
}

type TrackerCollections = {
  situations: Y.Map<Y.Map<any>>
  fellowships: Y.Map<Y.Map<any>>
  heroes: Y.Map<Y.Map<any>>
}

export type InvokedTagTracker = {
  start: () => void
  stop: () => void
}

export function createInvokedTagTracker(
  collections: TrackerCollections,
  onChange: (summaries: InvokedTagSummary[]) => void,
): InvokedTagTracker {
  let roots: SummaryNode[] = []
  let started = false
  let publishPending = false
  let fallbackId = 0

  function publish() {
    publishPending = false
    onChange(roots.flatMap(node=> node.summaries()))
  }

  function schedulePublish() {
    if (!started || publishPending) return
    publishPending = true
    queueMicrotask(()=> {
      if (started) publish()
      else publishPending = false
    })
  }

  function tagNode(
    tag: Y.Map<any>,
    context: () => TagContext,
    onTagChange?: () => void,
  ): SummaryNode {
    const id = `invoked-tracked-${fallbackId++}`
    let summary: InvokedTagSummary | null = null

    function refresh() {
      summary = getInvokedTagSummary(tag, context(), id)
      onTagChange?.()
      schedulePublish()
    }

    tag.observeDeep(refresh)
    refresh()

    return {
      summaries: ()=> summary ? [summary] : [],
      refreshContext: refresh,
      destroy: ()=> tag.unobserveDeep(refresh),
    }
  }

  function tagArrayNode(
    getArray: () => unknown,
    context: () => TagContext,
  ): SummaryNode & { reconcile: () => void } {
    let array: Y.Array<any> | null = null
    let nodes = new Map<Y.Map<any>, SummaryNode>()
    let ordered: SummaryNode[] = []

    function reconcile() {
      const nextArray = getArray()
      const validArray = nextArray instanceof Y.Array ? nextArray : null
      if (array !== validArray) {
        array?.unobserve(reconcile)
        array = validArray
        array?.observe(reconcile)
      }

      const tags = (array?.toArray() ?? []).filter(isTagShard)
      const live = new Set(tags)
      nodes.forEach((node, tag)=> {
        if (!live.has(tag)) {
          node.destroy()
          nodes.delete(tag)
        }
      })
      ordered = tags.map(tag=> {
        let node = nodes.get(tag)
        if (!node) {
          node = tagNode(tag, context)
          nodes.set(tag, node)
        }
        return node
      })
      schedulePublish()
    }

    reconcile()
    return {
      summaries: ()=> ordered.flatMap(node=> node.summaries()),
      refreshContext: ()=> ordered.forEach(node=> node.refreshContext()),
      reconcile,
      destroy: ()=> {
        array?.unobserve(reconcile)
        nodes.forEach(node=> node.destroy())
        nodes.clear()
        ordered = []
      },
    }
  }

  function situationNode(situation: Y.Map<any>): SummaryNode {
    const looseTags = tagArrayNode(
      ()=> situation.get('looseTags'),
      ()=> {
        const might = situation.get('baseMight')
        return typeof might === 'string' ? { might: might as Might } : {}
      },
    )
    function observe(event: Y.YMapEvent<any>) {
      if (event.keysChanged.has('looseTags')) looseTags.reconcile()
      if (event.keysChanged.has('baseMight')) looseTags.refreshContext()
    }
    situation.observe(observe)
    return {
      summaries: looseTags.summaries,
      refreshContext: looseTags.refreshContext,
      destroy: ()=> {
        situation.unobserve(observe)
        looseTags.destroy()
      },
    }
  }

  function fellowshipNode(fellowship: Y.Map<any>): SummaryNode {
    const looseTags = tagArrayNode(
      ()=> fellowship.get('looseTags'),
      ()=> {
        const name = fellowship.get('fellowshipName')
        return typeof name === 'string' && name.trim()
          ? { improvementInstruction: `Improve ${name.trim()}` }
          : {}
      },
    )
    function observe(event: Y.YMapEvent<any>) {
      if (event.keysChanged.has('looseTags')) looseTags.reconcile()
      if (event.keysChanged.has('fellowshipName')) looseTags.refreshContext()
    }
    fellowship.observe(observe)
    return {
      summaries: looseTags.summaries,
      refreshContext: looseTags.refreshContext,
      destroy: ()=> {
        fellowship.unobserve(observe)
        looseTags.destroy()
      },
    }
  }

  function themeNode(theme: Y.Map<any>): SummaryNode {
    let primary: SummaryNode | null = null
    let primaryTag: Y.Map<any> | null = null
    const mightContext = (): TagContext => {
      const might = theme.get('might')
      return typeof might === 'string' ? { might: might as Might } : {}
    }
    const weaknessContext = (): TagContext => {
      const context = mightContext()
      const primaryName = primaryTag?.get('name')
      return typeof primaryName === 'string' && primaryName.trim()
        ? { ...context, improvementInstruction: `Improve ${primaryName.trim()}` }
        : context
    }
    const power = tagArrayNode(()=> theme.get('powerTags'), mightContext)
    const weakness = tagArrayNode(()=> theme.get('weaknessTags'), weaknessContext)

    function reconcilePrimary() {
      const next = theme.get('primaryTag')
      const valid = isTagShard(next) ? next : null
      if (valid === primaryTag) return
      primary?.destroy()
      primaryTag = valid
      primary = valid ? tagNode(valid, mightContext, weakness.refreshContext) : null
      weakness.refreshContext()
      schedulePublish()
    }

    function observe(event: Y.YMapEvent<any>) {
      if (event.keysChanged.has('primaryTag')) reconcilePrimary()
      if (event.keysChanged.has('powerTags')) power.reconcile()
      if (event.keysChanged.has('weaknessTags')) weakness.reconcile()
      if (event.keysChanged.has('might')) {
        primary?.refreshContext()
        power.refreshContext()
        weakness.refreshContext()
      }
    }

    reconcilePrimary()
    theme.observe(observe)
    return {
      summaries: ()=> [
        ...(primary?.summaries() ?? []),
        ...power.summaries(),
        ...weakness.summaries(),
      ],
      refreshContext: ()=> {
        primary?.refreshContext()
        power.refreshContext()
        weakness.refreshContext()
      },
      destroy: ()=> {
        theme.unobserve(observe)
        primary?.destroy()
        power.destroy()
        weakness.destroy()
      },
    }
  }

  function themeArrayNode(hero: Y.Map<any>): SummaryNode & { reconcile: () => void } {
    let array: Y.Array<any> | null = null
    let nodes = new Map<Y.Map<any>, SummaryNode>()
    let ordered: SummaryNode[] = []
    function reconcile() {
      const next = hero.get('themes')
      const valid = next instanceof Y.Array ? next : null
      if (array !== valid) {
        array?.unobserve(reconcile)
        array = valid
        array?.observe(reconcile)
      }
      const themes = (array?.toArray() ?? []).filter((item): item is Y.Map<any>=> item instanceof Y.Map)
      const live = new Set(themes)
      nodes.forEach((node, theme)=> {
        if (!live.has(theme)) {
          node.destroy()
          nodes.delete(theme)
        }
      })
      ordered = themes.map(theme=> {
        let node = nodes.get(theme)
        if (!node) {
          node = themeNode(theme)
          nodes.set(theme, node)
        }
        return node
      })
      schedulePublish()
    }
    reconcile()
    return {
      summaries: ()=> ordered.flatMap(node=> node.summaries()),
      refreshContext: ()=> ordered.forEach(node=> node.refreshContext()),
      reconcile,
      destroy: ()=> {
        array?.unobserve(reconcile)
        nodes.forEach(node=> node.destroy())
      },
    }
  }

  function heroNode(hero: Y.Map<any>): SummaryNode {
    const relationships = tagArrayNode(
      ()=> hero.get('relationships'),
      ()=> {
        const name = hero.get('characterName')
        return typeof name === 'string' && name.trim()
          ? { improvementInstruction: `Improve ${name.trim()}'s fellowship` }
          : {}
      },
    )
    const backpack = tagArrayNode(()=> hero.get('backpack'), ()=> ({}))
    const looseTags = tagArrayNode(()=> hero.get('looseTags'), ()=> ({}))
    const themes = themeArrayNode(hero)
    function observe(event: Y.YMapEvent<any>) {
      if (event.keysChanged.has('relationships')) relationships.reconcile()
      if (event.keysChanged.has('backpack')) backpack.reconcile()
      if (event.keysChanged.has('looseTags')) looseTags.reconcile()
      if (event.keysChanged.has('themes')) themes.reconcile()
      if (event.keysChanged.has('characterName')) relationships.refreshContext()
    }
    hero.observe(observe)
    return {
      summaries: ()=> [
        ...relationships.summaries(),
        ...backpack.summaries(),
        ...looseTags.summaries(),
        ...themes.summaries(),
      ],
      refreshContext: ()=> {
        relationships.refreshContext()
        backpack.refreshContext()
        looseTags.refreshContext()
        themes.refreshContext()
      },
      destroy: ()=> {
        hero.unobserve(observe)
        relationships.destroy()
        backpack.destroy()
        looseTags.destroy()
        themes.destroy()
      },
    }
  }

  function collectionNode(
    collection: Y.Map<Y.Map<any>>,
    factory: (shard: Y.Map<any>) => SummaryNode,
  ): SummaryNode {
    let nodes = new Map<Y.Map<any>, SummaryNode>()
    let ordered: SummaryNode[] = []
    function reconcile() {
      const shards: Y.Map<any>[] = []
      collection.forEach(value=> {
        if (value instanceof Y.Map) shards.push(value)
      })
      const live = new Set(shards)
      nodes.forEach((node, shard)=> {
        if (!live.has(shard)) {
          node.destroy()
          nodes.delete(shard)
        }
      })
      ordered = shards.map(shard=> {
        let node = nodes.get(shard)
        if (!node) {
          node = factory(shard)
          nodes.set(shard, node)
        }
        return node
      })
      schedulePublish()
    }
    collection.observe(reconcile)
    reconcile()
    return {
      summaries: ()=> ordered.flatMap(node=> node.summaries()),
      refreshContext: ()=> ordered.forEach(node=> node.refreshContext()),
      destroy: ()=> {
        collection.unobserve(reconcile)
        nodes.forEach(node=> node.destroy())
      },
    }
  }

  function start() {
    if (started) return
    started = true
    roots = [
      collectionNode(collections.situations, situationNode),
      collectionNode(collections.fellowships, fellowshipNode),
      collectionNode(collections.heroes, heroNode),
    ]
    publish()
  }

  function stop() {
    if (!started) return
    started = false
    roots.forEach(node=> node.destroy())
    roots = []
    publishPending = false
  }

  return { start, stop }
}
