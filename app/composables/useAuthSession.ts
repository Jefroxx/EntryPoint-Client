import { SESSION_COOKIES, otherArea, type Area } from '~/utils/session'

const SESSION_SECONDS = 60 * 60 * 24 * 7

// Every writer of the auth cookies must use the same options. A cookie written
// without a max-age is a browser-session cookie, and rewriting an existing one
// that way (e.g. when the profile name changes) would silently downgrade it.
const AUTH_COOKIE_OPTIONS = { maxAge: SESSION_SECONDS, sameSite: 'lax', path: '/' } as const

/** The cookies of one area: the five every session has, and the area's own extras (staff role and permissions, or member type). */
function areaCookies(area: Area) {
  const names = SESSION_COOKIES[area] as Record<string, string>
  const make = (name: string) => useCookie<string | null>(name, AUTH_COOKIE_OPTIONS)

  return {
    token: make(names.token!),
    uuid: make(names.uuid!),
    role: make(names.role!),
    firstName: make(names.firstName!),
    lastName: make(names.lastName!),
    // Staff side:
    staffRole: area === 'librarian' ? make(names.staffRole!) : undefined,
    staffPerms: area === 'librarian' ? make(names.staffPerms!) : undefined,
    // Student side:
    memberType: area === 'student' ? make(names.memberType!) : undefined,
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

  const studentProfile = useState<unknown>('student-profile', () => null)
  const studentWishlist = useState<unknown[]>('student-wishlist', () => [])
  const studentWishOptimistic = useState<Record<number, boolean>>('student-wish-optimistic', () => ({}))
  const notifications = useState<unknown[]>('librarian-notifications', () => [])
  const notificationsLoaded = useState('librarian-notifications-loaded', () => false)

  /** Forgets one area's cookies and whatever on-screen state belonged to that person. */
  function clear(target: Area) {
    for (const cookie of Object.values(target === area ? self : other)) if (cookie) cookie.value = null

    // (The librarian sidebar's expanded/collapsed state is a per-device preference cookie; it survives sign-outs.)
    if (target !== 'librarian') {
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

  function signIn(user: { token: string; uuid: string; role: string; firstName: string; lastName: string; staffRole?: string; staffPerms?: string[]; memberType?: string }) {
    endOtherSession()
self.token.value = user.token
    self.uuid.value = user.uuid
    self.role.value = user.role
    self.firstName.value = user.firstName
    self.lastName.value = user.lastName
    if (self.staffRole) self.staffRole.value = user.staffRole ?? null
    if (self.staffPerms) self.staffPerms.value = user.staffPerms ? user.staffPerms.join(',') : null
    if (self.memberType) self.memberType.value = user.memberType ?? null
  }

  function signOut() {
    clear(area)
  }

  return { ...self, signIn, signOut, endOtherSession }
}
