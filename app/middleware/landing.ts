// "/" is the public landing page. Anyone already signed in, to either area, skips it and goes
// to their own home (students first, as with the `home` signpost); everyone else sees the page.
export default defineNuxtRouteMiddleware(() => {
  if (useCookie(SESSION_COOKIES.student.token).value) return navigateTo(homeFor('student'), { replace: true })

  const librarian = useCookie(SESSION_COOKIES.librarian.token).value && useCookie(SESSION_COOKIES.librarian.role).value === 'librarian'
  if (librarian) return navigateTo(homeFor('librarian', useCookie(SESSION_COOKIES.librarian.staffRole).value), { replace: true })
})
