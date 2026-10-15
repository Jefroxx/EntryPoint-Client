// Librarian pages only look at the librarian session, and one portal per browser:
// a student session left open in another tab is ended when a librarian page opens.
export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie(SESSION_COOKIES.librarian.token)
  const role = useCookie(SESSION_COOKIES.librarian.role)

  if (!token.value || role.value !== 'librarian') {
    return navigateTo({ path: '/librarian/login', query: { redirect: to.fullPath } })
  }

  if (import.meta.client) useAuthSession('librarian').endOtherSession()

  // Administrators have their own side. The librarian pages are not for them (the server refuses their requests too);
  // the notifications page is shared.
  if (useCookie(SESSION_COOKIES.librarian.staffRole).value === 'admin' && !to.path.toLowerCase().startsWith('/librarian/notifications')) {
    return navigateTo('/admin/dashboard')
  }

  // A role that can't use this area goes to the dashboard instead (the server refuses its requests anyway).
  const needed = permissionForPath(to.path)
  if (needed && !useStaffAccess().can(needed)) return navigateTo('/librarian/dashboard')
})
