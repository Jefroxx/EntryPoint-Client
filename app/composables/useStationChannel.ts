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
    channel = new BroadcastChannel('entrypoint-scan-station')
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
const STATION_WINDOW = 'entrypoint-scan-station'

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

/* ---------- the station sends work to the librarian's main tab ---------- */

// The librarian side's tab (any page of the librarian layout) names itself this and offers a way in, so the
// station can send it to a page (a return, a checkout) instead of opening the window over the station.
const MAIN_WINDOW = 'entrypoint-librarian'
type MainTab = Window & { __entrypointGoto?: (path: string) => void }

/** Called by the librarian layout: this tab is the one the station sends returns and checkouts to. */
export function registerMainTab() {
  if (!window.name || window.name === MAIN_WINDOW) window.name = MAIN_WINDOW
  ;(window as MainTab).__entrypointGoto = (path: string) => { void navigateTo(path) }
}

/**
 * Sends the librarian's main tab to `path` and, when the browser allows, switches to it.
 *  - 'switched': done, and that tab is now in front (a scanner gun's keystrokes count as a click, which lets a page
 *    bring another tab forward; opening by window name finds it, or opens one if it was closed).
 *  - 'sent': done, but the browser won't switch tabs for a webcam read (no click or key), so the librarian switches.
 *  - 'blocked': there is no main tab to send it to; the station shows a button instead (a click can open one).
 */
export function openInMainTab(path: string): 'switched' | 'sent' | 'blocked' {
  const activated = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation?.isActive ?? false

  if (activated) {
    const tab = window.open('', MAIN_WINDOW) as MainTab | null
    if (tab) {
      try {
        if (tab.__entrypointGoto) tab.__entrypointGoto(path)
        else tab.location.href = path // a new, empty tab (the main one had been closed)
        tab.focus()
        return 'switched'
      } catch { /* another site's tab with that name: fall through */ }
    }
  }

  // The tab that opened the station (Attendance, or the dashboard) is still there, even without a click.
  try {
    const opener = window.opener as MainTab | null
    if (opener && !opener.closed && opener.__entrypointGoto) {
      opener.__entrypointGoto(path)
      opener.focus()
      return 'sent'
    }
  } catch { /* not ours */ }

  return 'blocked'
}
