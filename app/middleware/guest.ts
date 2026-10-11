// For /login, /register and /librarian/login: anyone already signed in, to *either* area, has
// nothing to do here, so they go straight to their own home. One account per browser: to use
// another account they sign out first (otherwise a second tab could sign in over the first).
export default defineNuxtRouteMiddleware(() => {
  const librarian = useCookie(SESSION_COOKIES.librarian.token)
  const librarianRole = useCookie(SESSION_COOKIES.librarian.role)
  if (librarian.value && librarianRole.value === 'librarian') return navigateTo(homeFor('librarian'))

  if (useCookie(SESSION_COOKIES.student.token).value) return navigateTo(homeFor('student'))
})
