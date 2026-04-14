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

  onMounted(() => {
    sync()
    ymap.observe(observer)
  })

  onUnmounted(() => {
    ymap.unobserve(observer)
    yarray?.unobserve(observer)
  })

  function push(item: T) {
    if (!yarray) throw new Error("Y.Array not initialized yet")
    yarray.push([item])
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
  factory?: () => Y.Map<any>
) {
  const child = ref<Y.Map<any> | null>(null)

  function sync() {
    let value = ymap.get(key)

    if (!(value instanceof Y.Map)) {
      if (factory) {
        value = factory()
        ymap.set(key, value)
      } else {
        throw new Error(`Missing or invalid Y.Map at key ${key}, `)
      }
    }

    child.value = value
  }

  function observer(event: Y.YMapEvent<any>) {
    if (event.keysChanged.has(key)) {
      sync()
    }
  }

  sync()

  onMounted(() => {
    ymap.observe(observer)
  })

  onUnmounted(() => {
    ymap.unobserve(observer)
  })

  return child
}
