<template>
	<div ref="root" class="landing bg-parchment text-stone-800">
		<LandingNav />
		<main>
			<LandingHero />
			<LandingReplaces />
			<LandingSteps />
			<LandingFeatures />
			<LandingDoors />
			<LandingVisit />
		</main>
		<LandingFooter />
	</div>
</template>

<script setup lang="ts">
// The public landing page. Signed-in visitors never see it: the `landing` middleware sends them home.
definePageMeta({
	layout: 'landing',
	middleware: 'landing',
	// A quick fade to and from the sign-in pages (classes in assets/css/tailwind.css).
	layoutTransition: { name: 'soft-fade', mode: 'out-in' },
})

useHead({
	title: 'Your library, one scan away',
	meta: [
		{
			name: 'description',
			content: 'EntryPoint is the STI College Davao library system: find a book, borrow it, and scan in with your Library ID.',
		},
	],
})

// The pages this one leads to; their code is fetched while the browser is idle (see onMounted).
const SIGN_IN_PATHS = ['/login', '/register', '/librarian/login']

// The signature motion: every compass on the page turns with the scroll. One listener, one frame at a time,
// and the turn is written straight onto each compass (a custom property on the root would make the browser
// recalculate the style of every element under it on every scroll frame).
const root = ref<HTMLElement | null>(null)

onMounted(() => {
	// Fetch the sign-in pages' code while the browser is idle, so the trip there never waits on a download.
	const warm = () => SIGN_IN_PATHS.forEach((path) => void preloadRouteComponents(path))
	if ('requestIdleCallback' in window) window.requestIdleCallback(warm)
	else setTimeout(warm, 1500)

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

	const compasses = Array.from(root.value?.querySelectorAll<HTMLElement>('.landing-compass') ?? [])
	let frame = 0
	const update = () => {
		frame = 0
		const turn = `rotate(${Math.round(window.scrollY * 0.06 * 10) / 10}deg)`
		for (const compass of compasses) compass.style.transform = turn
	}
	const onScroll = () => {
		if (!frame) frame = requestAnimationFrame(update)
	}

	update()
	window.addEventListener('scroll', onScroll, { passive: true })
	onBeforeUnmount(() => {
		window.removeEventListener('scroll', onScroll)
		if (frame) cancelAnimationFrame(frame)
	})
})
</script>

<style>
/* Landing-only styles. Names are prefixed so nothing here can reach another page. */
html:has(.landing) {
	scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
	html:has(.landing) {
		scroll-behavior: auto;
	}
}

/* The maroon field: the same warm light and fall-off the sign-in panel uses. */
.landing-maroon {
	background-color: var(--color-accent-500);
	background-image:
		radial-gradient(90% 60% at 0% 0%, rgb(255 255 255 / .10), transparent 60%),
		linear-gradient(160deg, var(--color-accent-500) 0%, var(--color-crimson) 100%);
}

/* A compass that turns with the page (the rotation is written by the script above). Tinted per use by the element's own opacity. */
.landing-compass {
	will-change: transform;
}

.landing [id] {
	scroll-margin-top: 96px;
}

/* Browser surfaces take the palette. */
.landing ::selection {
	background: var(--color-accent-200);
	color: var(--color-accent-700);
}

/* Keyboard focus: a deep ring on the light bands (3:1 or better on parchment and white), a pale one on the maroon. */
.landing a:focus-visible,
.landing button:focus-visible {
	outline: 2px solid var(--color-accent-500);
	outline-offset: 3px;
}

.landing .landing-maroon a:focus-visible,
.landing .landing-glass a:focus-visible,
.landing .landing-footer a:focus-visible {
	outline-color: var(--color-accent-100);
}
</style>
