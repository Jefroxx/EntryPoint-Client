import { phoneScannerService, type PhoneConsumer, type PhonePairing } from '~/services/phoneScannerService'

const POLL_MS = 1000
/** A new code is made a little before the old one runs out (they last ten minutes) while no phone has used it. */
const REFRESH_MS = 9 * 60 * 1000

/**
 * The desk's side of "use my phone as the camera". Turn it on and it makes a one-time code (for the QR), then asks the
 * server about once a second for barcodes the phone has sent, handing each to `onCode`, which should treat it exactly
 * like a barcode read by the webcam.
 *
 * A phone stays paired for about twelve hours, so a window opened later finds it already connected and skips the QR.
 * Asking takes the barcodes, so each one reaches exactly one window even with several open. `as` says whether this is a
 * Checkout / Start Session window ("desk", which comes first) or the Station.
 */
export function usePhoneScanner(onCode: (code: string) => void, as: PhoneConsumer = 'desk') {
  const enabled = ref(false)
  const pairing = ref<PhonePairing | null>(null)
  const connected = ref(false)
  const lastCode = ref('')
  const error = ref('')
  const busy = ref(false)

  let pollTimer: ReturnType<typeof setInterval> | undefined
  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  let polling = false

  async function newCode() {
    error.value = ''
    busy.value = true
    try {
      pairing.value = await phoneScannerService.createPairing()
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => { if (enabled.value && !connected.value) void newCode() }, REFRESH_MS)
    } catch {
      error.value = "Couldn't make a code. Check the connection and try again."
    } finally {
      busy.value = false
    }
  }

  async function poll() {
    if (polling || !enabled.value) return
    polling = true
    try {
      const result = await phoneScannerService.scans(as)
      connected.value = result.phoneConnected
      for (const scan of result.scans) {
        lastCode.value = scan.code
        onCode(scan.code)
      }
    } catch {
      // Offline for a moment, or the sign-in ended (which the app handles for every request): try again next time.
    } finally {
      polling = false
    }
  }

  async function enable() {
    if (enabled.value) return
    enabled.value = true
    lastCode.value = ''
    await poll()
    // A phone from earlier is still connected: nothing to scan. Otherwise show a code.
    if (!connected.value) await newCode()
    pollTimer = setInterval(poll, POLL_MS)
  }

  /** Stops listening. The phone stays paired, so the next window finds it ready. */
  function disable() {
    enabled.value = false
    clearInterval(pollTimer)
    clearTimeout(refreshTimer)
    pollTimer = undefined
    pairing.value = null
    connected.value = false
  }

  /** Signs the phones out for good. */
  async function disconnect() {
    try { await phoneScannerService.disconnect() } catch { /* nothing to disconnect, or offline */ }
    connected.value = false
    lastCode.value = ''
    if (enabled.value) await newCode()
  }

  onBeforeUnmount(disable)

  return { enabled, pairing, connected, lastCode, error, busy, enable, disable, disconnect, newCode }
}
