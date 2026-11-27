import type { AsyncDataOptions } from '#app'

const DEFAULT_POLL_MS = 15_000

/**
 * The quiet version of each live list's `execute`/`refresh`, looked up by `useAction` after a save: the list updates
 * in place without the loading overlay, so the window that saved can close at once instead of waiting for it.
 */
const quietRefreshers = new WeakMap<(...args: any[]) => unknown, () => Promise<void>>()

/** The silent refresher for a list's `execute`/`refresh`, if that list is a live one. */
export function quietRefresherFor(fn: (...args: any[]) => unknown) {
  return quietRefreshers.get(fn)
}

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
 * `quietRefresh()` is the same silent fetch on demand, for after a save.
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

  /** Fetch without `pending`, and keep the answer only if no newer fetch started meanwhile. */
  async function silentFetch() {
    const startedAt = generation
    const fresh = await fetcher()
    const unchanged = JSON.stringify(fresh) === JSON.stringify(result.data.value)
    if (startedAt === generation && !unchanged) result.data.value = fresh as typeof result.data.value
  }

  async function poll() {
    if (polling || document.visibilityState !== 'visible' || result.status.value === 'pending') return

    polling = true
    try {
      await silentFetch()
    } catch {
      // Keep what's on screen; the next tick tries again.
    } finally {
      polling = false
    }
  }

  /** After a save: refetch now, silently. A poll already in flight is superseded, so it can't write older data. */
  async function quietRefresh() {
    generation++
    try {
      await silentFetch()
    } catch {
      // The next poll tries again.
    }
  }

  quietRefreshers.set(result.execute, quietRefresh)
  quietRefreshers.set(result.refresh, quietRefresh)

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

  return Object.assign(result, { quietRefresh })
}
