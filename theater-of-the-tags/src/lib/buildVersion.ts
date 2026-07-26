import { onMounted, onUnmounted, ref, type Ref } from 'vue'

type BuildInfo = {
  buildId?: unknown
}

const BUILD_CHECK_INTERVAL_MS = 60_000

export const buildId = __BUILD_ID__

export function useOutdatedClient(): Ref<boolean> {
  const outdated = ref(false)
  let interval: number | undefined

  async function checkBuildId() {
    try {
      const response = await fetch(`/build-id.json?time=${Date.now()}`, {
        cache: 'no-store',
      })
      if (!response.ok) return

      const currentBuild = await response.json() as BuildInfo
      if (
        typeof currentBuild.buildId === 'string'
        && currentBuild.buildId !== buildId
      ) {
        outdated.value = true
      }
    } catch {
      // A temporary network failure should not interrupt an active session.
    }
  }

  function checkWhenVisible() {
    if (document.visibilityState === 'visible') void checkBuildId()
  }

  onMounted(()=> {
    void checkBuildId()
    interval = window.setInterval(checkBuildId, BUILD_CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', checkWhenVisible)
  })

  onUnmounted(()=> {
    window.clearInterval(interval)
    document.removeEventListener('visibilitychange', checkWhenVisible)
  })

  return outdated
}
