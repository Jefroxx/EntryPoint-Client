/**
 * The address a phone should open to become the desk's camera.
 *
 * A phone can't open "localhost" (to a phone that is the phone itself), and browsers only allow the camera on https.
 * With no fixed domain, the address is whatever this window is open on, as long as that is a real https address (for
 * example the tunnel's). Otherwise it can be typed in once, and is remembered on this computer.
 */
const STORAGE_KEY = 'entrypoint-phone-address'

function isPublicHttps(value: string): boolean {
  try {
    const url = new URL(value)
    const host = url.hostname
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost')
      || /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host)
    return url.protocol === 'https:' && !isLocal
  } catch {
    return false
  }
}

/** Turns what was typed ("my-tunnel.example.com", "https://x.trycloudflare.com/") into a clean https origin, or null. */
export function cleanPhoneAddress(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  if (!isPublicHttps(candidate)) return null
  return new URL(candidate).origin
}

export function savedPhoneAddress(): string | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && isPublicHttps(saved) ? saved : null
  } catch {
    return null
  }
}

export function savePhoneAddress(origin: string | null) {
  try {
    if (origin) localStorage.setItem(STORAGE_KEY, origin)
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* private mode: it just isn't remembered */ }
}

/** The origin a phone can use right now, or null when the person has to give one. */
export function phoneOrigin(): string | null {
  if (!import.meta.client) return null
  return isPublicHttps(location.origin) ? location.origin : savedPhoneAddress()
}

/** The full address for the QR code. */
export function phoneLink(origin: string, code: string): string {
  return `${origin}/phone?code=${encodeURIComponent(code)}`
}
