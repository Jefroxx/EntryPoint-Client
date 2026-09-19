import { SESSION_COOKIES, type Area } from '~/utils/session'

const SESSION_SECONDS = 60 * 60 * 24 * 7

// Every writer of the auth cookies must use the same options. A cookie written
// without a max-age is a browser-session cookie, and rewriting an existing one
// that way (e.g. when the profile name changes) would silently downgrade it.
const AUTH_COOKIE_OPTIONS = { maxAge: SESSION_SECONDS, sameSite: 'lax', path: '/' } as const

/**
 * One session per area. `useAuthSession()` is the librarian session (as it always
 * was); `useAuthSession('student')` is the student one. They don't touch each other.
 */
export function useAuthSession(area: Area = 'librarian') {
  const names = SESSION_COOKIES[area]

  const token = useCookie<string | null>(names.token, AUTH_COOKIE_OPTIONS)
  const uuid = useCookie<string | null>(names.uuid, AUTH_COOKIE_OPTIONS)
  const role = useCookie<string | null>(names.role, AUTH_COOKIE_OPTIONS)
  const firstName = useCookie<string | null>(names.firstName, AUTH_COOKIE_OPTIONS)
  const lastName = useCookie<string | null>(names.lastName, AUTH_COOKIE_OPTIONS)

  function signIn(user: { token: string; uuid: string; role: string; firstName: string; lastName: string }) {
    token.value = user.token
    uuid.value = user.uuid
    role.value = user.role
    firstName.value = user.firstName
    lastName.value = user.lastName
  }

  function signOut() {
    token.value = null
    uuid.value = null
    role.value = null
    firstName.value = null
    lastName.value = null

    if (area === 'librarian') {
      // The next login should start with the sidebar closed.
      useState('librarian-sidebar-open', () => false).value = false
    } else {
      // Student app state (profile counters, wishlist/cart) belongs to the person who just left.
      useState('student-profile', () => null).value = null
      useState('student-wishlist', () => []).value = []
      useState('student-wish-optimistic', () => ({})).value = {}
    }

    // ...and neither area may briefly show the previous person's notifications.
    useState('librarian-notifications', () => []).value = []
    useState('librarian-notifications-loaded', () => false).value = false
  }

  return { token, uuid, role, firstName, lastName, signIn, signOut }
}
