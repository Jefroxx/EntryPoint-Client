import type { AsyncDataOptions } from '#app'

const DEFAULT_POLL_MS = 15_000

/**
 * `useAsyncData`, but the data keeps itself current. The API has no push channel, so while the
 * tab is in view it quietly re-fetches every `pollMs` (and once more whenever you come back to
 * the tab) and swaps the result in only if something actually changed. That's how a librarian
 * sees a new student registration, reservation or self-return without navigating away and back.
 *
 * The background fetch is deliberately *silent*: it writes `data` directly and never touches
 * `pending`, so tables don't flash a loading overlay every few seconds. A normal `execute()`
 * (a filter, a page change, a save) still behaves exactly as before, and if one starts while a
 * background fetch is in flight, the older background result is dropped instead of overwriting it.
 */
export function useLiveAsyncData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: AsyncDataOptions<T> & { pollMs?: number } = {},
) {
  const { pollMs = DEFAULT_POLL_MS, ...asyncOptions } = options

  let generation = 0
  const result = useAsyncData<T>(key, () => {
    generation++
    return fetcher()
  }, asyncOptions as AsyncDataOptions<T>)

  let timer: ReturnType<typeof setInterval> | undefined
  let polling = false

  async function poll() {
    if (polling || document.visibilityState !== 'visible' || result.status.value === 'pending') return

    polling = true
    const startedAt = generation

    try {
      const fresh = await fetcher()
      const unchanged = JSON.stringify(fresh) === JSON.stringify(result.data.value)
      if (startedAt === generation && !unchanged) result.data.value = fresh as typeof result.data.value
    } catch {
      // Keep what's on screen; the next tick tries again.
    } finally {
      polling = false
    }
  }

  if (import.meta.client) {
    onMounted(() => {
      timer = setInterval(poll, pollMs)
      document.addEventListener('visibilitychange', poll)
    })

    onBeforeUnmount(() => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', poll)
    })
  }

  return result
}
