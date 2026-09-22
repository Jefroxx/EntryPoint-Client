export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	app: {
		// viewport-fit=cover lets the student app paint under the notch / home indicator and
		// pad its own content with env(safe-area-inset-*).
		head: { viewport: 'width=device-width, initial-scale=1, viewport-fit=cover' },
		// Short and quiet: navigation is high-frequency, so the fade shouldn't make it feel slower.
		pageTransition: { name: 'page', mode: 'out-in' },
	},
	// The student app is a signed-in, client-driven app (live counters, drawers, media queries):
	// it renders in the browser only. Sign-in and register pages stay server-rendered.
	routeRules: {
		'/student/**': { ssr: false },
	},
	css: ['~/assets/css/tailwind.css'],
	modules: ['@nuxt/ui', '@nuxt/icon', '@nuxt/fonts'],
	// Raleway (words) and Montserrat (numbers) are self-hosted by @nuxt/fonts. The
	// weights are listed because the UI uses 500/600/800 as well as 400/700, and an
	// absent weight would otherwise be faked by the browser.
	fonts: {
		defaults: {
			weights: [300, 400, 500, 600, 700, 800],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
		},
	},
	runtimeConfig: {
		public: {
			apiBaseURL: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api',
		},
	},
})