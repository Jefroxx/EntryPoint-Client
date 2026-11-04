<template>
	<!-- Overlays (modals, drawers, toasts, the error dialog) are drawn into <body>, and they are never open when a page
		 first loads, so there is nothing for the server to render. Left to the server, several teleports into the same
		 place can be hydrated by the browser in a different order than they were written (parts of the page load
		 asynchronously), which Vue reports as a "hydration mismatch". So they are drawn only once the page is mounted.

		 Until then this renders nothing but an HTML comment. That matters: some tables keep their drawer inside the
		 table body, where a real element (what <ClientOnly> leaves behind) is invalid and gets moved by the browser. -->
	<Teleport v-if="mounted" to="body">
		<slot />
	</Teleport>
</template>

<script setup lang="ts">
const mounted = ref(false)
onMounted(() => { mounted.value = true })
</script>
