<template>
	<!-- The loader: the compass mark turning a quarter at a time on parchment. Full screen on pages without
		 a frame (sign-in, register, the station); `contained` inside the student and librarian layouts, where
		 it covers only the page area and leaves the sidebar and header usable. The full-screen look matches
		 spa-loading-template.html, so the first paint hands over without a jump. -->
	<!-- pointer-events-none while leaving: a fading loader never swallows the first click on the page. -->
	<Transition leave-active-class="pointer-events-none transition-opacity duration-300 ease-out" leave-to-class="opacity-0"
		enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0">
		<div v-if="show" class="app-loader bg-parchment" :class="contained ? 'absolute inset-0 z-20' : 'fixed inset-0 z-[1000] flex items-center justify-center'"
			role="status" aria-live="polite">
			<!-- Contained: however long the page, the mark stays centred in the part you can see (below the 68px header). -->
			<div :class="contained ? 'sticky top-0 flex h-dvh items-center justify-center md:top-[68px] md:h-[calc(100dvh-68px)]' : 'contents'">
				<img ref="mark" src="/favicon.png" alt="" class="app-loader-mark h-30 w-30" />
			</div>
			<span class="sr-only">Loading…</span>
		</div>
	</Transition>
</template>

<script setup lang="ts">
defineProps<{ show: boolean, contained?: boolean }>()

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
