import type { Area } from '~/utils/session'

let endingSession = false

/**
 * A 401 means the token is dead (it was revoked, or the database was reset). Instead of leaving
 * every page silently empty, end that session and send the person to their own sign-in, which
 * brings them back to the same page afterwards.
 */
export async function endExpiredSession(area: Area, reason?: string) {
  if (!import.meta.client || endingSession) return

  endingSession = true
  try {
    const back = useRoute().fullPath
    useAuthSession(area).signOut()
    // "elsewhere": the account was signed in on another browser or device, which ends this one.
    // "idle": the sign-in sat unused for 4 hours, so the server ended it.
    const expired = reason === 'signed_in_elsewhere' ? 'elsewhere' : reason === 'idle' ? 'idle' : '1'
    await navigateTo({ path: area === 'student' ? '/login' : '/librarian/login', query: { redirect: back, expired } })
  } finally {
    endingSession = false
  }
}
