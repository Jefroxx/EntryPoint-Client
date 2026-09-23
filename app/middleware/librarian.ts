// Librarian pages only look at the librarian session, and one portal per browser:
// a student session left open in another tab is ended when a librarian page opens.
export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie(SESSION_COOKIES.librarian.token)
  const role = useCookie(SESSION_COOKIES.librarian.role)

  if (!token.value || role.value !== 'librarian') {
    return navigateTo({ path: '/librarian/login', query: { redirect: to.fullPath } })
  }

  if (import.meta.client) useAuthSession('librarian').endOtherSession()
})
