import { useAlert } from '~/api/alert/useAlert'

/**
 * Runs an API action, shows a success/error toast, and refreshes whatever data
 * changed. Resolves to true on success so callers can close their modal/drawer.
 */
export function useAction() {
  const alert = useAlert()

  async function perform(
    action: () => Promise<{ message?: string }>,
    successTitle: string,
    failTitle: string,
    refresh: Array<() => unknown> = [],
  ): Promise<boolean> {
    try {
      const result = await action()
      // The server's message is shown under the title, unless it only says the title again ("Reservation cancelled" / "Reservation cancelled.").
      const same = (a: string, b: string) => a.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === b.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
      alert.success(successTitle, result?.message && !same(result.message, successTitle) ? result.message : undefined)
      await Promise.all(refresh.map((fn) => fn()))
      return true
    } catch (error: any) {
      alert.error(failTitle, apiErrorMessage(error))
      return false
    }
  }

  return { perform }
}
