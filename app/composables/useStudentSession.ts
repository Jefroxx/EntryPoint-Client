import { authService } from '~/services/auth/AuthService'

/** Ends the student session on the server (best effort), clears it here, and returns to /login. */
export function useStudentSession() {
  const { signOut } = useAuthSession('student')

  async function signOutStudent() {
    try {
      await authService.logout('student')
    } catch {
      // The token may already be gone server-side; the local sign-out is what matters.
    }

    signOut()
    await navigateTo('/login')
  }

  return { signOutStudent }
}
