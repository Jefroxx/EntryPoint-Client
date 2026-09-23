<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>

<script setup lang="ts">
// Pages set only their own name (`useHead({ title: 'Dashboard' })`); the suffix
// is added here so it stays consistent, and a page without a title still gets
// "EntryPoint" rather than "EntryPoint · EntryPoint".
useHead({
	titleTemplate: (title) => (title ? `${title} · EntryPoint` : 'EntryPoint'),
	link: [
		// The square brown mark; the wide wordmark is unreadable at tab size.
		{ rel: 'icon', type: 'image/png', href: '/favicon.png' },
		{ rel: 'apple-touch-icon', href: '/favicon.png' },
	],
})
</script>