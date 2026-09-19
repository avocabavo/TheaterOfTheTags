import * as Y from 'yjs'
import { ref, watch, toValue, type MaybeRefOrGetter, type Ref, shallowRef } from 'vue'
import { getYArray } from './yHelpers'


// Pass a getter or ref for replaceable shards: reordering clones Y.Map objects.
// Watcher cleanup detaches observers both on replacement and on scope disposal.
export function useYMapField<T, K extends keyof T>(
  source: MaybeRefOrGetter<Y.Map<any>>,
  key: K,
  defaultValue: T[K],
  initializeDefault = true,
): Ref<T[K]> {
  let ymap = toValue(source)
  const state = ref<T[K]>(defaultValue) as Ref<T[K]>

  function sync() {
    if (!ymap.has(key as string)) {
      if (initializeDefault) {
        ymap.set(key as string, defaultValue)
      } else {
        state.value = defaultValue
        return
      }
    }
    state.value = ymap.get(key as string) as T[K]
  }

  function observer(event: Y.YMapEvent<T>) {
    if (event.keysChanged.has(key as string)) {
      sync()
    }
  }

  watch(() => toValue(source), (map, _previous, onCleanup) => {
    ymap = map
    sync()
    map.observe(observer)
    onCleanup(() => map.unobserve(observer))
  }, { immediate: true, flush: 'sync' })

  return new Proxy(state, {
    set(target, prop, value) {
      if (prop === 'value') {
        ymap.set(key as string, value)
        return true
      }
      return Reflect.set(target, prop, value)
    }
  })
}

export function useYArray<T>(
  source: MaybeRefOrGetter<Y.Map<any>>,
  key: string,
  callbackOnChange?: (()=> any) | null,
): {
  items: Ref<T[]>
  push: (item: T) => void
  remove: (index: number) => void
  move: (from: number, to: number)=> void
  set: (index: number, value: T)=> void
  yarray: ()=> Y.Array<any> | null
} {
  let ymap = toValue(source)
  // Keep Yjs objects raw; only the array snapshot needs Vue reactivity.
  const items = shallowRef<T[]>([]) as Ref<T[]>
  let yarray: Y.Array<any> | null = null

  function sync() {
    const arr = getYArray<T>(ymap, key)

    if (yarray !== arr) {
      yarray?.unobserve(arrayObserver)
      arr.observe(arrayObserver)
      yarray = arr
    }

    items.value = arr.toArray()
  }

  function arrayObserver() {
    sync()
    callbackOnChange?.()
  }

  function mapObserver(event: Y.YMapEvent<any>) {
    if (!event.keysChanged.has(key)) return
    sync()
    callbackOnChange?.()
  }

  watch(() => toValue(source), (map, previous, onCleanup) => {
    ymap = map
    sync()
    map.observe(mapObserver)
    onCleanup(() => {
      map.unobserve(mapObserver)
      yarray?.unobserve(arrayObserver)
      yarray = null
    })
    if (previous) callbackOnChange?.()
  }, { immediate: true, flush: 'sync' })

  function push(item: T) {
    if (!yarray) throw new Error("Y.Array not initialized yet")
    yarray.push([item])
  }

  function remove(index: number) {
    yarray?.delete(index, 1)
  }

  function move(from: number, to: number) {
    if (from === to) return
    if (yarray == null) return

    const doc = yarray.doc
    if (doc == null) {
      throw new Error('trying to rearrange a Y.Array that is not part of a Y.doc')
    }
    doc.transact(()=> {
      if (yarray == null) {
        throw new Error('trying to rearrange a null Y.Array')
      }
      const item = yarray.get(from)
      if (item == null) {
        throw new Error(`Item at index ${from} is null or undefined`)
      }
      if (item instanceof Y.Map) {
        const clone = item.clone()
        yarray.delete(from, 1)
        yarray.insert(to, [clone])
      } else {
        yarray.delete(from, 1)
        yarray.insert(to, [item])
      }
    })
  }

  function set(index: number, value: T) {
    if (!yarray) return
    const doc = yarray.doc
    if (doc == null) {
      throw new Error('trying to set a vallue in a Y.Array that is not part of a Y.doc')
    }
    doc.transact(()=> {
      yarray?.delete(index, 1)
      yarray?.insert(index, [value])
    })
  }

  return {
    items,
    push,
    remove,
    move,
    set,
    yarray: () => yarray
  }
}

export function useYChildMap(
  source: MaybeRefOrGetter<Y.Map<any>>,
  key: string,
  callbackOnChange?: (()=> any) | null,
): {
  child: Ref<Y.Map<any> | null>,
  clear: ()=>void,
  set: (newMap?: Y.Map<any>)=>void
} {
  let ymap = toValue(source)
  const child = shallowRef<Y.Map<any> | null>(null)

  function sync() {
    let value = ymap.get(key)

    if (value == null) {
      child.value = null
      return
    }

    if (value instanceof Y.Map) {
      child.value = value
      return
    }

    throw new Error(`Invalid Y.Map at key ${key}`)
  }

  function observer(event: Y.YMapEvent<any>) {
    if (event.keysChanged.has(key)) {
      sync()
    }
  }

  function clear() {
    if (ymap.has(key)) {
      ymap.delete(key)
    }
    if (callbackOnChange) callbackOnChange()
  }

  function set(newMap?: Y.Map<any>) {
    if (newMap == null) {
      if (ymap.has(key)) {
        ymap.delete(key)
      }
      if (callbackOnChange) callbackOnChange()
      return
    }

    if (newMap instanceof Y.Map) {
      ymap.set(key, newMap)
      if (callbackOnChange) callbackOnChange()
      return
    }

    throw new Error(`Invalid Y.Map attempted to be set to key ${key}`)
  }

  watch(() => toValue(source), (map, previous, onCleanup) => {
    ymap = map
    sync()
    map.observe(observer)
    onCleanup(() => map.unobserve(observer))
    if (previous) callbackOnChange?.()
  }, { immediate: true, flush: 'sync' })

  return {
    child,
    clear,
    set,
  }
}
