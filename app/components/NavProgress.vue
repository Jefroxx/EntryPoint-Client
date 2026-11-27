<template>
	<!-- The small-step loader: a thin maroon line along the top edge while a page in the same part of the app loads
		 (Home → Discover, Library → Circulation). The page itself shows at once and its cards fill in under it; the
		 full compass screen (AppLoader) is kept for first load and for moving between the student, librarian and admin
		 sides. It reads the same progress as AppLoader: the page's own setup, then each of its requests answering. -->
	<div class="nav-progress pointer-events-none fixed inset-x-0 top-0 z-[1001] h-[3px]" :class="visible ? 'opacity-100' : 'opacity-0'"
		role="progressbar" aria-label="Loading page" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(shown)"
		:aria-hidden="!visible">
		<div class="nav-progress-fill h-full bg-accent-500" :style="{ width: `${shown}%` }" />
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{ show: boolean }>()
const loader = usePageLoader()

// Kept on screen for a moment after the page is ready, so the line visibly reaches the end before it fades.
const visible = ref(false)
const shown = ref(0)
let tick: ReturnType<typeof setInterval> | undefined
let fade: ReturnType<typeof setTimeout> | undefined

const target = computed(() => {
	const l = loader.value
	const answered = l.total ? l.done / l.total : 0
	if (l.routing) return 15 + 25 * answered
	return l.total ? 40 + 55 * answered : 90
})

function step() {
	// Ease toward the target and keep creeping, so a slow request never looks frozen.
	const goal = Math.min(target.value, 96)
	shown.value = shown.value < goal ? shown.value + (goal - shown.value) * 0.3 : Math.min(96, shown.value + 0.15)
}

watch(() => props.show, (on) => {
	if (!import.meta.client) return
	clearInterval(tick)
	clearTimeout(fade)
	if (on) {
		shown.value = 8
		visible.value = true
		tick = setInterval(step, 100)
	} else if (visible.value) {
		shown.value = 100
		fade = setTimeout(() => { visible.value = false; shown.value = 0 }, 250)
	}
})

// A second click while the bar is running starts it over for the new page.
watch(() => loader.value.run, () => { if (props.show) shown.value = 8 })

onBeforeUnmount(() => { clearInterval(tick); clearTimeout(fade) })
</script>

<style>
.nav-progress {
	transition: opacity 250ms ease-out;
}

.nav-progress-fill {
	transition: width 200ms var(--ease-out);
	/* A soft glow at the leading edge, so a 3px line still reads on the parchment header. */
	box-shadow: 0 0 10px rgb(83 44 46 / .45), 0 0 4px rgb(83 44 46 / .35);
	border-radius: 0 999px 999px 0;
}

@media (prefers-reduced-motion: reduce) {
	.nav-progress-fill {
		transition: none;
	}
}
</style>
