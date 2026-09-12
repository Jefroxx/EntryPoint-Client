export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	css: ['~/assets/css/tailwind.css'],
	modules: ['@nuxt/ui', '@nuxt/icon', '@nuxt/fonts'],
	runtimeConfig: {
		public: {
			apiBaseURL: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api',
		},
	},
})