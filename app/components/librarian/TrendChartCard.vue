<template>
	<div class="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
		<div class="mb-1 flex flex-wrap items-start justify-between gap-3">
			<div>
				<p class="font-bold text-amber-900">{{ title }}</p>
				<p class="text-[13px] text-stone-500">{{ subtitle }}</p>
			</div>
			<slot name="actions" />
		</div>

		<!-- Legend doubles as the period's totals; identity never rests on color alone. -->
		<div class="mb-2 mt-3 flex flex-wrap gap-x-6 gap-y-1">
			<span v-for="s in lines" :key="s.key" class="inline-flex items-baseline gap-2">
				<svg v-if="s.dashed" viewBox="0 0 16 4" class="h-1 w-4 self-center" aria-hidden="true"><line x1="0" y1="2" x2="16" y2="2" :stroke="s.color" stroke-width="3" stroke-dasharray="5 3" /></svg>
				<span v-else class="h-2.5 w-2.5 translate-y-[-1px] self-center rounded-full" :style="{ backgroundColor: s.color }" />
				<span class="text-[13px] text-stone-500">{{ s.label }}</span>
				<span class="text-[18px] font-bold tabular-nums text-stone-900">{{ s.total }}</span>
				<span v-if="s.totalNote" class="text-[12px] text-stone-400">{{ s.totalNote }}</span>
			</span>
		</div>

		<div class="relative" @mouseleave="hover = null">
			<svg :viewBox="`0 0 ${W} ${H}`" class="block h-auto w-full overflow-visible" role="img" :aria-label="ariaLabel">
				<!-- Recessive grid + y values -->
				<g>
					<template v-for="tick in ticks" :key="tick">
						<line :x1="LEFT" :x2="RIGHT" :y1="yFor(tick)" :y2="yFor(tick)" stroke="#efe8dc" stroke-width="1" />
						<text :x="LEFT - 8" :y="yFor(tick) + 4" font-size="11.5" fill="#8a7d6c" text-anchor="end" class="tabular-nums">{{ tick }}</text>
					</template>
				</g>

				<line v-if="hover !== null" :x1="xFor(hover)" :x2="xFor(hover)" :y1="TOP" :y2="BOTTOM" stroke="#d6cbbb" stroke-width="1" stroke-dasharray="3 3" />

				<polyline v-for="s in lines" :key="`line-${s.key}`" fill="none" :stroke="s.color" stroke-width="2"
					stroke-linejoin="round" stroke-linecap="round" :stroke-dasharray="s.dashed ? '7 5' : undefined" :points="pointsFor(s.values)" />

				<!-- Markers with a surface ring so overlapping points stay separate -->
				<template v-for="s in lines" :key="`dots-${s.key}`">
					<circle v-for="(value, i) in s.values" :key="i" :cx="xFor(i)" :cy="yFor(value)"
						:r="hover === i ? 5 : 4" :fill="s.color" stroke="#fff" stroke-width="2" />
				</template>

				<text v-for="(label, i) in labels" :key="label" :x="xFor(i)" :y="H - 4" font-size="11.5"
					:fill="hover === i ? '#44403c' : '#8a7d6c'" text-anchor="middle">{{ label }}</text>

				<!-- Hit areas wider than the marks: one column per period -->
				<rect v-for="(label, i) in labels" :key="`hit-${label}`" :x="xFor(i) - columnWidth / 2" :y="TOP"
					:width="columnWidth" :height="BOTTOM - TOP" fill="transparent" @mouseenter="hover = i" />
			</svg>

			<div v-if="hover !== null"
				class="pointer-events-none absolute top-0 z-10 min-w-[170px] -translate-x-1/2 rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-card"
				:style="{ left: `${(xFor(hover) / W) * 100}%` }">
				<p class="mb-1 text-[12px] font-semibold text-stone-500">{{ periodLabel }} {{ labels[hover] }}</p>
				<p v-for="s in lines" :key="s.key" class="flex items-center justify-between gap-4 text-[13px] text-stone-600">
					<span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full" :style="{ backgroundColor: s.color }" />{{ s.label }}</span>
					<b class="tabular-nums text-stone-900">{{ s.values[hover] }}</b>
				</p>
			</div>
		</div>

		<table class="sr-only">
			<caption>{{ title }}</caption>
			<thead><tr><th>{{ periodLabel }}</th><th v-for="s in lines" :key="s.key">{{ s.label }}</th></tr></thead>
			<tbody>
				<tr v-for="(label, i) in labels" :key="label"><td>{{ label }}</td><td v-for="s in lines" :key="s.key">{{ s.values[i] }}</td></tr>
			</tbody>
		</table>
	</div>
</template>

<script setup lang="ts">
export interface TrendSeries {
	key: string
	label: string
	/** A pair validated with the dataviz palette checker; see the dashboard for the ones in use. */
	color: string
	values: number[]
	/** Overrides the summed total in the legend (e.g. different students isn't a sum of weeks). */
	total?: number | string
	totalNote?: string
	/** Dashed line: a second encoding for a series that can sit exactly on top of another. */
	dashed?: boolean
}

const props = withDefaults(defineProps<{
	title: string
	subtitle?: string
	labels: string[]
	series: TrendSeries[]
	/** What each x label is, for the tooltip and table ("Week of"). */
	periodLabel?: string
}>(), { subtitle: '', periodLabel: 'Week of' })

// Sized to roughly the card's real width, so 11px text renders at about 11px instead of scaling up.
const W = 800
const H = 230
const LEFT = 34
const RIGHT = 786
const TOP = 12
const BOTTOM = 202

const hover = ref<number | null>(null)

const lines = computed(() => props.series.map((s) => ({ ...s, total: s.total ?? s.values.reduce((a, b) => a + b, 0) })))
const ariaLabel = computed(() => `${props.title}: ${lines.value.map((s) => `${s.label} ${s.total}`).join(', ')}`)

/** A rounded axis top with 4 even steps, so ticks read 0, 5, 10… instead of odd fractions. */
const axisMax = computed(() => {
	const max = Math.max(4, ...props.series.flatMap((s) => s.values))
	const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500].find((s) => s * 4 >= max) ?? Math.ceil(max / 4)
	return step * 4
})
const ticks = computed(() => [0, 1, 2, 3, 4].map((i) => (axisMax.value / 4) * i))

// Periods sit in the middle of equal columns, so the first and last labels never touch the edges.
const columnWidth = computed(() => (RIGHT - LEFT) / Math.max(props.labels.length, 1))
const xFor = (i: number) => LEFT + columnWidth.value * (i + 0.5)
const yFor = (value: number) => BOTTOM - (value / axisMax.value) * (BOTTOM - TOP)
const pointsFor = (values: number[]) => values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ')
</script>
