/** However fast a page is, the loader stays up for at least one quarter turn of the mark. */
const MIN_VISIBLE_MS = 700
/** A request that never settles must not trap the page behind the loader. Generous, so slow connections still finish behind it. */
const MAX_VISIBLE_MS = 25_000
/** Once the last request answers, wait this long before hiding: a request chained after it (or the table rendering) still counts. */
const SETTLE_MS = 200

/**
 * The full-screen loader's state (see AppLoader.vue in app.vue). It is up from first paint and from the
 * start of every page change, and comes down once the new page is set up *and* every API request made while
 * it was loading has answered. Requests that start later (polling, filters, saves) never bring it back;
 * those keep their in-card spinners.
 */
export function usePageLoader() {
	return useState('page-loader', () => ({
		active: true, // true on first paint, so the server-rendered HTML already shows it
		routing: false, // between a route change starting and its page finishing
		pending: 0, // page data still loading
		since: 0,
	}))
}

/**
 * Called by plugins/page-loader.client.ts for every API request. While the
 * loader is up (a page is loading), the request holds it until the response arrives, whether the page
 * asked for it in setup, in onMounted or through useAsyncData. Once the loader is down, requests pass
 * through untouched. Takes the state from the caller because a request can start outside a component.
 */
export function trackPageRequest<T>(loader: ReturnType<typeof usePageLoader>, request: Promise<T>): Promise<T> {
	if (!loader.value.active) return request

	loader.value.pending++
	const done = () => { loader.value.pending = Math.max(0, loader.value.pending - 1) }
	request.then(done, done)
	return request
}

/** Wires the loader to the router. Call once, from app.vue. */
export function setupPageLoader() {
	const loader = usePageLoader()
	if (import.meta.server) return loader

	const nuxtApp = useNuxtApp()
	const router = useRouter()
	let booting = true
	let hideTimer: ReturnType<typeof setTimeout> | undefined
	let capTimer: ReturnType<typeof setTimeout> | undefined

	function show() {
		clearTimeout(hideTimer)
		if (!loader.value.active) loader.value.since = performance.now()
		loader.value.active = true
		clearTimeout(capTimer)
		capTimer = setTimeout(() => { loader.value.pending = 0; loader.value.routing = false; tryHide() }, MAX_VISIBLE_MS)
	}

	function tryHide() {
		if (booting || loader.value.routing || loader.value.pending > 0) return
		clearTimeout(hideTimer)
		const wait = Math.max(SETTLE_MS, MIN_VISIBLE_MS - (performance.now() - loader.value.since))
		hideTimer = setTimeout(() => {
			if (loader.value.routing || loader.value.pending > 0) return
			loader.value.active = false
			clearTimeout(capTimer)
		}, wait)
	}

	// Only a different page counts; a query change (a filter, a tab, pagination) stays on the page.
	// Sign-in, register and librarian sign-in (the auth layout) only get the loader on first load; moving
	// between them, or landing on one after signing out, swaps the form in place without it.
	router.beforeEach((to, from) => {
		if (to.path === from.path || to.meta.layout === 'auth') return
		loader.value.routing = true
		show()
	})
	// A blocked or redirected navigation never reaches page:finish.
	router.afterEach((_to, _from, failure) => {
		if (!failure) return
		loader.value.routing = false
		tryHide()
	})
	router.onError(() => { loader.value.routing = false; tryHide() })
	// Requests the page starts after this (in onMounted, once its transition ends) still count: the
	// loader is up for at least MIN_VISIBLE_MS and re-checks the count before it hides.
	nuxtApp.hook('page:finish', () => { loader.value.routing = false; tryHide() })

	watch(() => loader.value.pending, tryHide)

	onMounted(async () => {
		show()
		loader.value.since = 0 // first paint was the start; the page has been loading since then
		// Fonts normally settle well under a second; the cap stops a stalled font request from holding the page.
		await Promise.race([document.fonts?.ready, new Promise(resolve => setTimeout(resolve, 2500))])
		booting = false
		tryHide()
	})

	return loader
}
