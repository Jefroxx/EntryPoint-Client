import { SESSION_COOKIES, areaFromPath } from '~/utils/session'

/**
 * A student account is open in one place at a time: signing in elsewhere ends this sign-in. The server does that at
 * once, but this window only finds out when it next asks the server something, and the pages ask rarely (about once a
 * minute, and not at all while the tab is hidden). So, on the student side, a featherweight request goes out every
 * few seconds, and again whenever the window is clicked into or comes back into view. A dead sign-in answers 401,
 * and the session-expiry plugin then sends the person to the sign-in page with the reason.
 */
const CHECK_EVERY_MS = 8_000

export default defineNuxtPlugin(() => {
  const apiBase = useRuntimeConfig().public.apiBaseURL as string
  const route = useRoute()
  const token = useCookie<string | null>(SESSION_COOKIES.student.token)
  let checking = false

  async function check() {
    // Only a signed-in student, on a student page, while the tab is showing.
    if (checking || document.visibilityState !== 'visible' || !token.value) return
    if (areaFromPath(route.path) !== 'student') return

    checking = true
    try {
      await $fetch('/session', { baseURL: apiBase, headers: { Accept: 'application/json', Authorization: `Bearer ${token.value}` } })
    } catch {
      // A 401 is handled for every request by the session-expiry plugin; anything else (offline) is retried next time.
    } finally {
      checking = false
    }
  }

  window.setInterval(check, CHECK_EVERY_MS)
  window.addEventListener('focus', check)
  document.addEventListener('visibilitychange', check)
})
