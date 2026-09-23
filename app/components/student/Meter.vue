<template>
	<div class="h-1.5 overflow-hidden rounded-full" :class="light ? 'bg-white/25' : 'bg-stone-100'" role="progressbar"
		:aria-valuenow="Math.round(clamped * 100)" aria-valuemin="0" aria-valuemax="100">
		<i class="block h-full origin-left rounded-full transition-transform duration-500 ease-out"
			:class="light ? 'bg-white' : 'bg-accent-500'" :style="{ transform: `scaleX(${clamped})` }" />
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{ value: number; light?: boolean }>()

const clamped = computed(() => Math.min(Math.max(props.value, 0), 1))
</script>
