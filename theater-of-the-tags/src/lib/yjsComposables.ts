import * as Y from 'yjs'
import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export function useYMapField<T>(
  ymap: Y.Map<any>,
  key: string,
  defaultValue: T
): Ref<T> {
  const state = ref<T>(defaultValue) as Ref<T>

  function syncFromYjs() {
    if (!ymap.has(key)) {
      ymap.set(key, defaultValue)
    }
    state.value = ymap.get(key)
  }

  function observer() {
    syncFromYjs()
  }

  onMounted(() => {
    syncFromYjs()
    ymap.observe(observer)
  })

  onUnmounted(() => {
    ymap.unobserve(observer)
  })

  // write-through setter
  const proxy = new Proxy(state, {
    set(target, prop, value) {
      if (prop === 'value') {
        ymap.set(key, value)
        return true
      }
      return Reflect.set(target, prop, value)
    }
  })

  return proxy
}

export function useYArray<T = any>(
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

  function ensureYArray(): Y.Array<T> {
    let value = ymap.get(key)

    if (!(value instanceof Y.Array)) {
      const newArr = new Y.Array<T>()

      if (Array.isArray(value)) {
        newArr.push(value as T[])
      }

      ymap.set(key, newArr)
      value = newArr
    }

    return value
  }

  function syncFromYjs() {
    const arr = ensureYArray()

    if (yarray !== arr) {
      yarray?.unobserve(observer)
      arr.observe(observer)
      yarray = arr
    }

    items.value = arr.toArray()
  }

  function observer() {
    syncFromYjs()
  }

  onMounted(() => {
    syncFromYjs()
    ymap.observe(observer)
  })

  onUnmounted(() => {
    ymap.unobserve(observer)
    yarray?.unobserve(observer)
  })

  function push(item: T) {
    yarray?.push([item])
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
  factory: () => Y.Map<any>
) {
  const child = ref<Y.Map<any>>()

  function syncFromYjs() {
    let value = ymap.get(key)

    if (!value) {
      value = factory()
      ymap.set(key, value)
    }

    child.value = value
  }

  function observer() {
    syncFromYjs()
  }

  onMounted(() => {
    syncFromYjs()
    ymap.observe(observer)
  })

  onUnmounted(() => {
    ymap.unobserve(observer)
  })

  return child as { value: Y.Map<any> }
}
