import * as Y from 'yjs'
import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { getYArray } from './yHelpers'

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
  key: string
): {
  items: Ref<T[]>
  push: (item: T) => void
  remove: (index: number) => void
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
    console.log('in the useYArray push function')
    if (!yarray) throw new Error("Y.Array not initialized yet")
    console.log(`yarray before push length: ${yarray.length}`)
    yarray.push([item])
    console.log(`yarray after push length: ${yarray.length}`)
  }

  function remove(index: number) {
    yarray?.delete(index, 1)
  }

  return {
    items,
    push,
    remove,
    yarray: () => yarray
  }
}

export function useYChildMap(
  ymap: Y.Map<any>,
  key: string,
) {
  const child = ref<Y.Map<any> | null>(null)

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
  }

  function set(newMap?: Y.Map<any>) {
    if (newMap == null) {
      return clear()
    }

    if (newMap instanceof Y.Map) {
      ymap.set(key, newMap)
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
