// Librarian pages only look at the librarian session.
export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie(SESSION_COOKIES.librarian.token)
  const role = useCookie(SESSION_COOKIES.librarian.role)

  if (!token.value || role.value !== 'librarian') {
    return navigateTo({ path: '/librarian/login', query: { redirect: to.fullPath } })
  }
})
