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
})
</script>