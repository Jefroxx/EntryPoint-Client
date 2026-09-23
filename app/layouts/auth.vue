<template>
	<main class="auth-page relative flex min-h-screen flex-col items-center overflow-hidden px-4 pb-6 pt-10 sm:pt-14 lg:pt-10">
		<!-- The backdrop: the brand star, oversized and faint, half out of frame. Decoration only. -->
		<svg v-for="star in backdropStars" :key="star.class" class="auth-bg-star pointer-events-none absolute text-accent-500" :class="star.class"
			viewBox="0 0 100 100" aria-hidden="true">
			<path fill="currentColor" d="M50 0C53 35 65 47 100 50 65 53 53 65 50 100 47 65 35 53 0 50 35 47 47 35 50 0Z" />
		</svg>

		<!-- my-auto centres the card in the window but, unlike align-items: center, never pushes a tall
			 card (registration step 2) up out of reach: it just scrolls. It also pins the footer to the bottom. -->
		<div class="relative z-10 w-full max-w-[560px] lg:my-auto lg:max-w-[920px]">
			<!-- Small screens have no room for the panel, so the logo sits above the card instead. -->
			<div class="mb-5 text-center lg:hidden">
				<NuxtLink :to="signInPath" class="inline-flex items-center leading-none" aria-label="EntryPoint">
					<img src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-10 w-auto" />
				</NuxtLink>
			</div>

			<div class="auth-card relative grid overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-overlay lg:min-h-[540px] lg:grid-cols-2">
				<slot />

				<!-- One element for every auth page: it stays mounted between routes, so moving it is a slide, not a swap. -->
				<aside class="auth-panel absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden rounded-[28px] text-white lg:block"
					:class="variant === 'librarian' ? 'bg-stone-800' : 'bg-accent-500'" :data-side="side">
					<svg class="auth-star pointer-events-none absolute -bottom-28 -right-24 h-[420px] w-[420px] text-white/[.07]"
						viewBox="0 0 100 100" aria-hidden="true">
						<path fill="currentColor" d="M50 0C53 35 65 47 100 50 65 53 53 65 50 100 47 65 35 53 0 50 35 47 47 35 50 0Z" />
					</svg>

					<div class="relative flex h-full flex-col px-11 py-10">
						<NuxtLink :to="signInPath" class="self-start leading-none" aria-label="EntryPoint">
							<img src="~/assets/css/logo/EntryPointLogo.png" alt="" class="h-8 w-auto brightness-0 invert" />
						</NuxtLink>

						<div class="my-auto max-w-[350px] py-8">
							<Transition mode="out-in" enter-active-class="transition duration-300 ease-out delay-150"
								enter-from-class="translate-y-2 opacity-0" leave-active-class="transition duration-200 ease-out"
								leave-to-class="opacity-0">
								<div :key="variant">
									<h2 class="text-balance text-[30px] font-extrabold leading-[1.1] tracking-[-.02em]">{{ copy.title }}</h2>
									<p class="mt-2.5 text-pretty text-[14.5px] leading-relaxed text-white/80">{{ copy.lead }}</p>
								</div>
							</Transition>

							<!-- Sign-in and register share the same three steps, so the list stays put through the slide
								 and only "You're here" moves. The librarian panel has its own list. -->
							<Transition mode="out-in" enter-active-class="transition duration-300 ease-out delay-150"
								enter-from-class="opacity-0" leave-active-class="transition duration-200 ease-out" leave-to-class="opacity-0">
								<ol :key="copy.list" class="mt-6 grid gap-4">
									<li v-for="(item, i) in lists[copy.list]" :key="item.title" class="flex items-start gap-3.5">
										<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums transition-colors duration-500"
											:class="copy.current === i ? 'bg-white text-accent-600' : 'bg-white/15 text-white'">
											<Icon v-if="item.icon" :name="item.icon" class="h-4 w-4" />
											<template v-else>{{ i + 1 }}</template>
										</span>
										<span class="min-w-0 pt-0.5">
											<span class="flex items-center gap-2 text-[14.5px] font-semibold leading-tight">
												{{ item.title }}
												<span v-if="copy.current === i" class="rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-semibold">You're here</span>
											</span>
											<span class="mt-0.5 block text-[13px] leading-snug text-white/75">{{ item.body }}</span>
										</span>
									</li>
								</ol>
							</Transition>

							<NuxtLink :to="copy.to"
								class="mt-7 inline-flex h-11 items-center gap-2 rounded-xl border-[1.5px] border-white/75 px-6 text-[14px] font-semibold transition-colors duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
								:class="variant === 'librarian' ? 'hover:text-stone-800 focus-visible:ring-offset-stone-800' : 'hover:text-accent-600 focus-visible:ring-offset-accent-500'">
								{{ copy.cta }}
								<Icon name="i-tabler-arrow-right" class="h-4 w-4" />
							</NuxtLink>
						</div>
					</div>
				</aside>
			</div>
		</div>

		<footer class="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[12.5px] text-stone-500">
			<span class="font-semibold text-accent-700">EntryPoint</span>
			<span aria-hidden="true">·</span>
			<span>STI College Davao Library</span>
			<span aria-hidden="true">·</span>
			<span>© {{ year }}</span>
		</footer>
	</main>
</template>

<script setup lang="ts">
const route = useRoute()
const path = computed(() => route.path.toLowerCase())

const variant = computed(() =>
	path.value.startsWith('/register') ? 'register' : path.value.startsWith('/librarian') ? 'librarian' : 'student',
)
// The form sits opposite the panel: sign-in on the left, registration on the right.
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
		title: 'New to the library?',
		lead: 'Getting an account takes three steps.',
		list: 'join',
		current: -1,
		cta: 'Create an account',
		to: '/register',
	},
	register: {
		title: 'Three steps to borrowing',
		lead: 'Your account works once a librarian approves it.',
		list: 'join',
		current: 0,
		cta: 'I already have an account',
		to: '/login',
	},
	librarian: {
		title: 'At the desk',
		lead: 'Where the day-to-day work lives once you sign in.',
		list: 'desk',
		current: -1,
		cta: 'Student sign-in',
		to: '/login',
	},
} as const
const copy = computed(() => panelCopy[variant.value])

const signInPath = computed(() => (variant.value === 'librarian' ? '/librarian/login' : '/login'))

const year = new Date().getFullYear()

// Three oversized stars around the card: big and faint, each half out of frame, so the page reads
// as EntryPoint without competing with the form. Hidden on phones, where the card fills the width.
const backdropStars = [
	{ class: '-left-24 -top-28 hidden h-[380px] w-[380px] rotate-12 opacity-[.07] md:block' },
	{ class: '-bottom-40 -right-28 hidden h-[520px] w-[520px] -rotate-6 opacity-[.08] md:block' },
	{ class: 'right-[12%] top-[9%] hidden h-[90px] w-[90px] rotate-45 opacity-[.10] lg:block' },
]
</script>

<style>
/* The sign-in backdrop: warm light from the top-left, a deeper glow bottom-right, and a faint
   field of the brand star so the page around the card isn't a flat sheet of cream. */
.auth-page {
	background-color: #fffbeb;
	background-image:
		radial-gradient(55% 50% at 0% 0%, rgb(230 199 163 / .55), transparent 70%),
		radial-gradient(50% 45% at 100% 100%, rgb(192 122 62 / .20), transparent 72%),
		url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2756%27 height=%2756%27 viewBox=%270 0 56 56%27%3E%3Cpath fill=%27%239a5323%27 fill-opacity=%27.07%27 d=%27M28 22c.4 3.6 1.6 4.8 5.2 5.2-3.6.4-4.8 1.6-5.2 5.2-.4-3.6-1.6-4.8-5.2-5.2 3.6-.4 4.8-1.6 5.2-5.2Z%27/%3E%3C/svg%3E");
	background-size: auto, auto, 56px 56px;
}

/* Each auth page's root is an .auth-pane. Both panes share the first grid row, so while the
   route changes the outgoing form fades in its column and the incoming one appears in the
   other, under the panel, which then slides off it. */
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
	.auth-pane {
		grid-row: 1;
		padding: 3.5rem 3rem;
	}

	.auth-pane[data-side='left'] {
		grid-column: 1;
		--enter-from: -14px;
	}

	.auth-pane[data-side='right'] {
		grid-column: 2;
		--enter-from: 14px;
	}
}

.auth-panel {
	background-image: radial-gradient(120% 70% at 0% 0%, rgb(255 255 255 / .12), transparent 60%);
	transition: transform 760ms var(--ease-in-out), background-color 500ms ease-out;
}

.auth-panel[data-side='right'] {
	transform: translateX(100%);
}

.auth-star {
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
