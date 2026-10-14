// While an account is still on the temporary password an administrator gave it, the only page it can open is
// /set-password (the server refuses everything else too). Once it has chosen its own, that page has nothing to offer.
export default defineNuxtRouteMiddleware((to) => {
  const pending = (area: 'librarian' | 'student') =>
    !!useCookie(SESSION_COOKIES[area].token).value && useCookie(SESSION_COOKIES[area].mustChange).value === '1'

  const must = pending('librarian') || pending('student')
  const onPage = to.path.toLowerCase() === '/set-password'

  if (must && !onPage) return navigateTo('/set-password')
  if (!must && onPage) return navigateTo('/')
})
