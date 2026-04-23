import * as Y from 'yjs'
import { ref, onMounted, onUnmounted, type Ref, shallowRef } from 'vue'
import { getYArray } from './yHelpers'

function cloneYMap(item: Y.Map<any>): Y.Map<any> {
  const tempDoc = new Y.Doc()
  const tempMap = tempDoc.getMap()

  // copy content via update
  const update = Y.encodeStateAsUpdate(item.doc!)
  Y.applyUpdate(tempDoc, update)

  // extract equivalent structure
  return tempMap.clone() // or reconstruct from temp
}

export function useYMapField<T, K extends keyof T>(
  ymap: Y.Map<any>,
  key: K,
  defaultValue: T[K]
): Ref<T[K]> {
  const state = ref<T[K]>(defaultValue) as Ref<T[K]>

  function sync() {
    if (!ymap.has(key as string)) {
      ymap.set(key as string, defaultValue)
    }
    state.value = ymap.get(key as string) as T[K]
  }

  function observer(event: Y.YMapEvent<T>) {
    if (event.keysChanged.has(key as string)) {
      sync()
    }
  }

  onMounted(() => {
    sync()
    ymap.observe(observer)
  })

  onUnmounted(() => {
    ymap.unobserve(observer)
  })

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
  ymap: Y.Map<any>,
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
  const items = ref<T[]>([]) as Ref<T[]>
  let yarray: Y.Array<any> | null = null

  function sync() {
    const arr = getYArray<T>(ymap, key)

    if (yarray !== arr) {
      yarray?.unobserve(observer)
      arr.observe(observer)
      yarray = arr
    }

    items.value = arr.toArray()
  }

  function observer() {
    sync()
  }

  sync()

  onMounted(() => {
    ymap.observe(observer)
    yarray?.observe(observer)
  })

  onUnmounted(() => {
    ymap.unobserve(observer)
    yarray?.unobserve(observer)
  })

  function push(item: T) {
    if (!yarray) throw new Error("Y.Array not initialized yet")
    yarray.push([item])
    if (callbackOnChange) callbackOnChange()
  }

  function remove(index: number) {
    yarray?.delete(index, 1)
    if (callbackOnChange) callbackOnChange()
  }

  function move(from: number, to: number) {
    if (from === to) return
    if (yarray == null) return

    console.log(`moving from ${from} to ${to} within an array of length ${yarray.length}`)

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
    if (callbackOnChange) callbackOnChange()
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
    if (callbackOnChange) callbackOnChange()
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
  ymap: Y.Map<any>,
  key: string,
  callbackOnChange?: (()=> any) | null,
): {
  child: Ref<Y.Map<any> | null>,
  clear: ()=>void,
  set: (newMap?: Y.Map<any>)=>void
} {
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

  sync()

  onMounted(() => {
    ymap.observe(observer)
  })

  onUnmounted(() => {
    ymap.unobserve(observer)
  })

  return {
    child,
    clear,
    set,
  }
}
