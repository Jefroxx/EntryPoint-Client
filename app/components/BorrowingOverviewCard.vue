<template>
	<div class="rounded-xl bg-white p-5 shadow-sm">
		<p class="mb-3 font-bold text-amber-900">Borrowing &amp; Return Overview</p>

		<div class="mb-3 flex gap-4 text-xs text-gray-500">
			<span class="flex items-center gap-1">
				<span class="h-2 w-2 rounded-full bg-[#5c3317]" /> Borrowed
			</span>
			<span class="flex items-center gap-1">
				<span class="h-2 w-2 rounded-full bg-[#e0a878]" /> Returned
			</span>
		</div>

		<svg viewBox="0 0 480 200" class="w-full">
			<g stroke="#f0e9dd" stroke-width="1">
				<line v-for="y in GRID_LINES" :key="y" x1="30" :y1="y" x2="470" :y2="y" />
			</g>

			<polyline fill="none" stroke="#5c3317" stroke-width="2.5" :points="borrowedPoints" />
			<polyline fill="none" stroke="#e0a878" stroke-width="2.5" :points="returnedPoints" />

			<text v-for="(label, index) in labels" :key="label" :x="xForIndex(index)" y="190" font-size="9"
				fill="#b0a290" text-anchor="middle">{{ label }}</text>
		</svg>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	labels: string[]
	borrowed: number[]
	returned: number[]
}>()

// Chart geometry — the SVG viewBox above is fixed at 480x200.
const CHART_LEFT = 30
const CHART_RIGHT = 470
const CHART_TOP = 10
const CHART_BOTTOM = 170
const GRID_LINES = [10, 50, 90, 130, 170]

const maxValue = computed(() => Math.max(1, ...props.borrowed, ...props.returned))

function xForIndex(index: number): number {
	const pointCount = props.labels.length
	return pointCount <= 1
		? CHART_LEFT
		: CHART_LEFT + (index / (pointCount - 1)) * (CHART_RIGHT - CHART_LEFT)
}

function yForValue(value: number): number {
	return CHART_BOTTOM - (value / maxValue.value) * (CHART_BOTTOM - CHART_TOP)
}

function toPolylinePoints(series: number[]): string {
	return series.map((value, index) => `${xForIndex(index)},${yForValue(value)}`).join(' ')
}

const borrowedPoints = computed(() => toPolylinePoints(props.borrowed))
const returnedPoints = computed(() => toPolylinePoints(props.returned))
</script>
