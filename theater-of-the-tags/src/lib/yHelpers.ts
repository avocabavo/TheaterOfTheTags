// lib/yHelpers.ts
import * as Y from 'yjs'

export function getY<K extends keyof T, T>(
  map: Y.Map<T>,
  key: K
): T[K] {
  return map.get(key as string) as T[K]
}

export function setY<K extends keyof T, T>(
  map: Y.Map<T[K]>,
  key: K,
  value: T[K]
) {
  map.set(key as string, value)
}

export function getYArray<T>(
  ymap: Y.Map<any>,
  key: string
): Y.Array<T> {
  let arr = ymap.get(key)

  if (!(arr instanceof Y.Array)) {
    const arr = new Y.Array<T>()
    ymap.set(key, arr)
  }

  return arr
}
