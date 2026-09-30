<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<!-- Full screen only where there's no frame; the student and librarian layouts show their own,
		 over the page area alone. -->
	<AppLoader :show="loader.active && !framed" />
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

// Loading screen: up on first paint and on every page change (student and librarian), down once the
// page and its first data have arrived. Rules live in composables/usePageLoader.ts.
const loader = setupPageLoader()
const route = useRoute()
const framed = computed(() => route.meta.layout === 'student' || route.meta.layout === 'librarian')
</script>
