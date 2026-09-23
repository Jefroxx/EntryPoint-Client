<template>
	<svg :viewBox="`0 0 ${WIDTH} ${height}`" class="block w-full" role="img" :aria-label="ariaLabel">
		<g v-for="tick in ticks" :key="tick.value">
			<line :x1="LEFT" :x2="WIDTH - RIGHT" :y1="tick.y" :y2="tick.y" stroke="#eee9dd" />
			<text :x="LEFT - 6" :y="tick.y + 3.5" text-anchor="end" font-size="10" fill="#a39a89">{{ tick.value }}</text>
		</g>

		<g v-for="(label, i) in labels" :key="label">
			<rect v-for="(s, k) in series" :key="s.name" :x="barX(i, k)" :y="barY(s.values[i] ?? 0)" :width="barWidth - 3"
				:height="barHeight(s.values[i] ?? 0)" rx="4" :fill="s.color">
				<title>{{ s.name }} · {{ label }}: {{ s.values[i] ?? 0 }}</title>
			</rect>
			<text :x="LEFT + band * i + band / 2" :y="height - 7" text-anchor="middle" font-size="10.5" fill="#6b6156">
				{{ label }}
			</text>
		</g>
	</svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	labels: string[]
	series: { name: string; color: string; values: number[] }[]
	height?: number
	ariaLabel?: string
}>(), {
	height: 220,
	ariaLabel: 'Bar chart',
})

// One coordinate system for marks, gridlines and axis labels.
const WIDTH = 640
const LEFT = 34
const RIGHT = 8
const TOP = 10
const BOTTOM = 24
const TICKS = 4

const plotHeight = computed(() => props.height - TOP - BOTTOM)
const band = computed(() => (WIDTH - LEFT - RIGHT) / Math.max(1, props.labels.length))
const barWidth = computed(() => Math.min(24, band.value / (props.series.length + 1)))

/** Smallest "round" axis maximum that fits the data, in whole steps. */
const axisMax = computed(() => {
	const dataMax = Math.max(1, ...props.series.flatMap((s) => s.values))
	const rawStep = dataMax / TICKS
	const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
	const nice = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((n) => n >= rawStep / magnitude) ?? 10
	return Math.max(1, Math.ceil(nice * magnitude)) * TICKS
})

const yFor = (value: number) => TOP + plotHeight.value - (value / axisMax.value) * plotHeight.value

const ticks = computed(() =>
	Array.from({ length: TICKS + 1 }, (_, i) => {
		const value = (axisMax.value / TICKS) * i
		return { value, y: yFor(value) }
	}))

const barX = (bandIndex: number, seriesIndex: number) =>
	LEFT + band.value * bandIndex + band.value / 2 - (props.series.length * barWidth.value) / 2 + seriesIndex * barWidth.value
const barY = (value: number) => yFor(value)
const barHeight = (value: number) => (value / axisMax.value) * plotHeight.value
</script>
