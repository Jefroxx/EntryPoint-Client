<template>
	<div v-if="items.length" class="space-y-2.5">
		<div v-for="(item, index) in items" :key="item.label" class="flex items-center gap-2.5 text-[13px]">
			<span v-if="ranked"
				class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-100 text-[11px] font-bold text-accent-700">
				{{ index + 1 }}
			</span>
			<span class="min-w-0 flex-1 truncate font-medium text-stone-800" :title="item.label">{{ item.label }}</span>
			<span class="h-1.5 w-28 shrink-0 overflow-hidden rounded-full bg-stone-100">
				<span class="block h-full rounded-full bg-accent-500 transition-[width] duration-500 ease-out"
					:style="{ width: `${max ? (item.value / max) * 100 : 0}%` }" />
			</span>
			<span class="w-7 shrink-0 text-right font-bold tabular-nums text-stone-900">{{ item.value }}</span>
		</div>
	</div>
	<p v-else class="py-6 text-center text-sm text-stone-400">{{ empty }}</p>
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
