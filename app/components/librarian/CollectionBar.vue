<template>
	<!-- Every physical copy in one stacked bar, by where it is now, with each state named and numbered.
		 Shared by the Dashboard's Collection section and the Reports page. -->
	<div>
		<div class="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-stone-100" role="img"
			:aria-label="items.map((c) => `${c.label} ${c.value}`).join(', ')">
			<span v-for="c in items.filter((c) => c.value > 0)" :key="c.label" class="h-full first:rounded-l-full last:rounded-r-full"
				:style="{ width: `${(c.value / Math.max(total, 1)) * 100}%`, backgroundColor: c.color }" :title="`${c.label}: ${c.value}`" />
		</div>

		<ul class="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
			<li v-for="c in items" :key="c.label">
				<span class="flex items-center gap-2 text-[13px] text-stone-500">
					<span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: c.color }" />{{ c.label }}
				</span>
				<span class="mt-1 block text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums text-stone-900">{{ c.value }}</span>
				<span class="mt-1 block text-[12px] tabular-nums text-stone-500">{{ total ? Math.round((c.value / total) * 100) : 0 }}% of copies</span>
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	items: { label: string; value: number; color: string }[]
	total: number
}>()
</script>
