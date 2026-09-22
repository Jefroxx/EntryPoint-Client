/**
 * Students and librarians each get their own session, stored under their own
 * cookie names. Only one of them may be signed in per browser: signing in to
 * one portal ends the other's session (see `useAuthSession`). The librarian
 * names are the original ones, so librarians already signed in stay signed in.
 */
export type Area = 'librarian' | 'student'

export const SESSION_COOKIES = {
  librarian: { token: '_token', role: '_role', uuid: '_uuid', firstName: '_firstName', lastName: '_lastName' },
  student: { token: '_student_token', role: '_student_role', uuid: '_student_uuid', firstName: '_student_firstName', lastName: '_student_lastName' },
} as const

/** The portal that is not this one. */
export const otherArea = (area: Area): Area => (area === 'student' ? 'librarian' : 'student')

/** Which session a page belongs to: everything under /student, plus the student sign-in and register pages. */
export function areaFromPath(path: string): Area {
  const lower = path.toLowerCase()
  const isStudent = lower === '/login' || lower === '/register' || lower === '/student' || lower.startsWith('/student/')
  return isStudent ? 'student' : 'librarian'
}

/** Where each kind of signed-in user lives. */
export function homeFor(role: string | null | undefined): string {
  if (role === 'student') return '/student/home'
  if (role === 'librarian') return '/librarian/dashboard'
  return '/login'
}

/**
 * The page to return to after signing in (the `?redirect=` param). Only an
 * internal path inside the signed-in user's own area is honoured, so a crafted
 * link can't bounce someone to another site or to the other role's pages.
 */
export function safeRedirect(target: unknown, role: string): string {
  const path = Array.isArray(target) ? target[0] : target
  const fallback = homeFor(role)

  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback

  const area = role === 'student' ? '/student' : '/librarian'
  const lower = path.toLowerCase()
  const insideArea = lower === area || lower.startsWith(`${area}/`) || lower.startsWith(`${area}?`)

  // The sign-in pages themselves are never a valid destination.
  return insideArea && !lower.endsWith('/login') ? path : fallback
}
