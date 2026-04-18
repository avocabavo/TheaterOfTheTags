import { nextTick, watch, type Ref } from "vue";

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
