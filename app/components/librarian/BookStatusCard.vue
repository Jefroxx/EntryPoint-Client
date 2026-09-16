<template>
	<div class="flex h-full flex-col rounded-xl bg-white p-5 shadow-sm">
		<p class="mb-4 font-bold text-amber-900">Book Status</p>

		<div class="flex flex-1 items-center gap-6">
			<svg viewBox="0 0 200 200" class="h-40 w-40 shrink-0">
				<circle v-for="segment in segments" :key="segment.label" cx="100" cy="100" r="80" fill="none"
					:stroke="segment.color" stroke-width="32"
					:stroke-dasharray="`${segment.length} ${CIRCUMFERENCE - segment.length}`"
					:stroke-dashoffset="segment.offset" transform="rotate(-90 100 100)" />
				<text x="100" y="96" text-anchor="middle" font-size="30" font-weight="700" fill="#3f2a17">
					{{ total }}
				</text>
				<text x="100" y="118" text-anchor="middle" font-size="12" fill="#b0a290">Total Books</text>
			</svg>

			<ul class="flex-1 space-y-2 text-sm">
				<li v-for="segment in segments" :key="segment.label" class="flex items-center justify-between gap-4">
					<span class="flex items-center gap-2 text-gray-600">
						<span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: segment.color }" />
						{{ segment.label }}
					</span>
					<span class="font-semibold text-amber-900">{{ segment.value }}</span>
				</li>
			</ul>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	available: number
	borrowed: number
	maintenance: number
	inactive: number
}>()

const CIRCUMFERENCE = 2 * Math.PI * 80

const total = computed(() => props.available + props.borrowed + props.maintenance + props.inactive)

const segments = computed(() => {
	const items = [
		{ label: 'Available', value: props.available, color: '#5c3317' },
		{ label: 'Borrowed', value: props.borrowed, color: '#c9702c' },
		{ label: 'Maintenance', value: props.maintenance, color: '#e0a878' },
		{ label: 'Inactive', value: props.inactive, color: '#b0a290' },
	]

	let cumulative = 0
	return items.map((item) => {
		const length = total.value > 0 ? (item.value / total.value) * CIRCUMFERENCE : 0
		const offset = -cumulative
		cumulative += length
		return { ...item, length, offset }
	})
})
</script>
