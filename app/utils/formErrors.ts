/**
 * The per-field messages from a Laravel validation error (a 422), first message of each field, or null when the error
 * is something else. Lets a form put each message under its own field instead of showing one toast.
 */
export function serverFieldErrors(error: unknown): Record<string, string> | null {
  const e = error as { data?: { errors?: unknown }; response?: { _data?: { errors?: unknown } } } | null
  const errors = e?.data?.errors ?? e?.response?._data?.errors

  if (!errors || typeof errors !== 'object') return null

  return Object.fromEntries(
    Object.entries(errors as Record<string, unknown>).map(([field, messages]) => [field, Array.isArray(messages) ? String(messages[0]) : String(messages)]),
  )
}
