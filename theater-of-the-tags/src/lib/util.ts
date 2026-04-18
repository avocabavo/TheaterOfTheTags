import { nextTick, ref, watch, type Ref } from "vue";

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

export function useFieldCollector(): { fieldRefs: Ref<any[]>, setFieldRef: (el: any)=>void } {
  const fieldRefs = ref<any[]>([])
  function setFieldRef(el: any) {
    if (el) fieldRefs.value.push(el)
  }
  return { fieldRefs, setFieldRef }
}
