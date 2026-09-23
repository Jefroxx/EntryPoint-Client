// "/" and "/student" are only signposts. Students get their home; with no student session,
// "/" falls back to a librarian session if there is one, otherwise to the student sign-in.
export default defineNuxtRouteMiddleware((to) => {
  const student = useCookie(SESSION_COOKIES.student.token).value
  const librarian = useCookie(SESSION_COOKIES.librarian.token).value && useCookie(SESSION_COOKIES.librarian.role).value === 'librarian'

  if (student) return navigateTo(homeFor('student'), { replace: true })
  if (librarian && areaFromPath(to.path) !== 'student') return navigateTo(homeFor('librarian'), { replace: true })

  return navigateTo('/login', { replace: true })
})
