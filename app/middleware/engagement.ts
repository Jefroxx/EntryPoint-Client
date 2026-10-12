// Points, rewards and achievements are for students: a faculty or staff member who opens one goes Home.
export default defineNuxtRouteMiddleware(() => {
  if (!useMemberType().isStudent.value) return navigateTo('/student/home')
})
