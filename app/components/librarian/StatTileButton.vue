<template>
	<!-- A count that is also the filter for the list under it: tap it to show only those, tap it again to go back. -->
	<button type="button" :aria-pressed="active"
		class="rounded-2xl text-left outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-accent-200 sm:rounded-[18px]">
		<LibrarianCatalogStatTile :label="label" :value="value" :icon="icon" :tone="tone" :active="active" interactive />
	</button>
</template>

<script setup lang="ts">
defineProps<{
	label: string
	value: string | number
	icon: string
	tone: 'accent' | 'success' | 'warning' | 'danger'
	/** This count's filter is the one applied now. */
	active?: boolean
}>()
</script>
