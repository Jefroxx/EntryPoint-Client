/**
 * Keeps the page behind a window (modal, drawer) from scrolling while it is open, so there is one scrollbar, not two,
 * and scrolling to the end of the window doesn't carry on into the page.
 *
 * Windows can stack (a confirmation over a form), so locks are counted: the page is only freed when the last closes.
 * The scrollbar's width is added back as padding, so the page doesn't shift sideways when its scrollbar disappears.
 */
let locks = 0
let saved: { overflow: string; paddingRight: string } | null = null

function lock() {
  if (!import.meta.client) return
  if (locks++ > 0) return

  const root = document.documentElement
  saved = { overflow: root.style.overflow, paddingRight: root.style.paddingRight }
  const scrollbar = window.innerWidth - root.clientWidth
  root.style.overflow = 'hidden'
  if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`
}

function unlock() {
  if (!import.meta.client || locks === 0) return
  if (--locks > 0) return

  const root = document.documentElement
  root.style.overflow = saved?.overflow ?? ''
  root.style.paddingRight = saved?.paddingRight ?? ''
  saved = null
}

export function useBodyScrollLock(open: Ref<boolean>) {
  let held = false

  const sync = (isOpen: boolean) => {
    if (isOpen && !held) { lock(); held = true }
    else if (!isOpen && held) { unlock(); held = false }
  }

  onMounted(() => sync(open.value))
  watch(open, sync)
  // A window that is removed while open (leaving the page) must not leave the page locked.
  onBeforeUnmount(() => sync(false))
}
