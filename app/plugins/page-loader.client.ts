// Every API request made while a page is loading keeps the full-screen loader up (composables/usePageLoader.ts).
// Hooked on window.fetch rather than $fetch: Nuxt's auto-imported $fetch is a copy of globalThis.$fetch taken
// before plugins run, so replacing the global wouldn't reach the services. ofetch looks up window.fetch on
// every call, so this sees them all, whether they go through BaseService or call $fetch directly.
export default defineNuxtPlugin(() => {
	const apiBase = useRuntimeConfig().public.apiBaseURL as string
	const loader = usePageLoader()
	const nativeFetch = window.fetch.bind(window)

	window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
		const response = nativeFetch(input, init)
		const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
		// Once the loader is down, requests pass through untouched.
		if (!url.startsWith(apiBase) || !loader.value.active) return response
		// fetch() resolves once the headers arrive; on a slow connection a table's JSON is still downloading
		// then. Hold the loader until a copy of the body has been read to the end, so the data is really here.
		trackPageRequest(loader, response.then(res => res.clone().arrayBuffer()).catch(() => {}))
		return response
	}
})
