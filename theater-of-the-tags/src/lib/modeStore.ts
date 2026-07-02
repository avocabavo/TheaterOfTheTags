import { ref } from 'vue'

export type AppMode = 'creation' | 'scene' | 'narrator'

const mode = ref<AppMode>('creation')
const enableNameEditing = ref(true)
const enableDeleting = ref(true)

export function useMode() {
  return {
    mode,
    enableNameEditing,
    enableDeleting,
    setMode: (newMode: AppMode)=> {
      mode.value = newMode
    }
  }
}
