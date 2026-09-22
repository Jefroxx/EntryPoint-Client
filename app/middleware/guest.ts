// For /login, /register and /librarian/login: someone already signed in *to that door's
// area* has nothing to do here, so they go straight to their home. A session in the other
// area is no reason to turn anyone away — signing in ends it (see `useAuthSession`).
export default defineNuxtRouteMiddleware((to) => {
  if (areaFromPath(to.path) === 'librarian') {
    const token = useCookie(SESSION_COOKIES.librarian.token)
    const role = useCookie(SESSION_COOKIES.librarian.role)
    if (token.value && role.value === 'librarian') return navigateTo(homeFor('librarian'))
    return
  }

  if (useCookie(SESSION_COOKIES.student.token).value) return navigateTo(homeFor('student'))
})
