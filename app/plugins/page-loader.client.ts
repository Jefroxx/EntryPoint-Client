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
		return url.startsWith(apiBase) ? trackPageRequest(loader, response) : response
	}
})
