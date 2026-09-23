export type DrawerKind = 'book' | 'cart'

const DRAWER_KEYS = ['book', 'cart']

/**
 * Book details and the cart are drawers driven by the URL (?book=12, ?cart=1).
 * The wishlist is its own page (/student/wishlist). That gives them the right behaviour for
 * free: the phone's back button closes them, and a link opens straight to one.
 */
export function useDrawer() {
  const route = useRoute()
  const router = useRouter()

  const active = computed<{ kind: DrawerKind; id?: number } | null>(() => {
    const q = route.query
    if (q.book) return { kind: 'book', id: Number(q.book) }
    if (q.cart) return { kind: 'cart' }
    return null
  })

  const withoutDrawers = () => Object.fromEntries(Object.entries(route.query).filter(([key]) => !DRAWER_KEYS.includes(key)))

  function open(kind: DrawerKind, id?: number) {
    return router.push({ query: { ...withoutDrawers(), [kind]: kind === 'book' ? String(id) : '1' } })
  }

  function close() {
    // If we got here by opening a drawer, "back" is the natural inverse.
    const back = import.meta.client ? window.history.state?.back : null
    if (typeof back === 'string' && !DRAWER_KEYS.some((key) => back.includes(`${key}=`))) return router.back()
    return router.replace({ query: withoutDrawers() })
  }

  return { active, open, close }
}
