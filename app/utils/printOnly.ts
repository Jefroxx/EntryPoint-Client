/**
 * Prints one element on its own: the library card, a checkout receipt. The element (a `.print-only`
 * copy teleported to <body>) is marked for the length of the print, and one global rule in tailwind.css
 * hides everything else in <body>. Marking at print time, rather than each printable carrying its own
 * "hide everything but me" rule, means two printables loaded in the same tab can't hide each other.
 */
export function printOnly(el: HTMLElement | null | undefined) {
  if (!el) {
    window.print()
    return
  }

  const body = document.body
  const done = () => {
    el.classList.remove('print-now')
    body.classList.remove('printing')
    window.removeEventListener('afterprint', done)
  }

  el.classList.add('print-now')
  body.classList.add('printing')
  window.addEventListener('afterprint', done)
  window.print()
}
