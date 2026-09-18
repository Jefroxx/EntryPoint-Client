/** Field-level messages from a Laravel 422 response, keyed by field name (first message per field). */
export function apiFieldErrors(error: any): Record<string, string> {
  const raw = error?.data?.errors
  if (!raw) return {}

  return Object.fromEntries(
    Object.entries(raw).map(([field, messages]) => [field, Array.isArray(messages) ? String(messages[0]) : String(messages)]),
  )
}

/** The most useful single message for a failed API call. */
export function apiErrorMessage(error: any, fallback = 'Please try again.'): string {
  const firstFieldError = Object.values(apiFieldErrors(error))[0]
  return firstFieldError || error?.data?.message || fallback
}
