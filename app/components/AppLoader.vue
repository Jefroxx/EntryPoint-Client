<template>
	<!-- The compass transition: the mark turning on parchment, over the whole screen, for a short set time when the app
		 opens or you move to another part of it (signing in, student ↔ librarian). It is a transition, not a loading
		 indicator: it never waits on data. Page loading after it is the thin bar along the top (NavProgress.vue). The look
		 matches spa-loading-template.html, so the first paint hands over without a jump. -->
	<!-- pointer-events-none while leaving: a fading screen never swallows the first click on the page. -->
	<Transition leave-active-class="pointer-events-none transition-opacity duration-300 ease-out" leave-to-class="opacity-0"
		enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0">
		<div v-if="show" class="app-loader fixed inset-0 z-[1000] flex items-center justify-center bg-parchment"
			role="status" aria-live="polite">
			<img ref="mark" src="/favicon.png" alt="" class="app-loader-mark h-30 w-30" />
			<span class="sr-only">Loading…</span>
		</div>
	</Transition>
</template>

<script setup lang="ts">
defineProps<{ show: boolean }>()

// The mark starts turning as soon as the HTML is parsed (server-rendered pages and the SPA template
// both start at page load). Offsetting by the time already spent keeps the turn where it was instead
// of snapping back when Vue takes over the element.
const mark = ref<HTMLImageElement | null>(null)
watch(mark, (el) => {
	if (el) el.style.animationDelay = `-${Math.round(performance.now() % 1200)}ms`
})
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
