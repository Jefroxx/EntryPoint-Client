<template>
	<div class="rounded-2xl border border-stone-200 bg-white p-3.5" role="status" aria-live="polite" :aria-busy="busy">
		<div class="flex items-center justify-between gap-3">
			<p class="min-w-0 truncate text-[13.5px] font-semibold text-stone-900">{{ title }}</p>
			<span class="shrink-0 text-[12.5px] font-medium tabular-nums text-stone-500">{{ finished }} of {{ steps.length }}</span>
		</div>

		<!-- The bar fills as steps finish; a step in progress counts for a part of one, so it is never frozen at 0. -->
		<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
			<div class="h-full rounded-full transition-[width,background-color] duration-300 ease-out"
				:class="busy ? 'bg-accent-500' : hasProblem ? 'bg-amber-500' : 'bg-emerald-500'" :style="{ width: `${percent}%` }" />
		</div>

		<ul class="mt-2.5 space-y-1.5">
			<li v-for="step in steps" :key="step.key" class="flex items-start gap-2.5 text-[13px] leading-snug">
				<span class="mt-px flex h-4 w-4 shrink-0 items-center justify-center">
					<span v-if="step.state === 'running'" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-accent-500" />
					<Icon v-else-if="step.state === 'found' || step.state === 'done'" name="i-tabler-circle-check-filled" class="h-4 w-4 text-emerald-600" />
					<Icon v-else-if="step.state === 'unreachable'" name="i-tabler-alert-triangle-filled" class="h-4 w-4 text-amber-500" />
					<Icon v-else-if="step.state === 'none' || step.state === 'off'" name="i-tabler-circle-minus" class="h-4 w-4 text-stone-400" />
					<span v-else class="h-2 w-2 rounded-full bg-stone-300" />
				</span>
				<span class="min-w-0 flex-1">
					<span :class="step.state === 'waiting' ? 'text-stone-400' : 'font-medium text-stone-800'">{{ step.label }}</span>
					<span class="block text-[12.5px]" :class="step.state === 'unreachable' ? 'text-amber-700' : 'text-stone-500'">{{ detailOf(step) }}</span>
				</span>
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
/**
 * What a book lookup is doing right now, one row per step: asking each catalogue, putting the details together, finding
 * the Dewey number. The parent drives the states from what really happened (each catalogue's own answer), so a row only
 * says "Found" or "Didn't answer" when that is true. A running row shows how many seconds it has been going.
 */
export type ProgressState = 'waiting' | 'running' | 'found' | 'done' | 'none' | 'unreachable' | 'off'

export interface ProgressStep {
	key: string
	label: string
	state: ProgressState
	/** What to say once the step has finished (what it found, or why it didn't). */
	detail?: string
	/** What to say while it is running, before the seconds. */
	running?: string
	/** When it started running (Date.now()); drives the seconds counter. */
	startedAt?: number
}

const props = defineProps<{ title: string; steps: ProgressStep[] }>()

const FINISHED: ProgressState[] = ['found', 'done', 'none', 'unreachable', 'off']

const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | undefined

const busy = computed(() => props.steps.some((s) => s.state === 'running' || s.state === 'waiting'))
const finished = computed(() => props.steps.filter((s) => FINISHED.includes(s.state)).length)
const hasProblem = computed(() => props.steps.some((s) => s.state === 'unreachable'))
const percent = computed(() => {
	const total = props.steps.length || 1
	if (!busy.value) return 100
	const running = props.steps.filter((s) => s.state === 'running').length
	// A running step is worth under half a step, so the bar keeps moving but never claims to be done early.
	return Math.min(96, Math.round(((finished.value + running * 0.45) / total) * 100))
})

function detailOf(step: ProgressStep): string {
	if (step.state === 'running') {
		const seconds = step.startedAt ? Math.max(0, Math.floor((now.value - step.startedAt) / 1000)) : 0
		return `${step.running ?? 'Working…'}${seconds >= 1 ? ` ${seconds}s` : ''}`
	}
	return step.state === 'waiting' ? '' : (step.detail ?? '')
}

// The clock only ticks while something is running, and only in the browser.
watch(busy, (isBusy) => {
	if (!import.meta.client) return
	clearInterval(ticker)
	if (isBusy) ticker = setInterval(() => { now.value = Date.now() }, 500)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(ticker))
</script>
