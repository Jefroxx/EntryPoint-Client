import { useAlert } from '~/api/alert/useAlert'
import { quietRefresherFor } from '~/composables/useLiveAsyncData'

/**
 * Runs an API action, shows a success/error toast, and refreshes whatever data
 * changed. Resolves to true on success so callers can close their modal/drawer.
 *
 * The save is what the librarian waits for, not the lists. A live list (`useLiveAsyncData`) refreshes in the
 * background, silently, so the window closes the moment the server says yes and the row updates in place a moment
 * later. Any other refresher is still awaited, as before.
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

      const waitFor: unknown[] = []
      for (const fn of refresh) {
        const quiet = quietRefresherFor(fn)
        if (quiet) void quiet()
        else waitFor.push(fn())
      }
      await Promise.all(waitFor)
      return true
    } catch (error: any) {
      alert.error(failTitle, apiErrorMessage(error))
      return false
    }
  }

  return { perform }
}
