<template>
	<Transition enter-active-class="transition-opacity duration-150 ease-out" enter-from-class="opacity-0"
		leave-active-class="transition-opacity duration-200 ease-out" leave-to-class="opacity-0">
		<div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60" role="status" aria-live="polite">
			<!-- One request has no steps to count, so the bar climbs the way a download does: quickly at first, then slower,
				 and never to the end until the data is really here (the overlay then fades out). -->
			<div class="w-[140px]" role="progressbar" aria-label="Loading" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(shown)">
				<div class="h-1.5 overflow-hidden rounded-full bg-amber-100">
					<div class="h-full rounded-full bg-amber-600 transition-[width] duration-200 ease-out" :style="{ width: `${shown}%` }" />
				</div>
				<p class="mt-1.5 text-center text-[12px] font-medium tabular-nums text-stone-500">{{ Math.round(shown) }}%</p>
			</div>
			<span class="sr-only">Loading…</span>
		</div>
	</Transition>
</template>

<script setup lang="ts">
const props = defineProps<{
	loading: boolean
}>()

const shown = ref(6)
let timer: ReturnType<typeof setInterval> | undefined
let startedAt = 0

watch(() => props.loading, (isLoading) => {
	if (!import.meta.client) return
	clearInterval(timer)
	if (!isLoading) return
	shown.value = 6
	startedAt = performance.now()
	// 1 - e^(-t/1.2s), scaled to 92: it covers half the way in the first second and then slows to a crawl.
	timer = setInterval(() => {
		const seconds = (performance.now() - startedAt) / 1000
		shown.value = 6 + 86 * (1 - Math.exp(-seconds / 1.2))
	}, 120)
}, { immediate: true })

onBeforeUnmount(() => clearInterval(timer))
</script>
