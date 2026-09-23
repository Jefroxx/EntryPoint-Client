<template>
	<div class="px-6 py-12 text-center">
		<div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
			<slot name="icon"><Icon v-if="icon" :name="icon" class="h-6 w-6" /></slot>
		</div>
		<h3 class="text-[16px] font-semibold text-stone-900">{{ title }}</h3>
		<p class="mx-auto mt-1 max-w-[34ch] text-[13.5px] text-stone-500">{{ text }}</p>
		<div v-if="$slots.default" class="mt-4 flex justify-center">
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{ icon?: string; title: string; text: string }>()
</script>
