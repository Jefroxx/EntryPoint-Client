/**
 * How a staff account is named on screen: "Maria Santos · Librarian". The role is what the account may do (see the
 * Admin > Roles page): an administrator, a librarian, or a student assistant at the desk. Auto-imported.
 */
export interface StaffRef {
  name: string
  role: 'admin' | 'librarian' | 'assistant' | string
}

const STAFF_ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  librarian: 'Librarian',
  assistant: 'Student assistant',
}

export const staffRoleLabel = (role: string) => STAFF_ROLE_LABELS[role] ?? role

/** "Maria Santos · Librarian" */
export const staffLabel = (staff: StaffRef) => `${staff.name} · ${staffRoleLabel(staff.role)}`
