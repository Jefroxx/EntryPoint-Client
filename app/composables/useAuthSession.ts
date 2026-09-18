const SESSION_SECONDS = 60 * 60 * 24 * 7

// Every writer of the auth cookies must use the same options. A cookie written
// without a max-age is a browser-session cookie, and rewriting an existing one
// that way (e.g. when the profile name changes) would silently downgrade it.
const AUTH_COOKIE_OPTIONS = { maxAge: SESSION_SECONDS, sameSite: 'lax', path: '/' } as const

export function useAuthSession() {
  const token = useCookie<string | null>('_token', AUTH_COOKIE_OPTIONS)
  const uuid = useCookie<string | null>('_uuid', AUTH_COOKIE_OPTIONS)
  const role = useCookie<string | null>('_role', AUTH_COOKIE_OPTIONS)
  const firstName = useCookie<string | null>('_firstName', AUTH_COOKIE_OPTIONS)
  const lastName = useCookie<string | null>('_lastName', AUTH_COOKIE_OPTIONS)

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

    // The next login should start with the sidebar closed.
    useState('librarian-sidebar-open', () => false).value = false

    // ...and must not briefly show the previous librarian's notifications.
    useState('librarian-notifications', () => []).value = []
    useState('librarian-notifications-loaded', () => false).value = false
  }

  return { token, uuid, role, firstName, lastName, signIn, signOut }
}
