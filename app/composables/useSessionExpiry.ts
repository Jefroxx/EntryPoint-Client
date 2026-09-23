import type { Area } from '~/utils/session'

let endingSession = false

/**
 * A 401 means the token is dead (it was revoked, or the database was reset). Instead of leaving
 * every page silently empty, end that session and send the person to their own sign-in, which
 * brings them back to the same page afterwards.
 */
export async function endExpiredSession(area: Area) {
  if (!import.meta.client || endingSession) return

  endingSession = true
  try {
    const back = useRoute().fullPath
    useAuthSession(area).signOut()
    await navigateTo({ path: area === 'student' ? '/login' : '/librarian/login', query: { redirect: back, expired: '1' } })
  } finally {
    endingSession = false
  }
}
