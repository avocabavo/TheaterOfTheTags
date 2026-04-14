import { ref } from 'vue'

export type AppMode = 'creation' | 'scene' | 'narrator'

const mode = ref<AppMode>('creation')

export function useMode() {
  return {
    mode,
    setMode: (newMode: AppMode)=> {
      mode.value = newMode
    }
  }
}
