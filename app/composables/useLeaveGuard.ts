/**
 * For a page that is itself a form (the student's profile and "Suggest a book"): asks before they leave it with
 * something typed that has not been saved. Leaving by the tab bar, a link or the back button asks through `asking`
 * (show it as a dialog and call `stay` or `leave`); refreshing or closing the tab uses the browser's own prompt, which
 * a page cannot restyle.
 *
 *   const { asking, stay, leave } = useLeaveGuard(() => form.title.trim() !== '')
 *   <StudentSheet :open="asking" title="Discard Changes?" @close="stay"> ... </StudentSheet>
 *
 * Switching tabs inside the same page (a query change) is not leaving it, so it never asks.
 */
export function useLeaveGuard(dirty: () => boolean) {
  const asking = ref(false)
  let decide: ((leave: boolean) => void) | null = null

  onBeforeRouteLeave(() => {
    if (!dirty()) return true

    asking.value = true
    // The navigation waits here until they answer.
    return new Promise<boolean>((resolve) => { decide = resolve })
  })

  function answer(leave: boolean) {
    asking.value = false
    decide?.(leave)
    decide = null
  }

  function warnBeforeUnload(event: BeforeUnloadEvent) {
    if (!dirty()) return
    event.preventDefault()
    event.returnValue = ''
  }

  onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload))

  return { asking, stay: () => answer(false), leave: () => answer(true) }
}
