export type StationMessage =
  | { type: 'open' }
  | { type: 'closed' }
  | { type: 'ping' }
  | { type: 'scanned' }

/**
 * The scan station runs in its own browser tab. Tabs of the same site talk over a BroadcastChannel,
 * so the station can tell the Attendance tab "a scan happened" (refresh now) and "I'm open / closed"
 * without any server push. Browsers without BroadcastChannel just fall back to the usual polling.
 */
export function useStationChannel(onMessage?: (message: StationMessage) => void) {
  let channel: BroadcastChannel | null = null

  function post(message: StationMessage) {
    try { channel?.postMessage(message) } catch { /* channel closed */ }
  }

  onMounted(() => {
    if (!('BroadcastChannel' in window)) return
    channel = new BroadcastChannel('entrypoint-attendance-station')
    channel.onmessage = (event: MessageEvent<StationMessage>) => onMessage?.(event.data)
  })

  // onUnmounted runs after every onBeforeUnmount, so a page can still post "closed" while leaving.
  onUnmounted(() => {
    channel?.close()
    channel = null
  })

  return { post }
}

const STATION_URL = '/librarian/station'
const STATION_WINDOW = 'entrypoint-attendance-station'

/**
 * Opens the scan station in its own tab, or brings back the one already open. Opening by window
 * name reuses that tab instead of stacking up copies (each would ask for the camera); an empty URL
 * returns it without reloading. If pop-ups are blocked, the station opens in this tab instead.
 */
export function openAttendanceStation() {
  const existing = window.open('', STATION_WINDOW)
  if (!existing) return navigateTo(STATION_URL)
  if (existing.location.href === 'about:blank') existing.location.href = STATION_URL
  existing.focus()
}
