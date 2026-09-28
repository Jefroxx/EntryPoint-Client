<template>
	<div class="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
		<div class="mb-4 flex flex-wrap items-start justify-between gap-3">
			<div>
				<p class="font-bold text-amber-900">{{ title }}</p>
				<p class="text-[13px] text-stone-500">{{ subtitle }}</p>
			</div>
			<slot name="actions" />
		</div>

		<div v-if="total === 0" class="flex flex-1 flex-col items-center justify-center py-8 text-center">
			<span class="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-400">
				<Icon name="i-tabler-chart-donut" class="h-5 w-5" />
			</span>
			<p class="text-[14px] text-stone-500">{{ emptyText }}</p>
		</div>

		<div v-else class="flex flex-1 flex-wrap items-center gap-x-6 gap-y-4" @mouseleave="active = null">
			<svg viewBox="0 0 180 180" class="mx-auto h-[168px] w-[168px] shrink-0" role="img"
				:aria-label="`${title}: ${slices.map((s) => `${s.label} ${s.count}`).join(', ')}`">
				<circle cx="90" cy="90" :r="R" fill="none" stroke="#f5f1ea" :stroke-width="STROKE" />
				<circle v-for="(arc, i) in arcs" :key="arc.label" cx="90" cy="90" :r="R" fill="none"
					:stroke="arc.color" :stroke-width="active === i ? STROKE + 6 : STROKE"
					:stroke-dasharray="`${arc.length} ${CIRC - arc.length}`" :stroke-dashoffset="-arc.offset"
					transform="rotate(-90 90 90)" class="cursor-pointer transition-[stroke-width,opacity] duration-150 ease-out"
					:opacity="active === null || active === i ? 1 : 0.3" @mouseenter="active = i" />
				<text x="90" y="88" text-anchor="middle" font-size="28" font-weight="700" fill="#1c1917" class="tabular-nums">
					{{ active === null ? total : slices[active]!.count }}</text>
				<text x="90" y="108" text-anchor="middle" font-size="11.5" fill="#78716c">
					{{ active === null ? unit : `${percent(slices[active]!.count)} · ${slices[active]!.label}` }}</text>
			</svg>

			<!-- Legend with values and shares: every slice is named and numbered, not just colored. -->
			<ul class="min-w-[180px] flex-1 space-y-0.5">
				<li v-for="(slice, i) in slices" :key="slice.label">
					<button type="button"
						class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-[background-color,opacity] duration-150"
						:class="[active === i ? 'bg-stone-50' : '', active !== null && active !== i ? 'opacity-50' : '']"
						@mouseenter="active = i" @focus="active = i" @blur="active = null">
						<span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: slice.color }" />
						<span class="min-w-0 flex-1 truncate text-[13.5px] text-stone-700">{{ slice.label }}</span>
						<b class="text-[13.5px] font-semibold tabular-nums text-stone-900">{{ slice.count }}</b>
						<span class="w-10 text-right text-[12.5px] tabular-nums text-stone-400">{{ percent(slice.count) }}</span>
					</button>
				</li>
			</ul>
		</div>

		<table class="sr-only">
			<caption>{{ title }}</caption>
			<thead><tr><th>Program</th><th>Students</th><th>Share</th></tr></thead>
			<tbody>
				<tr v-for="slice in slices" :key="slice.label"><td>{{ slice.label }}</td><td>{{ slice.count }}</td><td>{{ percent(slice.count) }}</td></tr>
			</tbody>
		</table>
	</div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	title: string
	subtitle?: string
	slices: { label: string; count: number; color: string }[]
	total: number
	unit?: string
	emptyText?: string
}>(), { subtitle: '', unit: 'students', emptyText: 'No students to show yet.' })

const R = 66
const STROKE = 24
const CIRC = 2 * Math.PI * R
// A 2px surface gap between slices keeps neighbours apart without relying on color alone.
const GAP = 2

const active = ref<number | null>(null)
watch(() => props.slices, () => { active.value = null })

const arcs = computed(() => {
	let offset = 0
	const single = props.slices.length === 1
	return props.slices.map((slice) => {
		const full = (slice.count / Math.max(props.total, 1)) * CIRC
		const arc = { label: slice.label, color: slice.color, offset, length: single ? full : Math.max(full - GAP, 0.5) }
		offset += full
		return arc
	})
})

const percent = (count: number) => `${Math.round((count / Math.max(props.total, 1)) * 100)}%`
</script>
