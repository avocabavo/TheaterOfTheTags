import { nextTick, ref, shallowReactive, watch, type Ref } from "vue";

export function useWatchWithDebounce(
  usedField: Ref<string, string>,
  localValue: Ref<string, string>,
  timeout_ms?: number | null,
  maintenanceFunc?: (()=>any)
) {
  timeout_ms ??= 200
  maintenanceFunc ??= ()=> {}

  watch(usedField, (val)=> {
    if (val !== localValue.value) {
      localValue.value = val
    }
  })

  let timeout: number | undefined
  watch(localValue, (val)=> {
    nextTick(maintenanceFunc)
    window.clearTimeout(timeout)
    timeout = window.setTimeout(()=> {
      if (val !== usedField.value) {
        usedField.value = val
      }
    }, timeout_ms)
  })
}

export function useFieldCollector<T = any>(): {
  fieldRefs: Map<string, T>,
  setFieldRef: (key: string, el: T | null)=> void,
} {
  const fieldRefs = shallowReactive(new Map<string, T>())

  function setFieldRef(key: string, el: T | null) {
    if (el == null) {
      fieldRefs.delete(key)
    } else {
      fieldRefs.set(key, el)
    }
  }

  return { fieldRefs, setFieldRef }
}

const dragTracker: { draggee: Object | null } = { draggee: null }
export function useDragDrop(
  move: (from: number, to: number)=> void,
  dropCallback?: ()=>any,
): {
  draggingIndex: Ref<number | null>,
  onDrag: (index: number)=> void,
  onDrop: (targetIndex: number)=> void
} {
  const dragObject = {}
  const draggingIndex = ref<number | null>(null)
  function onDrag(index: number) {
    draggingIndex.value = index
    dragTracker.draggee = dragObject
  }
  function onDrop(targetIndex: number) {
    if (draggingIndex.value === null) return
    if (dragObject !== dragTracker.draggee) return
    move(draggingIndex.value, targetIndex)
    draggingIndex.value = null
    if (dropCallback) dropCallback()
  }
  return {
    draggingIndex,
    onDrag,
    onDrop
  }
}
