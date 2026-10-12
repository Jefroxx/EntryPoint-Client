import type { StaffAccess } from '~/services/authService'
import { SESSION_COOKIES } from '~/utils/session'

/** The areas of the librarian side, and the permission each one needs (see the server's config/permissions.php). */
export const STAFF_AREAS: { prefix: string; permission: string }[] = [
  { prefix: '/librarian/library', permission: 'library' },
  { prefix: '/librarian/circulation', permission: 'circulation' },
  { prefix: '/librarian/students', permission: 'students' },
  { prefix: '/librarian/attendance', permission: 'attendance' },
  { prefix: '/librarian/resources', permission: 'resources' },
  { prefix: '/librarian/engagement', permission: 'engagement' },
  { prefix: '/librarian/reports', permission: 'reports' },
]

/** The permission a librarian-side path needs, or null when every staff account may open it. */
export function permissionForPath(path: string): string | null {
  const lower = path.toLowerCase()
  return STAFF_AREAS.find((a) => lower === a.prefix || lower.startsWith(a.prefix + '/') || lower.startsWith(a.prefix + '?'))?.permission ?? null
}

/**
 * What the signed-in staff account is allowed to do. Seeded from the cookies the login wrote (so the sidebar is right
 * on the first paint) and refreshed from the server, because an administrator can change a role while someone is
 * signed in. The server enforces all of this; the screens use it only to show what applies.
 */
export function useStaffAccess() {
  const role = useCookie<string | null>(SESSION_COOKIES.librarian.staffRole)
  const perms = useCookie<string | null>(SESSION_COOKIES.librarian.staffPerms)
  const token = useCookie<string | null>(SESSION_COOKIES.librarian.token)
  const apiBaseURL = useRuntimeConfig().public.apiBaseURL as string

  const permissions = computed(() => (perms.value ? perms.value.split(',').filter(Boolean) : []))
  const isAdmin = computed(() => role.value === 'admin')
  // A session from before roles existed has no role cookie: treat it as a librarian until the refresh says otherwise.
  const knowsRole = computed(() => !!role.value)

  /** Whether a feature is available. An administrator can do everything. */
  function can(permission: string | null): boolean {
    if (permission === null) return true
    if (!knowsRole.value) return true
    return isAdmin.value || permissions.value.includes(permission)
  }

  async function refresh(): Promise<StaffAccess | null> {
    if (!token.value) return null
    try {
      const me = await $fetch<StaffAccess>('/librarian/me', {
        baseURL: apiBaseURL,
        headers: { Accept: 'application/json', Authorization: `Bearer ${token.value}` },
      })
      role.value = me.role
      perms.value = me.permissions.join(',')
      return me
    } catch {
      return null
    }
  }

  return { role, permissions, isAdmin, can, refresh }
}
