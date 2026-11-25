<template>
	<div v-if="items.length" class="space-y-2.5">
		<div v-for="(item, index) in items" :key="item.label" class="flex items-center gap-2.5 text-[14px]">
			<span v-if="ranked"
				class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-100 text-[12px] font-bold text-accent-700">
				{{ index + 1 }}
			</span>
			<!-- A long title wraps onto a second line instead of being cut off. -->
			<span class="line-clamp-2 min-w-0 flex-1 break-words font-medium leading-snug text-stone-800" :title="item.label">{{ item.label }}</span>
			<span class="h-1.5 w-16 shrink-0 sm:w-28 overflow-hidden rounded-full bg-stone-100">
				<span class="block h-full rounded-full bg-accent-500 transition-[width] duration-500 ease-out"
					:style="{ width: `${max ? (item.value / max) * 100 : 0}%` }" />
			</span>
			<span class="w-7 shrink-0 text-right font-bold tabular-nums text-stone-900">{{ item.value }}</span>
		</div>
	</div>
	<p v-else class="py-6 text-center text-[15px] text-stone-500">{{ empty }}</p>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	items: { label: string; value: number }[]
	ranked?: boolean
	empty?: string
}>(), {
	ranked: false,
	empty: 'Nothing to show yet.',
})

const max = computed(() => Math.max(0, ...props.items.map((i) => i.value)))
</script>
