<template>
	<main class="auth-page relative min-h-screen overflow-x-hidden">
		<!-- Small screens: the brand star, oversized and faint, half out of frame, behind a stacked card. -->
		<svg v-for="star in backdropStars" :key="star.class" class="pointer-events-none absolute text-accent-500 lg:hidden" :class="star.class"
			viewBox="0 0 100 100" aria-hidden="true">
			<path fill="currentColor" :d="STAR" />
		</svg>

		<!-- Wide screens: a full-height split. The form owns a white column on one edge; the illustrated
			 panel fills the rest and slides across when you move between sign-in and registration. -->
		<div class="auth-shell relative z-10 mx-auto flex min-h-screen w-full max-w-[560px] flex-col px-4 pb-6 pt-10 sm:pt-14 lg:max-w-none lg:bg-white lg:p-0"
			:data-panel="side">
			<!-- A card on phones; on wide screens it dissolves (display: contents) so each page's form lands in the grid. -->
			<div class="auth-card grid overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-overlay lg:contents">
				<slot />
			</div>

			<!-- The form column's footer, pinned to the bottom of the column. It shares the grid cell with the
				 form; each page opens with the shared <AuthLogo>, so logo and form centre together. -->
			<div class="auth-chrome pointer-events-none hidden flex-col justify-end px-12 pb-9 lg:flex">
				<p class="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center text-[12.5px] text-stone-400">
					<span class="font-semibold text-accent-700">EntryPoint</span><span aria-hidden="true">·</span>
					<span>STI College Davao Library</span><span aria-hidden="true">·</span><span>© {{ year }}</span>
				</p>
			</div>

			<!-- One element for every auth page: it stays mounted between routes, so moving it is a slide, not a swap. -->
			<aside class="auth-panel hidden text-white lg:block" :class="variant === 'librarian' ? 'is-staff' : ''" :data-side="side">
				<div class="sticky top-3 h-[calc(100vh-24px)] overflow-hidden rounded-[28px]">
					<!-- The illustration: a glowing brand star over a library shelf, drawn in code. Decoration only. -->
					<div class="auth-glow pointer-events-none absolute -right-24 -top-24 h-[560px] w-[560px] rounded-full" aria-hidden="true" />
					<svg class="auth-star pointer-events-none absolute right-[8%] top-[9%] h-[clamp(140px,17vw,230px)] w-[clamp(140px,17vw,230px)] text-white/[.9]"
						viewBox="0 0 100 100" aria-hidden="true">
						<path fill="currentColor" :d="STAR" />
					</svg>
					<svg v-for="s in sparkles" :key="s.class" class="pointer-events-none absolute text-white" :class="s.class" viewBox="0 0 100 100" aria-hidden="true">
						<path fill="currentColor" :d="STAR" />
					</svg>

					<svg class="auth-shelf pointer-events-none absolute inset-x-0 bottom-0 h-[34%] w-full" viewBox="0 0 800 380"
						preserveAspectRatio="xMinYMax slice" aria-hidden="true">
						<g v-for="shelf in shelves" :key="shelf.y">
							<rect :x="shelf.x" :y="shelf.y" :width="shelf.w" height="9" rx="3" fill="#fff" fill-opacity=".2" />
							<rect v-for="(book, i) in shelf.books" :key="i" :x="book.x" :y="shelf.y - book.h" :width="book.w" :height="book.h" rx="4"
								fill="#fff" :fill-opacity="book.o" :transform="book.lean ? `rotate(${book.lean} ${book.x + (book.lean > 0 ? book.w : 0)} ${shelf.y})` : undefined" />
						</g>
					</svg>

					<!-- Headline up top, the steps as one row sitting just above the shelf (the bottom 34%). -->
					<div class="relative flex h-full flex-col px-12 pb-[calc((100vh-24px)*0.34+28px)] pt-[11vh] xl:px-16">
						<Transition mode="out-in" enter-active-class="transition duration-300 ease-out delay-150"
							enter-from-class="translate-y-2 opacity-0" leave-active-class="transition duration-200 ease-out"
							leave-to-class="opacity-0">
							<div :key="variant" class="max-w-[min(540px,68%)]">
								<h2 class="text-balance text-[clamp(36px,3.7vw,58px)] font-extrabold leading-[1.02] tracking-[-.03em]">{{ copy.title }}</h2>
								<p class="mt-4 max-w-[420px] text-pretty text-[16px] leading-relaxed text-white/80">{{ copy.lead }}</p>
								<!-- The switch between sign-in and registration lives here on wide screens (the forms show it on phones).
									 The librarian page has none: its form already links to the student sign-in. -->
								<NuxtLink v-if="copy.cta" :to="copy.to"
									class="mt-8 inline-flex h-11 items-center gap-2 rounded-xl border-[1.5px] border-white/75 px-6 text-[14px] font-semibold transition-colors duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
									:class="variant === 'librarian' ? 'hover:text-stone-800 focus-visible:ring-offset-stone-800' : 'hover:text-accent-600 focus-visible:ring-offset-accent-500'">
									{{ copy.cta }}
									<Icon name="i-tabler-arrow-right" class="h-4 w-4" />
								</NuxtLink>
							</div>
						</Transition>

						<!-- Sign-in and register share the same three steps, so the row stays put through the slide and
							 only the highlighted step moves. The track across the top reads as one path, left to right. -->
						<Transition mode="out-in" enter-active-class="transition duration-300 ease-out delay-150"
							enter-from-class="opacity-0" leave-active-class="transition duration-200 ease-out" leave-to-class="opacity-0">
							<ol :key="copy.list" class="mt-auto grid grid-cols-3 gap-x-5">
								<li v-for="(item, i) in lists[copy.list]" :key="item.title" class="border-t-2 pt-4 transition-colors duration-500"
									:class="copy.current === i ? 'border-white' : 'border-white/25'">
									<span class="flex items-center gap-2.5">
										<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold tabular-nums transition-colors duration-500"
											:class="copy.current === i ? 'bg-white text-accent-600' : 'bg-white/15 text-white'">
											<Icon v-if="item.icon" :name="item.icon" class="h-3.5 w-3.5" />
											<template v-else>{{ i + 1 }}</template>
										</span>
										<span v-if="copy.current === i" class="rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-semibold">You're here</span>
									</span>
									<span class="mt-2.5 block text-[15px] font-semibold leading-tight">{{ item.title }}</span>
									<span class="mt-1 block text-pretty text-[13px] leading-snug text-white/75">{{ item.body }}</span>
								</li>
							</ol>
						</Transition>
					</div>
				</div>
			</aside>

			<footer class="mt-8 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[12.5px] text-stone-500 lg:hidden">
				<span class="font-semibold text-accent-700">EntryPoint</span>
				<span aria-hidden="true">·</span>
				<span>STI College Davao Library</span>
				<span aria-hidden="true">·</span>
				<span>© {{ year }}</span>
			</footer>
		</div>
	</main>
</template>

<script setup lang="ts">
const STAR = 'M50 0C53 35 65 47 100 50 65 53 53 65 50 100 47 65 35 53 0 50 35 47 47 35 50 0Z'

const route = useRoute()
const path = computed(() => route.path.toLowerCase())

const variant = computed(() =>
	path.value.startsWith('/register') ? 'register' : path.value.startsWith('/librarian') ? 'librarian' : 'student',
)
// Which side the illustrated panel is on. The form sits opposite: sign-in on the left, registration on the right.
const side = computed(() => (variant.value === 'register' ? 'left' : 'right'))

// The panel answers the question people ask at the desk: how do I get an account (or, for staff, where things are).
const lists = {
	join: [
		{ title: 'Register online', body: 'Your school email and student ID.', icon: '' },
		{ title: 'Get approved at the desk', body: 'Bring your school ID. A librarian checks it.', icon: '' },
		{ title: 'Scan in and borrow', body: 'Your Library ID gets you in and books out.', icon: '' },
	],
	desk: [
		{ title: 'Attendance', body: 'Scan students in and out at the door.', icon: 'i-tabler-user-check' },
		{ title: 'Circulation', body: 'Check books out and take returns.', icon: 'i-tabler-book' },
		{ title: 'Students', body: 'Approve new registrations.', icon: 'i-tabler-users' },
	],
} as const

const panelCopy = {
	student: {
		title: 'Your library, one scan away.',
		lead: 'Find a book, borrow it, and keep track of due dates and points from your EntryPoint account.',
		list: 'join',
		current: -1,
		cta: 'Create an account',
		to: '/register',
	},
	register: {
		title: 'Three steps to borrowing.',
		lead: 'Your account works once a librarian approves it at the desk.',
		list: 'join',
		current: 0,
		cta: 'I already have an account',
		to: '/login',
	},
	librarian: {
		title: 'The whole desk, in one place.',
		lead: 'Attendance, circulation and new registrations, ready as soon as you sign in.',
		list: 'desk',
		current: -1,
		cta: '',
		to: '/login',
	},
} as const
const copy = computed(() => panelCopy[variant.value])

const year = new Date().getFullYear()

// Phones: three oversized stars around the card, big and faint, each half out of frame.
const backdropStars = [
	{ class: '-left-24 -top-28 hidden h-[380px] w-[380px] rotate-12 opacity-[.07] md:block' },
	{ class: '-bottom-40 -right-28 hidden h-[520px] w-[520px] -rotate-6 opacity-[.08] md:block' },
	{ class: 'right-[12%] top-[9%] hidden h-[90px] w-[90px] rotate-45 opacity-[.10] md:block' },
]

// Small glints around the big star, like the sparkle in the EntryPoint wordmark.
const sparkles = [
	{ class: 'right-[34%] top-[7%] h-5 w-5 opacity-60' },
	{ class: 'right-[5%] top-[36%] h-7 w-7 opacity-40' },
	{ class: 'right-[30%] top-[33%] h-3 w-3 opacity-50' },
	{ class: 'left-[46%] top-[4%] h-3.5 w-3.5 opacity-30' },
]

/*
 * The shelf: a plank of book spines in white at low opacity, so the panel reads as a library without
 * competing with the text above it. Sizes and the odd leaning book are fixed (not random) so the
 * drawing is identical on the server and in the browser.
 */
function row(startX: number, widths: number[], heights: number[], opacities: number[], leans: Record<number, number> = {}) {
	let x = startX
	return widths.map((w, i) => {
		const h = heights[i % heights.length]!
		const lean = leans[i] ?? 0
		// A leaning book's top swings out by h·sin(angle); leave that much room on the side it leans to.
		const swing = Math.ceil(h * Math.sin((Math.abs(lean) * Math.PI) / 180))
		if (lean < 0) x += swing
		const book = { x, w, h, o: opacities[i % opacities.length]!, lean }
		x += w + 4 + (lean > 0 ? swing : 0)
		return book
	})
}

const shelves = [
	{
		x: 0, y: 370, w: 800,
		books: row(14, [34, 26, 42, 30, 24, 38, 28, 32, 46, 26, 30, 36, 24, 40, 28, 34, 30, 26, 38, 30, 36],
			[130, 150, 118, 160, 142, 124, 156, 136, 112, 148, 164, 128, 146, 120, 152, 138, 158, 126, 144, 134, 154],
			[.12, .18, .1, .22, .14, .16, .1, .2, .13, .17, .11, .19, .15, .12, .21, .1, .16, .14, .18, .12, .2], { 6: 9, 14: -8 }),
	},
]
</script>

<style>
/* Phones: warm light from the top-left, a deeper glow bottom-right, and a faint field of the brand star. */
.auth-page {
	background-color: #fffbeb;
	background-image:
		radial-gradient(55% 50% at 0% 0%, rgb(230 199 163 / .55), transparent 70%),
		radial-gradient(50% 45% at 100% 100%, rgb(192 122 62 / .20), transparent 72%),
		url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2756%27 height=%2756%27 viewBox=%270 0 56 56%27%3E%3Cpath fill=%27%239a5323%27 fill-opacity=%27.07%27 d=%27M28 22c.4 3.6 1.6 4.8 5.2 5.2-3.6.4-4.8 1.6-5.2 5.2-.4-3.6-1.6-4.8-5.2-5.2 3.6-.4 4.8-1.6 5.2-5.2Z%27/%3E%3C/svg%3E");
	background-size: auto, auto, 56px 56px;
}

/* Each auth page's root is an .auth-pane. */
.auth-pane {
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 2rem 1.5rem;
}

@media (min-width: 640px) {
	.auth-pane {
		padding: 2.5rem 2.25rem;
	}
}

@media (min-width: 1024px) {
	/* Three tracks: form | gap | form. The panel covers two of them, so whichever outer track it leaves
	   open is where that page's form shows. Both panes share the row, so during a route change the
	   outgoing form fades in its column while the incoming one appears in the other, under the panel. */
	.auth-shell {
		--fw: clamp(440px, 38vw, 580px);
		display: grid;
		grid-template-columns: var(--fw) 1fr var(--fw);
		grid-template-rows: minmax(100vh, auto);
	}

	/* Logo + form are centred as one group above the footer, so the space above and below stays even
	   and the logo sits a fixed, short distance over the heading. */
	.auth-pane {
		grid-row: 1;
		padding: 3rem 3rem 4.5rem;
	}

	/* Not images: a logo keeps its own proportions (this unlayered rule would beat Tailwind's w-auto). */
	.auth-pane > :not(img) {
		width: 100%;
		max-width: 440px;
		margin-inline: auto;
	}

	.auth-pane[data-side='left'] {
		grid-column: 1;
		--enter-from: -14px;
	}

	.auth-pane[data-side='right'] {
		grid-column: 3;
		--enter-from: 14px;
	}

	.auth-chrome {
		grid-row: 1;
		grid-column: 1;
	}

	.auth-shell[data-panel='left'] .auth-chrome {
		grid-column: 3;
	}

	.auth-panel {
		position: absolute;
		top: 12px;
		bottom: 12px;
		left: 12px;
		width: calc(100% - var(--fw) - 24px);
	}
}

.auth-panel > div {
	background-color: var(--color-accent-500);
	background-image:
		radial-gradient(90% 60% at 0% 0%, rgb(255 255 255 / .10), transparent 60%),
		linear-gradient(160deg, var(--color-accent-500) 0%, #6f3a17 100%);
	transition: background-color 500ms ease-out;
}

.auth-panel.is-staff > div {
	background-color: #292524;
	background-image:
		radial-gradient(90% 60% at 0% 0%, rgb(255 255 255 / .08), transparent 60%),
		linear-gradient(160deg, #3a3330 0%, #1c1917 100%);
}

.auth-panel {
	transition: transform 760ms var(--ease-in-out);
}

.auth-panel[data-side='right'] {
	transform: translateX(var(--fw));
}

/* The star's glow: warm light, not a halo ring. */
.auth-glow {
	background: radial-gradient(closest-side, rgb(255 214 170 / .35), rgb(255 214 170 / .08) 60%, transparent);
}

.auth-panel.is-staff .auth-glow {
	background: radial-gradient(closest-side, rgb(255 255 255 / .16), rgb(255 255 255 / .04) 60%, transparent);
}

.auth-star {
	filter: drop-shadow(0 10px 30px rgb(0 0 0 / .18));
	transition: transform 1100ms var(--ease-out);
}

.auth-panel[data-side='left'] .auth-star {
	transform: rotate(-90deg);
}

.auth-swap-leave-active {
	transition: opacity 220ms ease-out;
}

.auth-swap-leave-to {
	opacity: 0;
}

.auth-swap-enter-active {
	transition: opacity 420ms var(--ease-out) 320ms, transform 620ms var(--ease-out) 320ms;
}

.auth-swap-enter-from {
	opacity: 0;
	transform: translateX(var(--enter-from, 0));
}

/* Stacked layout: there is no panel to hide the swap behind, so the old page just goes. */
@media (max-width: 1023px) {
	.auth-swap-leave-active {
		display: none;
	}

	.auth-swap-enter-active {
		transition-delay: 0ms;
	}
}

@media (prefers-reduced-motion: reduce) {
	.auth-panel,
	.auth-star {
		transition-duration: 1ms;
	}

	.auth-swap-enter-active {
		transition: opacity 200ms ease-out;
	}

	.auth-swap-enter-from {
		transform: none;
	}
}

.auth-page ::selection {
	background: var(--color-accent-200);
	color: var(--color-accent-700);
}
</style>
