<template>
	<!-- One line always: a long label is cut with an ellipsis (the full text is the tooltip) instead of wrapping and
		 pushing the buttons below it down, which made one card taller than its neighbours. -->
	<span class="flex max-w-full items-center gap-[5px] text-[12px] font-medium" :class="available > 0 ? 'text-emerald-700' : 'text-amber-700'" :title="label">
		<i class="h-[7px] w-[7px] shrink-0 rounded-full" :class="available > 0 ? 'bg-emerald-600' : 'bg-amber-600'" />
		<span class="min-w-0" :class="wrap ? '' : 'truncate'">{{ label }}</span>
	</span>
</template>

<script setup lang="ts">
// `wrap`: for a list row, where a second line costs nothing; a card keeps one line so its buttons line up with its neighbours.
const props = withDefaults(defineProps<{ available: number; total: number; queue?: number; wrap?: boolean }>(), { queue: 0, wrap: false })

const label = computed(() => availabilityLabel(props.available, props.total, props.queue))
</script>
