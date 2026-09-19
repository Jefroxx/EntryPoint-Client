import { studentService, type ProfileResponse, type WishlistRow } from '~/services/studentService'
import { useAlert } from '~/api/alert/useAlert'

const MAX_CART_ITEMS = 3

/**
 * Everything the student shell keeps in sync across screens: profile counters
 * (points, streak, slots), and the wishlist rows that also carry the cart.
 * One instance of state, so a heart tapped in Discover is filled in the drawer.
 */
export function useStudent() {
  const summary = useState<ProfileResponse | null>('student-profile', () => null)
  const wishlist = useState<WishlistRow[]>('student-wishlist', () => [])
  // Hearts flip instantly; the server answer confirms (or undoes) them.
  const optimisticWish = useState<Record<number, boolean>>('student-wish-optimistic', () => ({}))
  const alert = useAlert()
  // Bumped whenever something the pages show changes (reserve, return, redeem...), so any page that is
  // currently on screen can re-fetch itself while a drawer or sheet floats above it.
  const dataVersion = useState('student-data-version', () => 0)
  const bumpData = () => { dataVersion.value++ }

  const stats = computed(() => summary.value?.stats ?? null)
  const points = computed(() => summary.value?.points ?? 0)
  const streak = computed(() => summary.value?.visitStreak ?? 0)
  const slotsLeft = computed(() => stats.value?.slotsLeft ?? 3)
  const cart = computed(() => wishlist.value.filter((row) => row.inCart))
  const attention = computed(() => (stats.value?.overdueLoans ?? 0) + (stats.value?.readyReservations ?? 0))

  const wishedIds = computed(() => new Set(wishlist.value.map((row) => row.bookID)))
  const isWished = (bookID: number): boolean =>
    bookID in optimisticWish.value ? optimisticWish.value[bookID]! : wishedIds.value.has(bookID)
  const isInCart = (bookID: number): boolean => cart.value.some((row) => row.bookID === bookID)

  async function refreshProfile() {
    try {
      summary.value = await studentService.profile()
    } catch {
      // Keep what we have; the next refresh tries again.
    }
  }

  async function refreshWishlist() {
    try {
      wishlist.value = (await studentService.wishlist()).wishlist
    } catch {
      // Same: never blank the UI because a refresh failed.
    }
  }

  const refreshShell = () => Promise.all([refreshProfile(), refreshWishlist()])

  /** Returns true when the wishlist now contains the book. */
  async function toggleWish(bookID: number): Promise<boolean> {
    const existing = wishlist.value.find((row) => row.bookID === bookID)
    const next = !isWished(bookID)
    optimisticWish.value = { ...optimisticWish.value, [bookID]: next }

    try {
      if (existing && !next) await studentService.removeFromWishlist(existing.wishlistID)
      else if (!existing && next) await studentService.addToWishlist(bookID)
      await Promise.all([refreshWishlist(), refreshProfile()])
      alert.success(next ? 'Saved to wishlist' : 'Removed from wishlist')
      return next
    } catch (error: any) {
      alert.error('Could not update your wishlist', apiErrorMessage(error))
      return !next
    } finally {
      const { [bookID]: _done, ...rest } = optimisticWish.value
      optimisticWish.value = rest
    }
  }

  async function addToCart(bookID: number): Promise<boolean> {
    if (isInCart(bookID)) {
      alert.error('Already in your cart')
      return false
    }
    if (cart.value.length >= MAX_CART_ITEMS) {
      alert.error('Your cart is full', `You can hold up to ${MAX_CART_ITEMS} books at a time.`)
      return false
    }

    try {
      await studentService.addToCart(bookID)
      await Promise.all([refreshWishlist(), refreshProfile()])
      alert.success('Added to cart')
      return true
    } catch (error: any) {
      alert.error('Could not add to cart', apiErrorMessage(error))
      return false
    }
  }

  async function removeFromCart(row: WishlistRow): Promise<boolean> {
    try {
      await studentService.removeFromCart(row.wishlistID)
      await Promise.all([refreshWishlist(), refreshProfile()])
      return true
    } catch (error: any) {
      alert.error('Could not remove it', apiErrorMessage(error))
      return false
    }
  }

  async function removeWishlistRow(row: WishlistRow): Promise<boolean> {
    try {
      await studentService.removeFromWishlist(row.wishlistID)
      await Promise.all([refreshWishlist(), refreshProfile()])
      alert.success('Removed from wishlist')
      return true
    } catch (error: any) {
      alert.error('Could not remove it', apiErrorMessage(error))
      return false
    }
  }

  return {
    summary, stats, points, streak, slotsLeft, cart, wishlist, attention, dataVersion, bumpData,
    isWished, isInCart,
    refreshProfile, refreshWishlist, refreshShell,
    toggleWish, addToCart, removeFromCart, removeWishlistRow,
  }
}
