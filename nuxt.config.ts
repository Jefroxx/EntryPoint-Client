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
		// "Spaces" was renamed "Facilities"; old links and bookmarks still land on it.
		'/student/spaces': { redirect: '/student/facilities' },
		// Tunnel hosting: the browser only sees one origin (the tunnel URL), so Nuxt forwards
		// the API and uploaded files to Laravel. Used when NUXT_PUBLIC_API_BASE_URL=/api.
		// redirect: 'manual' hands Laravel's redirects (the email link answers 302 -> /login?verified=...)
		// to the browser. By default the forwarder follows them itself and ends up on the API's own /login (404).
		'/api/**': {
			proxy: {
				to: `${process.env.LARAVEL_ORIGIN || 'http://127.0.0.1:8000'}/api/**`,
				fetchOptions: { redirect: 'manual' },
			},
		},
		'/storage/**': { proxy: `${process.env.LARAVEL_ORIGIN || 'http://127.0.0.1:8000'}/storage/**` },
	},
	// The dev server rejects unknown Host headers, and a quick tunnel's hostname is random.
	vite: { server: { allowedHosts: ['.trycloudflare.com'] } },
	css: ['~/assets/css/tailwind.css'],
	modules: ['@nuxt/ui', '@nuxt/icon', '@nuxt/fonts'],
	// Icons are looked up by name at runtime. Their default address (/api/_nuxt_icon) sits under /api, which the
	// rules above forward to Laravel, so any icon not already on the page came back blank. It lives outside /api now,
	// and every icon the code uses is also bundled into the page up front, so most never need a lookup at all.
	icon: {
		localApiEndpoint: '/_nuxt_icon',
		clientBundle: { scan: true },
	},
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
			// Only a hint on the forms; the server's STUDENT_EMAIL_DOMAIN is what's enforced. Keep the two in step.
			studentEmailDomain: process.env.NUXT_PUBLIC_STUDENT_EMAIL_DOMAIN ?? 'davao.sti.edu.ph',
		},
	},
})