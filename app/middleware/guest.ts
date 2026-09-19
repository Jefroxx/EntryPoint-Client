// For /login, /register and /librarian/login: someone already signed in *to that door's
// area* has nothing to do here, so they go straight to their home. A librarian session
// doesn't count for the student door (or the reverse), so both can be signed in at once.
export default defineNuxtRouteMiddleware((to) => {
  if (areaFromPath(to.path) === 'librarian') {
    const token = useCookie(SESSION_COOKIES.librarian.token)
    const role = useCookie(SESSION_COOKIES.librarian.role)
    if (token.value && role.value === 'librarian') return navigateTo(homeFor('librarian'))
    return
  }

  if (useCookie(SESSION_COOKIES.student.token).value) return navigateTo(homeFor('student'))
})
