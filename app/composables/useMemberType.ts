import { SESSION_COOKIES } from '~/utils/session'

/**
 * What kind of member is signed in on the student side. Faculty and staff borrow and visit like students, but points,
 * achievements, the Hall of Fame and the points shop are for students only (the server refuses them there too).
 * A session from before member types existed has no cookie and counts as a student.
 */
export function useMemberType() {
  const memberType = useCookie<string | null>(SESSION_COOKIES.student.memberType)

  const isStudent = computed(() => !memberType.value || memberType.value === 'student')
  const idLabel = computed(() => (isStudent.value ? 'Student ID' : 'Employee ID'))

  return { memberType, isStudent, idLabel }
}
