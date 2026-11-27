/** How lists of cards are laid out: side by side in a grid, or one card per row. */
export type CardLayout = 'grid' | 'rows'

/**
 * The person's choice of card layout, for every list of cards on every side (student, librarian, admin). It is kept in
 * a cookie on this device (not on the account), so the server already draws the page the chosen way: no grid flashes
 * up before turning into rows. The choice is applied as one class on <html> (see app.vue and the `.card-grid` rules
 * in tailwind.css), so a list only has to say it is a card list.
 */
export function useCardLayout() {
  const cookie = useCookie<CardLayout>('_cardLayout', { default: () => 'grid', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })

  const layout = computed<CardLayout>({
    get: () => (cookie.value === 'rows' ? 'rows' : 'grid'),
    set: (value) => { cookie.value = value },
  })

  return { layout }
}
