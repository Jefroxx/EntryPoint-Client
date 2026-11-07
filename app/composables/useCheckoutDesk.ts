/**
 * The Station tab (attendance) keeps its camera on while the library is open, and the Checkout window in another tab
 * shows a camera of its own so the librarian never has to switch tabs. Both read the same webcam, so two tabs would
 * both decode every barcode: a book held up for Checkout would also be sent to attendance as a student ID.
 *
 * These two helpers keep them apart over a BroadcastChannel (same browser, same site, no server involved):
 * the Checkout window announces itself while it is open, and the Station ignores camera reads until it closes.
 * The announcement repeats every couple of seconds, so a Checkout tab that is closed or crashes without saying
 * goodbye stops holding the Station back after a few seconds.
 */
const CHANNEL = 'entrypoint-checkout-desk'
const BEAT_MS = 2000
const STALE_MS = 5000

type Message = { type: 'open' | 'closed' }

function openChannel(): BroadcastChannel | null {
  return import.meta.client && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null
}

/** For the Checkout window: call `begin()` when it opens and `end()` when it closes. */
export function useCheckoutDeskAnnouncer() {
  let channel: BroadcastChannel | null = null
  let timer: ReturnType<typeof setInterval> | undefined

  function begin() {
    if (timer) return
    channel = openChannel()
    const send = () => channel?.postMessage({ type: 'open' } satisfies Message)
    send()
    timer = setInterval(send, BEAT_MS)
  }

  function end() {
    if (!timer) return
    clearInterval(timer)
    timer = undefined
    channel?.postMessage({ type: 'closed' } satisfies Message)
    channel?.close()
    channel = null
  }

  onBeforeUnmount(end)
  return { begin, end }
}

/** For the Station: `active` is true while a Checkout window is open in another tab. */
export function useCheckoutDeskWatcher() {
  const active = ref(false)
  let channel: BroadcastChannel | null = null
  let staleTimer: ReturnType<typeof setTimeout> | undefined

  onMounted(() => {
    channel = openChannel()
    if (!channel) return
    channel.onmessage = (event: MessageEvent<Message>) => {
      clearTimeout(staleTimer)
      if (event.data?.type === 'open') {
        active.value = true
        staleTimer = setTimeout(() => { active.value = false }, STALE_MS)
      } else {
        active.value = false
      }
    }
  })

  onBeforeUnmount(() => {
    clearTimeout(staleTimer)
    channel?.close()
  })

  return { active }
}
