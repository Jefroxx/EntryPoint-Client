// Student pages only look at the student session. Being signed in as a librarian in
// another tab is a separate matter: it neither grants access here nor gets in the way.
export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie(SESSION_COOKIES.student.token)

  if (!token.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
