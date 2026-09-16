<template>
	<div v-if="loading"
		class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60">
		<span class="h-6 w-6 animate-spin rounded-full border-2 border-amber-100 border-t-amber-600" />
	</div>
</template>

<script setup lang="ts">
defineProps<{
	loading: boolean
}>()
</script>
