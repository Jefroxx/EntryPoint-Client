<template>
	<div class="student-app min-h-dvh text-stone-900 md:flex">
		<!-- Wide screens: a left sidebar. Always an icon rail on tablets; from lg up it has full labels,
			 and the menu button in the top bar folds it back to the rail (see the .sidebar styles below). -->
		<aside id="student-sidebar" :data-collapsed="!sidebarOpen"
			class="sidebar sticky top-0 z-40 hidden h-dvh w-[76px] shrink-0 overflow-hidden border-r border-stone-200 bg-white md:flex"
			:class="sidebarOpen ? 'lg:w-[232px]' : ''">
			<div class="flex h-full w-full flex-col">
			<NuxtLink to="/student/home" class="sb-logo flex h-[68px] shrink-0 items-center justify-center leading-none lg:justify-start lg:px-6"
				aria-label="EntryPoint home">
				<img src="/favicon.png" alt="" class="sb-mark h-8 w-8 lg:hidden" />
				<img src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="sb-word hidden h-8 w-auto max-w-none lg:block" />
			</NuxtLink>

			<nav class="relative mt-3 grid gap-1 px-3" aria-label="Main">
				<span class="pointer-events-none absolute inset-x-3 top-0 rounded-xl bg-accent-100 transition-[transform,height,opacity] duration-[320ms] ease-out"
					:style="pillStyle" />
				<template v-for="link in links" :key="link.to">
					<NuxtLink :ref="el => setLinkRef(link.to, el)" :to="link.to"
						class="sb-item relative z-[1] flex h-11 items-center justify-center gap-3 rounded-xl text-[14.5px] font-medium transition-[transform,color,background-color] duration-150 ease-out active:scale-[.97] lg:justify-start lg:px-3.5"
						:class="isActive(link.to) ? 'text-accent-700' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'"
						:aria-current="isActive(link.to) ? 'page' : undefined" :title="link.label">
						<Icon :name="link.icon" class="h-[19px] w-[19px] shrink-0" />
						<span class="sb-label hidden whitespace-nowrap lg:inline">{{ link.label }}</span>
						<span v-if="link.to === '/student/wishlist' && wishlist.length" class="sb-label font-data ml-auto hidden text-[12px] text-stone-400 lg:inline">{{ wishlist.length }}</span>
						<span v-if="link.to === '/student/books' && attention"
							class="sb-badge absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10.5px] font-semibold text-white lg:static lg:ml-auto">{{ attention }}</span>
					</NuxtLink>
				</template>
			</nav>

			<div class="mx-6 my-4 h-px bg-stone-100" />

			<div class="grid gap-1 px-3">
				<NuxtLink v-for="link in extras" :key="link.to" :to="link.to"
					class="sb-item flex h-11 items-center justify-center gap-3 rounded-xl text-[14.5px] font-medium transition-colors duration-150 lg:justify-start lg:px-3.5"
					:class="isActive(link.to) ? 'bg-accent-100 text-accent-700' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'"
					:aria-current="isActive(link.to) ? 'page' : undefined" :title="link.label">
					<Icon :name="link.icon" class="h-[19px] w-[19px] shrink-0" />
					<span class="sb-label hidden whitespace-nowrap lg:inline">{{ link.label }}</span>
				</NuxtLink>
			</div>

			<div class="mt-auto px-3 pb-5">
				<NuxtLink to="/student/profile" title="Profile"
					class="sb-item flex h-11 items-center justify-center gap-3 rounded-xl text-[14.5px] font-medium transition-colors duration-150 lg:justify-start lg:px-3.5"
					:class="isActive('/student/profile') ? 'bg-accent-100 text-accent-700' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'">
					<Icon name="i-tabler-user-circle" class="h-[19px] w-[19px] shrink-0" />
					<span class="sb-label hidden whitespace-nowrap lg:inline">Profile</span>
				</NuxtLink>
			</div>
			</div>
		</aside>

		<div class="min-w-0 flex-1">
		<!-- Wide screens: search and the account controls sit above the page -->
		<header
			class="sticky top-0 z-30 hidden h-[68px] items-center gap-4 border-b border-stone-200 bg-amber-50/85 px-6 backdrop-blur-sm md:flex lg:px-8">
			<!-- Tablets are always on the icon rail, so the toggle only exists where there's a full sidebar to fold. -->
			<button type="button" aria-controls="student-sidebar" :aria-expanded="sidebarOpen"
				:aria-label="sidebarOpen ? 'Collapse sidebar to icons' : 'Expand sidebar'" :title="sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'"
				class="-ml-2 hidden h-10 w-10 shrink-0 lg:flex items-center justify-center rounded-xl text-stone-600 transition-[transform,background-color,color] duration-150 ease-out hover:bg-stone-900/5 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 active:scale-90"
				@click="sidebarOpen = !sidebarOpen">
				<Icon name="i-tabler-menu-2" class="h-[22px] w-[22px]" />
			</button>
			<label class="relative w-full max-w-[420px]">
				<span class="sr-only">Search books</span>
				<Icon name="i-tabler-search" class="pointer-events-none absolute left-3 top-[11px] h-4 w-4 text-stone-400" />
				<input ref="searchInput" v-model="search" type="search" placeholder="Search books by title or author" autocomplete="off"
					class="h-[40px] w-full rounded-xl border border-stone-200 bg-white pl-9 pr-9 text-[15px] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-stone-400 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100"
					@input="onSearch">
				<kbd class="font-data pointer-events-none absolute right-2 top-[10px] rounded-md border border-stone-200 bg-stone-50 px-1.5 text-[11px] text-stone-400">/</kbd>
			</label>

			<span class="flex-1" />

			<div class="flex items-center gap-2">
				<!-- Same material as the search field (white, hairline border, h-40), so it reads as part of the bar. -->
				<NuxtLink to="/student/rewards" :aria-label="`${points} knowledge points. Open rewards`" title="Knowledge points"
					class="flex h-10 items-center gap-2 rounded-xl border border-stone-200 bg-white pl-1.5 pr-3 transition-[border-color,transform] duration-150 ease-out hover:border-accent-200 active:scale-[.97]">
					<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
						<Icon name="i-tabler-coins" class="h-4 w-4" />
					</span>
					<span class="text-[14.5px] font-semibold text-stone-900 tabular-nums">{{ shownPoints }}</span>
					<span class="text-[12.5px] text-stone-500">pts</span>
				</NuxtLink>
				<StudentNotificationsMenu />
				<button type="button" :aria-label="cart.length ? `Cart, ${cart.length} book${cart.length === 1 ? '' : 's'}` : 'Cart'" title="Cart"
					class="relative flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition-[transform,border-color,color] duration-150 ease-out hover:border-accent-200 hover:text-accent-600 active:scale-95"
					@click="drawer.open('cart')">
					<StudentCartIcon class="h-[26px] w-[26px]" />
					<span v-if="cart.length" :key="cart.length"
						class="heart-pop absolute -right-1.5 -top-1.5 box-content flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-amber-50 bg-accent-500 px-1 text-[11px] font-bold leading-none text-white tabular-nums">{{ cart.length }}</span>
				</button>
				<StudentAccountMenu class="ml-1" />
			</div>
		</header>

		<!-- Phones: a slim translucent top bar; the title fades in once the large one scrolls away -->
		<header
			class="fixed inset-x-0 top-0 z-40 border-b bg-white/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-sm transition-[border-color] duration-200 md:hidden"
			:class="scrolled ? 'border-stone-200' : 'border-transparent'">
			<div class="grid h-[52px] grid-cols-[1fr_auto_1fr] items-center px-3.5">
				<NuxtLink to="/student/home" class="flex items-center leading-none" aria-label="EntryPoint home">
					<img src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-7 w-auto" />
				</NuxtLink>
				<p class="truncate text-center text-[15px] font-semibold text-stone-900 transition-[opacity,transform] duration-200 ease-out"
					:class="scrolled ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'">{{ route.meta.title }}</p>
				<div class="flex items-center justify-end">
					<NuxtLink to="/student/rewards" :aria-label="`${points} knowledge points. Open rewards`"
						class="mr-1 flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 bg-white pl-1 pr-2 transition-transform duration-150 ease-out active:scale-95">
						<span class="flex h-6 w-6 items-center justify-center rounded-md bg-accent-100 text-accent-600">
							<Icon name="i-tabler-coins" class="h-3.5 w-3.5" />
						</span>
						<span class="text-[13.5px] font-semibold text-stone-900 tabular-nums">{{ shownPoints }}</span>
					</NuxtLink>
					<NuxtLink to="/student/notifications" :aria-label="unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'"
						class="relative flex h-10 w-10 items-center justify-center rounded-xl text-stone-800 transition-[transform,background-color] duration-150 ease-out active:scale-90 active:bg-stone-100">
						<Icon name="i-tabler-bell" class="h-6 w-6" />
						<span v-if="unreadCount"
							class="absolute -right-0.5 top-0 box-content flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10.5px] font-bold leading-none text-white tabular-nums">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
					</NuxtLink>
					<button type="button" :aria-label="cart.length ? `Cart, ${cart.length} book${cart.length === 1 ? '' : 's'}` : 'Cart'"
						class="relative flex h-10 w-10 items-center justify-center rounded-xl text-stone-800 transition-[transform,background-color] duration-150 ease-out active:scale-90 active:bg-stone-100"
						@click="drawer.open('cart')">
						<StudentCartIcon class="h-7 w-7" />
						<span v-if="cart.length" :key="cart.length"
							class="heart-pop absolute -right-0.5 top-0 box-content flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-accent-500 px-1 text-[10.5px] font-bold leading-none text-white tabular-nums">{{ cart.length }}</span>
					</button>
				</div>
			</div>
		</header>

		<main
			class="mx-auto w-full max-w-[1120px] px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:px-6 md:pb-20 md:pt-8 lg:px-8"
			:class="route.meta.wide ? 'xl:max-w-[1400px]' : ''">
			<slot />
		</main>
		</div>

		<!-- Phones: bottom tab bar (a translucent material; content scrolls beneath it) -->
		<nav aria-label="Main"
			class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-stone-200/80 bg-white/80 px-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-2 backdrop-blur-2xl backdrop-saturate-150 md:hidden">
			<NuxtLink v-for="tab in tabs" :key="tab.key" :to="tab.to"
				class="relative flex flex-col items-center gap-1 py-1 text-[11px] font-medium transition-[transform,color] duration-150 ease-out active:scale-90"
				:class="route.meta.tab === tab.key ? 'text-accent-500' : 'text-stone-400'" :aria-current="route.meta.tab === tab.key ? 'page' : undefined">
				<span class="flex h-[30px] w-[46px] items-center justify-center rounded-[11px] transition-colors duration-[240ms] ease-out"
					:class="route.meta.tab === tab.key ? 'bg-accent-100' : 'bg-transparent'">
					<Icon :name="tab.icon" class="h-[23px] w-[23px]" />
				</span>
				<span>{{ tab.label }}</span>
				<span v-if="tab.key === 'books' && attention"
					class="absolute right-[calc(50%-22px)] top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{{ attention }}</span>
			</NuxtLink>
		</nav>

		<StudentBookDrawer />
		<StudentCartDrawer />
		<StudentToast />
	</div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const drawer = useDrawer()
const { cart, wishlist, attention, points, refreshShell, refreshProfile } = useStudent()
// Eases to the new balance after earning or redeeming, instead of jumping.
const shownPoints = useCountUp(points)
const { unreadCount, refresh: refreshNotifications } = useNotifications()

const links = [
	{ label: 'Home', to: '/student/home', icon: 'i-tabler-home' },
	{ label: 'Discover', to: '/student/discover', icon: 'i-tabler-compass' },
	// Between finding a book and borrowing it.
	{ label: 'Wishlist', to: '/student/wishlist', icon: 'i-tabler-heart' },
	{ label: 'My books', to: '/student/books', icon: 'i-tabler-book' },
	{ label: 'Rewards', to: '/student/rewards', icon: 'i-tabler-gift' },
	{ label: 'Facilities', to: '/student/facilities', icon: 'i-tabler-device-desktop' },
]

const extras = [
	{ label: 'Library ID', to: '/student/id', icon: 'i-tabler-id' },
	{ label: 'Suggest a book', to: '/student/suggest', icon: 'i-tabler-bulb' },
]

// A cookie rather than localStorage, so the server renders the sidebar the way it was left (no flash on reload).
const sidebarOpen = useCookie<boolean>('student-sidebar-open', { default: () => true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })

// By path, not route.meta.nav: several pages (ID, Suggest, Me) report nav 'home' for the old top bar.
const isActive = (to: string) => route.path.toLowerCase() === to

const tabs = [
	{ key: 'home', label: 'Home', to: '/student/home', icon: 'i-tabler-home' },
	{ key: 'discover', label: 'Discover', to: '/student/discover', icon: 'i-tabler-search' },
	// Rewards gave up its tab: phones reach it from the points pill in the top bar and Home's "Spend".
	{ key: 'wishlist', label: 'Wishlist', to: '/student/wishlist', icon: 'i-tabler-heart' },
	{ key: 'books', label: 'My books', to: '/student/books', icon: 'i-tabler-book' },
	{ key: 'me', label: 'Me', to: '/student/me', icon: 'i-tabler-user' },
]

/* ---- sidebar: the active pill travels between the main links ---- */
const linkEls: Record<string, HTMLElement> = {}
const pill = reactive({ y: 0, h: 0 })

const pillStyle = computed(() => ({
	height: `${pill.h}px`,
	transform: `translateY(${pill.y}px)`,
	opacity: pill.h ? '1' : '0',
}))

function setLinkRef(to: string, el: unknown) {
	const node = el && typeof el === 'object' && '$el' in el ? (el as { $el: HTMLElement }).$el : (el as HTMLElement | null)
	if (node) linkEls[to] = node
	else delete linkEls[to]
}

function movePill() {
	const el = linkEls[route.path.toLowerCase()]
	// Reads 0 on phones (sidebar is display:none) and on pages outside the main links — the pill hides.
	pill.h = el?.offsetHeight ?? 0
	pill.y = el?.offsetTop ?? pill.y
}

watch(() => route.path, () => void nextTick(movePill))

/* ---- collapsing title ---- */
const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 34 }

/* ---- desktop search: writes ?q= on Discover ---- */
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const searchInput = ref<HTMLInputElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | undefined

function onSearch() {
	clearTimeout(searchTimer)
	searchTimer = setTimeout(() => {
		const onDiscover = route.path.toLowerCase() === '/student/discover'
		const query = { ...(onDiscover ? route.query : {}), q: search.value || undefined }
		void (onDiscover ? router.replace({ query }) : router.push({ path: '/student/discover', query }))
	}, 200)
}

// Keep the box honest when the query changes elsewhere (e.g. "Reset" on Discover).
watch(() => route.query.q, (q) => { search.value = typeof q === 'string' ? q : '' })

// "/" jumps to search. Keyboard-initiated, so no animation.
function onKeydown(event: KeyboardEvent) {
	const target = event.target as HTMLElement | null
	if (event.key !== '/' || target?.closest('input, textarea, select, [contenteditable]')) return
	if (!searchInput.value || searchInput.value.offsetParent === null) return
	event.preventDefault()
	searchInput.value.focus()
}

/* ---- keep counters and notifications fresh ---- */
const POLL_MS = 60_000
let pollTimer: ReturnType<typeof setInterval> | undefined

function refreshIfVisible() {
	if (document.visibilityState !== 'visible') return
	void refreshNotifications()
	void refreshProfile()
}

onMounted(() => {
	void refreshShell()
	void refreshNotifications()
	onScroll()
	void nextTick(movePill)
	// Web fonts land after the first measure and change the link widths.
	void document.fonts?.ready.then(movePill)
	window.addEventListener('resize', movePill)
	window.addEventListener('scroll', onScroll, { passive: true })
	window.addEventListener('keydown', onKeydown)
	document.addEventListener('visibilitychange', refreshIfVisible)
	pollTimer = setInterval(refreshIfVisible, POLL_MS)
})

onBeforeUnmount(() => {
	window.removeEventListener('resize', movePill)
	window.removeEventListener('scroll', onScroll)
	window.removeEventListener('keydown', onKeydown)
	document.removeEventListener('visibilitychange', refreshIfVisible)
	clearInterval(pollTimer)
	clearTimeout(searchTimer)
})

// Counters (overdue, ready for pickup, slots) can change on any screen.
watch(() => route.path, () => { void refreshProfile() })
</script>

<style>
/* Folding the sidebar animates its width; the content column beside it grows into the space. */
.sidebar {
	transition: width 320ms var(--ease-out);
}

/* Folded on a wide screen: the same icon rail tablets get. Labels go, the wordmark becomes the star,
   and the My books badge sits on its icon. Titles on each item still name it on hover. */
@media (min-width: 1024px) {
	.sidebar[data-collapsed="true"] .sb-label,
	.sidebar[data-collapsed="true"] .sb-word {
		display: none;
	}

	.sidebar[data-collapsed="true"] .sb-mark {
		display: block;
	}

	.sidebar[data-collapsed="true"] .sb-logo,
	.sidebar[data-collapsed="true"] .sb-item {
		justify-content: center;
		padding-inline: 0;
	}

	.sidebar[data-collapsed="true"] .sb-badge {
		position: absolute;
		top: 0.375rem;
		right: 0.5rem;
		margin-left: 0;
	}
}

@media (prefers-reduced-motion: reduce) {
	.sidebar {
		transition: none;
	}
}
</style>
