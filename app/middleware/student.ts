export default defineNuxtRouteMiddleware(() => {
  const token = useCookie('_token')
  const role = useCookie('_role')

  if (!token.value || role.value !== 'student') {
    return navigateTo('/')
  }
})
