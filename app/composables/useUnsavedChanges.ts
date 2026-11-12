/**
 * Whether a window (or a page) holds changes that would be lost if it were closed now: what is typed in it differs
 * from how it was when it opened. Opening an Edit window and closing it untouched is not a change, and neither is an
 * empty "new" form, so the "are you sure?" step only appears when there really is something to lose.
 *
 * `source` returns whatever holds the typed values (the form object, or an array of several); it is compared as JSON.
 * The starting point is taken when `isOpen` turns true, after the window has filled itself in (a form that fills
 * its fields from the record being edited does that when it opens), so that filling is not counted as a change.
 *
 *   const { dirty } = useUnsavedChanges(() => [form, authors.value], () => props.open)
 *   <LibrarianModalShell :dirty="dirty" ...>
 */
export function useUnsavedChanges(source: () => unknown, isOpen: () => boolean = () => true) {
  const baseline = ref<string | null>(null)

  function snapshot(): string {
    try {
      return JSON.stringify(source()) ?? ''
    } catch {
      return ''
    }
  }

  /** Counts what is in the window right now as "unchanged" (for example right after a successful save). */
  function markClean() {
    baseline.value = snapshot()
  }

  // 'post' flush: runs after the window's own "I just opened, fill the form" watcher and the render that follows.
  watch(isOpen, (open) => {
    baseline.value = open ? snapshot() : null
  }, { immediate: true, flush: 'post' })

  const dirty = computed(() => isOpen() && baseline.value !== null && snapshot() !== baseline.value)

  return { dirty, markClean }
}
