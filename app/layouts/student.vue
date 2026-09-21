<template>
	<div class="student-app min-h-dvh text-stone-900">
		<!-- Wide screens: a top navigation bar -->
		<header
			class="sticky top-0 z-40 hidden h-[68px] items-center gap-5 border-b border-stone-200 bg-white/90 px-6 backdrop-blur-sm md:flex">
			<NuxtLink to="/student/home" class="flex items-center leading-none" aria-label="EntryPoint home">
				<img src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-8 w-auto" />
			</NuxtLink>

			<nav class="relative flex gap-0.5" aria-label="Main">
				<span class="pointer-events-none absolute left-0 top-0 h-[38px] rounded-[11px] bg-accent-100 transition-[transform,width,opacity] duration-[320ms] ease-out"
					:style="pillStyle" />
				<NuxtLink v-for="link in links" :key="link.nav" :ref="el => setLinkRef(link.nav, el)" :to="link.to"
					class="relative z-[1] flex h-[38px] items-center gap-1.5 rounded-[11px] px-[15px] text-[15px] font-medium transition-[transform,color] duration-150 ease-out active:scale-[.97]"
					:class="route.meta.nav === link.nav ? 'text-accent-700' : 'text-stone-500 hover:text-stone-900'"
					:aria-current="route.meta.nav === link.nav ? 'page' : undefined">
					{{ link.label }}
					<span v-if="link.nav === 'books' && attention"
						class="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10.5px] font-semibold text-white">{{ attention }}</span>
				</NuxtLink>
			</nav>

			<span class="flex-1" />

			<label class="relative w-[260px]">
				<span class="sr-only">Search books</span>
				<Icon name="i-lucide-search" class="pointer-events-none absolute left-3 top-[11px] h-4 w-4 text-stone-400" />
				<input ref="searchInput" v-model="search" type="search" placeholder="Search books" autocomplete="off"
					class="h-[38px] w-full rounded-[10px] border border-transparent bg-stone-100 pl-9 pr-9 text-[15px] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-stone-400 focus:border-accent-500 focus:bg-white focus:ring-[3px] focus:ring-accent-100"
					@input="onSearch">
				<kbd class="font-data pointer-events-none absolute right-2 top-[9px] rounded-md border border-stone-200 bg-white px-1.5 text-[11px] text-stone-400">/</kbd>
			</label>

			<div class="flex items-center gap-0.5">
				<StudentNotificationsMenu />
				<button type="button" aria-label="Cart"
					class="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-stone-500 transition-[transform,background-color,color] duration-150 ease-out hover:bg-stone-100 hover:text-stone-900 active:scale-90"
					@click="drawer.open('cart')">
					<Icon name="i-lucide-shopping-bag" class="h-[18px] w-[18px]" />
					<span v-if="cart.length" :key="cart.length"
						class="heart-pop absolute -right-0.5 top-0 box-content flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-white bg-accent-500 px-[3px] text-[10px] font-semibold text-white">{{ cart.length }}</span>
				</button>
				<StudentAccountMenu />
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
				<div class="flex justify-end">
					<NuxtLink to="/student/notifications" aria-label="Notifications"
						class="relative flex h-10 w-10 items-center justify-center rounded-xl text-stone-900 transition-[transform,background-color] duration-150 ease-out active:scale-90 active:bg-stone-100">
						<Icon name="i-lucide-bell" class="h-5 w-5" />
						<span v-if="unreadCount"
							class="absolute right-0 top-0.5 box-content flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-[3px] text-[10px] font-bold leading-none text-white">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
					</NuxtLink>
					<button type="button" aria-label="Cart"
						class="relative flex h-10 w-10 items-center justify-center rounded-xl text-stone-900 transition-[transform,background-color] duration-150 ease-out active:scale-90 active:bg-stone-100"
						@click="drawer.open('cart')">
						<Icon name="i-lucide-shopping-bag" class="h-5 w-5" />
						<span v-if="cart.length" :key="cart.length"
							class="heart-pop absolute right-0 top-0.5 box-content flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-white bg-accent-500 px-[3px] text-[10px] font-semibold text-white">{{ cart.length }}</span>
					</button>
				</div>
			</div>
		</header>

		<main
			class="mx-auto w-full max-w-[1120px] px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:px-6 md:pb-20 md:pt-8">
			<slot />
		</main>

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
		<StudentWishlistDrawer />
		<StudentToast />
	</div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const drawer = useDrawer()
const { cart, attention, refreshShell, refreshProfile } = useStudent()
const { unreadCount, refresh: refreshNotifications } = useNotifications()

const links = [
	{ nav: 'home', label: 'Home', to: '/student/home' },
	{ nav: 'discover', label: 'Discover', to: '/student/discover' },
	{ nav: 'books', label: 'My books', to: '/student/books' },
	{ nav: 'rewards', label: 'Rewards', to: '/student/rewards' },
	{ nav: 'spaces', label: 'Spaces', to: '/student/spaces' },
]

const tabs = [
	{ key: 'home', label: 'Home', to: '/student/home', icon: 'i-lucide-house' },
	{ key: 'discover', label: 'Discover', to: '/student/discover', icon: 'i-lucide-search' },
	{ key: 'books', label: 'My books', to: '/student/books', icon: 'i-lucide-book-open' },
	{ key: 'rewards', label: 'Rewards', to: '/student/rewards', icon: 'i-lucide-gift' },
	{ key: 'me', label: 'Me', to: '/student/me', icon: 'i-lucide-user' },
]

/* ---- desktop nav: the active pill travels between links ---- */
const linkEls: Record<string, HTMLElement> = {}
const pill = reactive({ x: 0, w: 0 })

const pillStyle = computed(() => ({
	width: `${pill.w}px`,
	transform: `translateX(${pill.x}px)`,
	opacity: pill.w ? '1' : '0',
}))

function setLinkRef(nav: string, el: unknown) {
	const node = el && typeof el === 'object' && '$el' in el ? (el as { $el: HTMLElement }).$el : (el as HTMLElement | null)
	if (node) linkEls[nav] = node
	else delete linkEls[nav]
}

function movePill() {
	const el = linkEls[String(route.meta.nav ?? '')]
	// Reads 0 on phones, where the bar is display:none — the pill just stays hidden.
	pill.w = el?.offsetWidth ?? 0
	pill.x = el?.offsetLeft ?? 0
}

watch(() => route.meta.nav, () => void nextTick(movePill))

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
