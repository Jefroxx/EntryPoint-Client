import { SESSION_COOKIES, otherArea, type Area } from '~/utils/session'

const SESSION_SECONDS = 60 * 60 * 24 * 7

// Every writer of the auth cookies must use the same options. A cookie written
// without a max-age is a browser-session cookie, and rewriting an existing one
// that way (e.g. when the profile name changes) would silently downgrade it.
const AUTH_COOKIE_OPTIONS = { maxAge: SESSION_SECONDS, sameSite: 'lax', path: '/' } as const

/** The five cookies of one area. */
function areaCookies(area: Area) {
  const names = SESSION_COOKIES[area]

  return {
    token: useCookie<string | null>(names.token, AUTH_COOKIE_OPTIONS),
    uuid: useCookie<string | null>(names.uuid, AUTH_COOKIE_OPTIONS),
    role: useCookie<string | null>(names.role, AUTH_COOKIE_OPTIONS),
    firstName: useCookie<string | null>(names.firstName, AUTH_COOKIE_OPTIONS),
    lastName: useCookie<string | null>(names.lastName, AUTH_COOKIE_OPTIONS),
  }
}

/**
 * One session per area. `useAuthSession()` is the librarian session (as it always
 * was); `useAuthSession('student')` is the student one. Only one of the two may be
 * signed in per browser: signing in here ends whatever the other portal left behind.
 */
export function useAuthSession(area: Area = 'librarian') {
  const self = areaCookies(area)
  // The other portal's cookies and the state below are resolved now, while the Nuxt
  // context is available: they are cleared from a sign-in handler, after an `await`.
  const other = areaCookies(otherArea(area))
  const apiBaseURL = useRuntimeConfig().public.apiBaseURL as string

  const librarianSidebar = useState('librarian-sidebar-open', () => false)
  const studentProfile = useState<unknown>('student-profile', () => null)
  const studentWishlist = useState<unknown[]>('student-wishlist', () => [])
  const studentWishOptimistic = useState<Record<number, boolean>>('student-wish-optimistic', () => ({}))
  const notifications = useState<unknown[]>('librarian-notifications', () => [])
  const notificationsLoaded = useState('librarian-notifications-loaded', () => false)

  /** Forgets one area's cookies and whatever on-screen state belonged to that person. */
  function clear(target: Area) {
    for (const cookie of Object.values(target === area ? self : other)) cookie.value = null

    if (target === 'librarian') {
      // The next login should start with the sidebar closed.
      librarianSidebar.value = false
    } else {
      // Student app state (profile counters, wishlist/cart) belongs to the person who just left.
      studentProfile.value = null
      studentWishlist.value = []
      studentWishOptimistic.value = {}
    }

    // ...and neither area may briefly show the previous person's notifications.
    notifications.value = []
    notificationsLoaded.value = false
  }

  /**
   * One portal per browser. The two sessions hold separate tokens, so the abandoned
   * one is revoked on the server rather than left alive with nothing watching it.
   */
  function endOtherSession() {
    const token = other.token.value
    if (!token) return

    // Best effort: the cookies go either way, and a dead token fails the same as a live one.
    void $fetch('/logout', {
      baseURL: apiBaseURL,
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    }).catch(() => {})

    clear(otherArea(area))
  }

  function signIn(user: { token: string; uuid: string; role: string; firstName: string; lastName: string }) {
    endOtherSession()

    self.token.value = user.token
    self.uuid.value = user.uuid
    self.role.value = user.role
    self.firstName.value = user.firstName
    self.lastName.value = user.lastName
  }

  function signOut() {
    clear(area)
  }

  return { ...self, signIn, signOut, endOtherSession }
}
