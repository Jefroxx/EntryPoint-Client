<template>
	<!-- The loader: the compass mark turning a quarter at a time on parchment, with a bar under it showing how close the
		 page is to ready. Full screen on pages without a frame (sign-in, register, the station); `contained` inside the
		 student and librarian layouts, where it covers only the page area and leaves the sidebar and header usable. The
		 full-screen look matches spa-loading-template.html, so the first paint hands over without a jump. -->
	<!-- pointer-events-none while leaving: a fading loader never swallows the first click on the page. -->
	<Transition leave-active-class="pointer-events-none transition-opacity duration-300 ease-out" leave-to-class="opacity-0"
		enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0">
		<div v-if="show" class="app-loader bg-parchment" :class="contained ? 'absolute inset-0 z-20' : 'fixed inset-0 z-[1000] flex items-center justify-center'"
			role="status" aria-live="polite">
			<!-- Contained: however long the page, the mark stays centred in the part you can see (below the 68px header). -->
			<div :class="contained ? 'sticky top-0 flex h-dvh items-center justify-center md:top-[68px] md:h-[calc(100dvh-68px)]' : 'contents'">
				<div class="flex flex-col items-center gap-5">
					<img ref="mark" src="/favicon.png" alt="" class="app-loader-mark h-30 w-30" />

					<!-- How far along the page is: its own setup, then each request it made answering. -->
					<div class="w-[220px]" role="progressbar" aria-label="Loading" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(shown)">
						<div class="h-1.5 overflow-hidden rounded-full bg-stone-300/60">
							<div class="h-full rounded-full bg-accent-500 transition-[width] duration-300 ease-out" :style="{ width: `${shown}%` }" />
						</div>
						<p class="mt-2 text-center text-[12.5px] font-medium tabular-nums text-stone-500">{{ Math.round(shown) }}%</p>
					</div>
				</div>
			</div>
			<span class="sr-only">Loading…</span>
		</div>
	</Transition>
</template>

<script setup lang="ts">
const props = defineProps<{ show: boolean, contained?: boolean }>()

// The mark starts turning as soon as the HTML is parsed (server-rendered pages and the SPA template
// both start at page load). Offsetting by the time already spent keeps the turn where it was instead
// of snapping back when Vue takes over the element.
const mark = ref<HTMLImageElement | null>(null)
watch(mark, (el) => {
	if (el) el.style.animationDelay = `-${Math.round(performance.now() % 1200)}ms`
})

/* ---------- the bar ---------- */
const loader = usePageLoader()

// Where the bar is heading: the page's own setup is the first part, then each request answering fills the rest. It
// stops short of 100 until the loader really comes down, so it never claims "done" while something is still pending.
const target = computed(() => {
	const l = loader.value
	const answered = l.total ? l.done / l.total : 0
	if (l.routing) return 8 + 27 * answered           // the page itself is still being set up
	return l.total ? 35 + 60 * answered : 90          // set up: now only its requests remain
})

const shown = ref(4)
let tick: ReturnType<typeof setInterval> | undefined

function step() {
	// Ease toward the target, and keep creeping a little so a slow request never looks frozen.
	const goal = Math.min(target.value, 97)
	shown.value = shown.value < goal ? shown.value + (goal - shown.value) * 0.25 : Math.min(97, shown.value + 0.12)
}

watch(() => props.show, (visible) => {
	if (!import.meta.client) return
	clearInterval(tick)
	if (visible) {
		shown.value = 4
		tick = setInterval(step, 120)
	} else {
		shown.value = 100 // it is ready: full as it fades out
	}
}, { immediate: true })

onBeforeUnmount(() => clearInterval(tick))
</script>

<style>
/* A slow quarter turn (0.7 s), then a rest (0.5 s). The mark has four-fold symmetry, so 90° looks
   exactly like 0° and the loop restarts without a visible jump. */
.app-loader-mark {
	animation: appLoaderQuarter 1.2s infinite;
}

@keyframes appLoaderQuarter {
	0% {
		transform: rotate(0deg);
		animation-timing-function: cubic-bezier(.65, 0, .35, 1);
	}

	58% {
		transform: rotate(90deg);
	}

	100% {
		transform: rotate(90deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.app-loader-mark {
		animation: appLoaderPulse 1.4s ease-in-out infinite;
	}

	@keyframes appLoaderPulse {
		50% {
			opacity: .45;
		}
	}
}
</style>
