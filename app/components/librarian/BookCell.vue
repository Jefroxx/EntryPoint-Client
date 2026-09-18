<template>
	<div class="flex items-center gap-3">
		<div class="h-9 w-[26px] shrink-0 rounded-[4px] bg-gradient-to-br from-accent-100 to-stone-200 shadow-sm" />
		<div class="min-w-0">
			<p class="truncate text-[13.5px] font-medium text-stone-800">{{ title }}</p>
			<p v-if="sub" class="font-data truncate text-[11px] text-stone-400">{{ sub }}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	title: string
	sub?: string
}>()
</script>
