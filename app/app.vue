<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<!-- The compass transition: a short full-screen moment when the app opens or you move to another part of it. -->
	<AppLoader :show="loader.splash" />
	<!-- Page loading, always: the thin bar along the top (components/NavProgress.vue), once the transition has gone. -->
	<NavProgress :show="loader.active && !loader.splash" />
	<!-- Every error message in the app shows here, as a dialog, on every page. -->
	<ErrorDialog />
</template>

<script setup lang="ts">
// Pages set only their own name (`useHead({ title: 'Dashboard' })`); the suffix
// is added here so it stays consistent, and a page without a title still gets
// "EntryPoint" rather than "EntryPoint · EntryPoint".
useHead({
	titleTemplate: (title) => (title ? `${title} · EntryPoint` : 'EntryPoint'),
	link: [
		// The square maroon mark; the wide wordmark is unreadable at tab size.
		{ rel: 'icon', type: 'image/png', href: '/favicon.png' },
		{ rel: 'apple-touch-icon', href: '/favicon.png' },
		// The loader shows this mark on first paint, so fetch it early.
		{ rel: 'preload', as: 'image', href: '/favicon.png' },
	],
})

// Grid or one card per row (the person's choice, in the account menu): one class on <html> lays out every card list.
const { layout: cardLayout } = useCardLayout()
useHead({ htmlAttrs: { class: computed(() => (cardLayout.value === 'rows' ? 'cards-rows' : '')) } })

// Loading screen: the full compass on first paint and when moving to another part of the app (signing in, student ↔
// librarian), and a thin bar on top for a page change inside the same part. Either comes down once the
// page and its first data have arrived. Rules live in composables/usePageLoader.ts.
const loader = setupPageLoader()
</script>
