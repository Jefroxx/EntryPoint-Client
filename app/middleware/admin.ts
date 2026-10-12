// The admin side is for administrators. A librarian or assistant who opens it goes to their own dashboard;
// nobody signed in goes to the staff sign-in. (The server refuses the requests either way.)
export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie(SESSION_COOKIES.librarian.token)
  const role = useCookie(SESSION_COOKIES.librarian.role)
  const staffRole = useCookie(SESSION_COOKIES.librarian.staffRole)

  if (!token.value || role.value !== 'librarian') {
    return navigateTo({ path: '/librarian/login', query: { redirect: to.fullPath } })
  }

  if (staffRole.value !== 'admin') return navigateTo('/librarian/dashboard')

  if (import.meta.client) useAuthSession('librarian').endOtherSession()
})
