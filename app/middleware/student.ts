// Student pages only look at the student session. A librarian session in this browser
// is not a way in here either: one portal per browser, so any leftover librarian
// session is ended as soon as a student page is opened.
export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie(SESSION_COOKIES.student.token)

  if (!token.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  // Cookies from before this rule (or a librarian tab left open) are cleared here; that
  // tab drops to its own sign-in at its next navigation.
  if (import.meta.client) useAuthSession('student').endOtherSession()
})
