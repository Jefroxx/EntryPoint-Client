<template>
	<Transition enter-active-class="transition-opacity duration-150 ease-out" enter-from-class="opacity-0"
		leave-active-class="transition-opacity duration-200 ease-out" leave-to-class="opacity-0">
		<div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60">
			<span class="h-6 w-6 animate-spin rounded-full border-2 border-amber-100 border-t-amber-600" />
		</div>
	</Transition>
</template>

<script setup lang="ts">
defineProps<{
	loading: boolean
}>()
</script>
