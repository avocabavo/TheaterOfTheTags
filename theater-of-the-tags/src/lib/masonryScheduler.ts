import type Masonry from 'masonry-layout'
import { nextTick } from 'vue'

export function createMasonryLayoutScheduler(getMasonry: () => Masonry | null) {
  let animationFrame: number | null = null
  let reloadItems = false
  let nextTickPending = false

  function schedule(structureChanged = false) {
    reloadItems ||= structureChanged
    if (nextTickPending || animationFrame !== null) return

    nextTickPending = true
    nextTick(()=> {
      nextTickPending = false
      if (animationFrame !== null) return

      animationFrame = window.requestAnimationFrame(()=> {
        animationFrame = null
        const masonry = getMasonry()
        const shouldReloadItems = reloadItems
        reloadItems = false

        if (shouldReloadItems) masonry?.reloadItems?.()
        masonry?.layout?.()
      })
    })
  }

  function cancel() {
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
    nextTickPending = false
    reloadItems = false
  }

  return { schedule, cancel }
}
