<template>
	<div class="xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:gap-6">
		<div class="min-w-0">
			<!-- The student's own standing stays on top: greeting, points and streak, what needs doing. -->
			<div class="st-in mb-5 flex items-end justify-between gap-4">
				<div class="min-w-0">
					<p class="text-[12.5px] text-stone-500">{{ today }}</p>
					<h1 class="dashboard-heading mt-1 text-3xl font-bold text-amber-900">
						{{ greeting() }}, {{ profile?.firstName ?? firstName }}
					</h1>
				</div>
				<NuxtLink to="/student/id" class="hidden shrink-0 md:block">
					<ButtonsButton variant="ghost"><Icon name="i-tabler-id" class="h-4 w-4" />Show Library ID</ButtonsButton>
				</NuxtLink>
			</div>

			<div class="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
				<!-- Points, streak and the last seven days of visits -->
				<section class="st-in relative overflow-hidden rounded-[22px] bg-gradient-to-br from-accent-600 via-accent-500 to-accent-400 p-5 text-white" style="animation-delay: 35ms">
					<span class="pointer-events-none absolute -right-10 -top-10 h-[150px] w-[150px] rounded-full bg-white/10" />
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-[12.5px] font-medium text-white/85">Knowledge points</p>
							<p class="dashboard-heading mt-1 text-[40px] font-extrabold leading-none tracking-tight tabular-nums">{{ points }}</p>
						</div>
						<NuxtLink to="/student/rewards"
							class="relative mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-[12.5px] font-semibold text-accent-600 transition-transform duration-150 ease-out active:scale-95">
							<Icon name="i-tabler-gift" class="h-3.5 w-3.5" />Spend
						</NuxtLink>
					</div>

					<div class="mb-2 mt-4 flex items-center justify-between gap-3 text-[12.5px]">
						<span class="flex items-center gap-1.5 font-semibold"><Icon name="i-tabler-flame" class="h-4 w-4" />{{ streak }}-day visit streak</span>
						<span v-if="nextStreak" class="text-right text-white/85">{{ nextStreak.threshold - streak }} more → {{ nextStreak.name }}</span>
					</div>
					<StudentMeter light :value="nextStreak ? streak / nextStreak.threshold : 1" />

					<ol class="mt-4 flex justify-between border-t border-white/20 pt-3.5" aria-label="Library visits, last 7 days">
						<li v-for="(day, i) in week" :key="i" class="flex flex-col items-center gap-1.5 text-[11px] font-medium"
							:class="day.today ? 'text-white' : 'text-white/75'">
							<span class="flex h-7 w-7 items-center justify-center rounded-full"
								:class="[day.visited ? 'bg-white text-accent-600' : 'bg-white/15', day.today && !day.visited ? 'ring-[1.5px] ring-white/70' : '']">
								<Icon v-if="day.visited" name="i-tabler-check" class="h-3.5 w-3.5" />
							</span>
							{{ day.label }}
							<span class="sr-only">{{ day.visited ? 'visited' : 'no visit' }}</span>
						</li>
					</ol>
				</section>

				<section class="st-in overflow-hidden rounded-[22px] border border-stone-200 bg-white" style="animation-delay: 70ms">
					<div class="flex items-center justify-between px-5 pb-2 pt-4">
						<h2 class="text-[16px] font-bold text-stone-900">Needs your attention</h2>
						<span v-if="attentionItems.length" class="font-data rounded-full bg-red-50 px-2 py-0.5 text-[12px] font-semibold text-red-600">{{ attentionItems.length }}</span>
					</div>

					<div v-if="pending && !data" class="mx-5 mb-5 h-[112px] animate-pulse rounded-2xl bg-stone-100" aria-busy="true" />

					<template v-else-if="attentionItems.length">
						<div v-for="item in attentionItems" :key="item.key" class="flex items-center gap-3 border-t border-stone-100 first:border-0">
							<NuxtLink :to="item.to" class="flex min-w-0 flex-1 items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-stone-50 active:bg-stone-100">
								<span class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]" :class="TONE_SOFT[item.tone]">
									<Icon :name="item.icon" class="h-[17px] w-[17px]" />
								</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-[14.5px] font-medium text-stone-900">{{ item.title }}</span>
									<span class="block truncate text-[12.5px] text-stone-500">{{ item.sub }}</span>
								</span>
								<Icon name="i-tabler-chevron-right" class="h-4 w-4 shrink-0 text-stone-300 md:hidden" />
							</NuxtLink>
							<ButtonsButton v-if="item.loan" size="sm" variant="ghost" class="mr-4 hidden !border-accent-100 !bg-accent-100 !text-accent-600 md:inline-flex"
								@click="returning = item.loan!">
								<Icon name="i-tabler-arrow-back-up" class="h-3.5 w-3.5" />I returned this
							</ButtonsButton>
						</div>
					</template>

					<div v-else class="flex items-center gap-3 px-5 pb-5 pt-2">
						<span class="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]" :class="TONE_SOFT.good"><Icon name="i-tabler-check" class="h-[17px] w-[17px]" /></span>
						<span>
							<span class="block text-[14.5px] font-medium text-stone-900">You're all caught up</span>
							<span class="block text-[12.5px] text-stone-500">Nothing overdue, due soon or waiting at the desk.</span>
						</span>
					</div>
				</section>
			</div>

			<!-- Quick tiles (phones: the sidebar holds these on wider screens) -->
			<section class="st-in mt-4 grid grid-cols-4 gap-2 md:hidden" style="animation-delay: 105ms">
				<component :is="tile.to ? NuxtLink : 'button'" v-for="tile in tiles" :key="tile.label" :to="tile.to" :type="tile.to ? undefined : 'button'"
					class="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white px-1 py-3 text-[12px] font-medium transition-transform duration-150 ease-out active:scale-95"
					@click="tile.action?.()">
					<span class="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-100 text-accent-600"><Icon :name="tile.icon" class="h-[18px] w-[18px]" /></span>
					{{ tile.label }}
				</component>
			</section>

			<!-- Recommended -->
			<section class="st-in mt-5 rounded-[22px] border border-stone-200 bg-white p-5 md:p-6" style="animation-delay: 140ms">
				<div class="mb-4 flex items-start justify-between gap-4">
					<div class="min-w-0">
						<h2 class="text-[18px] font-bold text-stone-900">Recommended</h2>
						<p class="mt-0.5 truncate text-[13px] text-stone-500">{{ recommendedReason }}</p>
					</div>
					<NuxtLink to="/student/discover"
						class="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-accent-50 px-3 text-[13px] font-semibold text-accent-600 transition-colors duration-150 hover:bg-accent-100">
						See all<Icon name="i-tabler-chevron-right" class="h-4 w-4" />
					</NuxtLink>
				</div>

				<div v-if="pending && !data" class="grid grid-cols-2 gap-4 md:grid-cols-4" aria-busy="true">
					<div v-for="n in 4" :key="n" class="h-[250px] animate-pulse rounded-2xl bg-stone-100" />
				</div>

				<p v-else-if="!recommended.length" class="rounded-2xl bg-stone-50 px-4 py-8 text-center text-[13.5px] text-stone-500">
					Nothing on the shelf to suggest yet. New books show up here as the library adds them.
				</p>

				<div v-else class="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
					<button v-for="book in recommended" :key="book.bookID" type="button"
						class="group w-[148px] shrink-0 snap-start rounded-2xl text-left focus-visible:outline-none md:w-auto md:[&:nth-child(n+5)]:hidden"
						:aria-pressed="isSelected(book.bookID)" @click="pick(book)">
						<span class="flex h-[200px] items-center justify-center rounded-2xl transition-shadow duration-200 group-focus-visible:ring-2 group-focus-visible:ring-accent-500"
							:class="isSelected(book.bookID) ? 'ring-2 ring-accent-500 ring-offset-2' : ''"
							:style="{ background: tileTint(book) }">
							<StudentCover :book="book" :width="112" class="transition-transform duration-300 ease-out group-hover:-translate-y-1.5" />
						</span>
						<span class="mt-2.5 block truncate px-0.5 text-[14px] font-semibold text-stone-900">{{ book.title }}</span>
						<span class="block truncate px-0.5 text-[12.5px] text-stone-500">{{ book.authors[0] ?? 'Unknown author' }}</span>
					</button>
				</div>
			</section>

			<!-- Categories -->
			<section class="st-in mt-5 rounded-[22px] border border-stone-200 bg-white p-5 md:p-6" style="animation-delay: 175ms">
				<div class="flex items-center justify-between gap-4">
					<h2 class="text-[18px] font-bold text-stone-900">Categories</h2>
					<!-- Opens Discover already filtered to the category picked here (Discover reads ?subject=). -->
					<NuxtLink :to="{ path: '/student/discover', query: category ? { subject: String(category) } : {} }"
						:aria-label="activeCategoryName ? `See all ${activeCategoryName} books` : 'See all books'"
						class="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-accent-50 px-3 text-[13px] font-semibold text-accent-600 transition-colors duration-150 hover:bg-accent-100">
						See all<Icon name="i-tabler-chevron-right" class="h-4 w-4" />
					</NuxtLink>
				</div>

				<div class="no-scrollbar -mx-5 mb-4 mt-3 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Filter by category">
					<button v-for="chip in chips" :key="chip.id ?? 'all'" type="button" role="tab" :aria-selected="category === chip.id"
						class="h-8 shrink-0 rounded-lg px-3.5 text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200"
						:class="category === chip.id ? 'bg-accent-500 text-white' : 'bg-accent-50 text-accent-700 hover:bg-accent-100'"
						@click="category = chip.id">
						{{ chip.name }}
					</button>
				</div>

				<div v-if="shelfPending && !shelf" class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4" aria-busy="true">
					<div v-for="n in 6" :key="n" class="h-[210px] animate-pulse rounded-2xl bg-stone-100" />
				</div>

				<p v-else-if="!shelf?.length" class="rounded-2xl bg-stone-50 px-4 py-8 text-center text-[13.5px] text-stone-500">
					No books in this category yet.
				</p>

				<div v-else class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-x-3 gap-y-4 transition-opacity duration-200"
					:class="shelfPending ? 'opacity-60' : ''">
					<button v-for="book in shelf" :key="book.bookID" type="button"
						class="group flex flex-col items-center rounded-2xl p-2.5 text-left transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
						:class="isSelected(book.bookID) ? 'bg-accent-50 ring-2 ring-accent-500' : ''"
						:aria-pressed="isSelected(book.bookID)" @click="pick(book)">
						<StudentCover :book="book" :width="96" />
						<span class="mt-2.5 block w-full truncate text-[13.5px] font-semibold text-stone-900">{{ book.title }}</span>
						<span class="block w-full truncate text-[12px] text-stone-500">{{ book.authors[0] ?? 'Unknown author' }}</span>
					</button>
				</div>
			</section>
		</div>

		<!-- Book panel (wide screens). Narrower screens open the book drawer instead. -->
		<aside class="st-in sticky top-[92px] hidden h-[calc(100dvh-116px)] min-h-[560px] flex-col overflow-hidden rounded-[26px] bg-accent-900 text-white xl:flex"
			style="animation-delay: 105ms" aria-label="Selected book" aria-live="polite">
			<Transition mode="out-in" enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-2 opacity-0"
				leave-active-class="transition duration-150 ease-out" leave-to-class="opacity-0">
				<div v-if="selected" :key="selected.bookID" class="no-scrollbar flex h-full flex-col overflow-y-auto p-6">
					<div class="flex justify-center rounded-2xl py-7"
						:style="{ background: `radial-gradient(80% 70% at 50% 40%, color-mix(in srgb, ${swatchOf(selected)} 55%, transparent), transparent)` }">
						<StudentCover :book="selected" :width="150" />
					</div>

					<h2 class="mt-5 text-balance text-center text-[21px] font-extrabold leading-tight tracking-[-.01em]">{{ selected.title }}</h2>
					<p class="mt-1 text-center text-[13.5px] text-accent-100/80">{{ authorLine(selected) }}</p>
					<p v-if="selected.subject" class="mt-2.5 text-center">
						<span class="inline-flex h-6 items-center rounded-full bg-white/10 px-2.5 text-[11.5px] font-semibold text-accent-100">{{ selected.subject.name }}</span>
					</p>

					<dl class="mt-5 grid grid-cols-3 divide-x divide-white/15 rounded-2xl bg-white/[.06] py-3 text-center">
						<div class="flex flex-col-reverse">
							<dt class="mt-0.5 text-[11px] text-accent-100/75">On the shelf</dt>
							<dd class="font-data text-[17px] font-bold">{{ selected.availableCopies }}<span class="text-white/50">/{{ selected.totalCopies }}</span></dd>
						</div>
						<div class="flex flex-col-reverse">
							<dt class="mt-0.5 text-[11px] text-accent-100/75">Waiting</dt>
							<dd class="font-data text-[17px] font-bold">{{ selected.queueLength }}</dd>
						</div>
						<div class="flex flex-col-reverse">
							<dt class="mt-0.5 text-[11px] text-accent-100/75">Published</dt>
							<dd class="font-data text-[17px] font-bold">{{ selected.publicationYear ?? '—' }}</dd>
						</div>
					</dl>

					<dl class="mt-4 grid gap-2 text-[13px]">
						<div class="flex justify-between gap-4">
							<dt class="text-accent-100/75">Call number</dt>
							<dd class="font-data text-right text-[12.5px]">{{ selected.callNumber ?? '—' }}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-accent-100/75">Where</dt>
							<dd class="text-right">{{ whereOf(selected) }}</dd>
						</div>
					</dl>

					<p class="mt-4 text-pretty text-[13px] leading-relaxed text-accent-100/85">
						{{ selected.availableCopies
							? 'Add it to your cart and collect it at the desk once a librarian accepts.'
							: `Every copy is out. Adding it joins the queue — you'd be #${selected.queueLength + 1}.` }}
					</p>

					<div class="mt-auto flex gap-2.5 pt-6">
						<StudentHeartButton :active="isWished(selected.bookID)" class="!h-12 !w-12 !rounded-xl bg-white/10 [@media(hover:hover)]:hover:!bg-white/20"
							:class="isWished(selected.bookID) ? '' : '!text-white/80'" @toggle="toggleWish(selected.bookID)" />
						<button v-if="isInCart(selected.bookID)" type="button"
							class="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/30 text-[14.5px] font-semibold transition-colors duration-150 hover:bg-white/10"
							@click="drawer.open('cart')">
							<Icon name="i-tabler-check" class="h-4 w-4" />In cart · View cart
						</button>
						<button v-else type="button"
							class="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-[14.5px] font-semibold text-accent-800 transition-[transform,background-color] duration-150 ease-out hover:bg-accent-50 active:scale-[.98]"
							@click="addToCart(selected.bookID)">
							<StudentCartIcon class="h-5 w-5" />{{ selected.availableCopies ? 'Add to cart' : 'Join the queue' }}
						</button>
					</div>
				</div>

				<div v-else key="empty" class="flex h-full flex-col items-center justify-center p-8 text-center">
					<Icon name="i-tabler-book" class="h-8 w-8 text-accent-100/60" />
					<p class="mt-3 text-[14px] text-accent-100/80">Pick a book to see where it is and whether a copy is free.</p>
				</div>
			</Transition>
		</aside>

		<StudentReturnSheet :loan="returning" @close="returning = null" />
	</div>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import { studentService, type CatalogBook, type LoanRow } from '~/services/studentService'
import { TONE_SOFT, type StudentTone } from '~/utils/studentNotifications'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Home', nav: 'home', tab: 'home', wide: true })
useHead({ title: 'Home' })

const drawer = useDrawer()
const { firstName } = useAuthSession('student')
const { summary, points, streak, wishlist, isWished, isInCart, toggleWish, addToCart } = useStudent()

const profile = computed(() => summary.value?.profile ?? null)
const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

const { data, pending } = useStudentData('student-home', async () => {
	const [loans, reservations, attendance, achievements, subjects] = await Promise.all([
		studentService.loans(),
		studentService.reservations(),
		studentService.attendance(),
		studentService.achievements(),
		studentService.subjects(),
	])

	// "Recommended" is honest about where it comes from: more of the subject the student last
	// borrowed, topped up with whatever is on the shelf. Books they already have are left out.
	const borrowed = new Set(loans.loans.map((l) => l.book.bookID))
	const basis = loans.loans.find((l) => l.book.subject)?.book ?? null
	let picks: CatalogBook[] = []
	if (basis?.subject) {
		picks = (await studentService.catalog({ subjectID: basis.subject.subjectID, availableOnly: true, perPage: 12 })).data
			.filter((b) => !borrowed.has(b.bookID))
	}
	const bySubject = picks.length
	if (picks.length < 4) {
		const shelf = (await studentService.catalog({ availableOnly: true, perPage: 12 })).data
		for (const b of shelf) if (!borrowed.has(b.bookID) && !picks.some((p) => p.bookID === b.bookID)) picks.push(b)
	}

	return {
		loans: loans.loans,
		reservations: reservations.reservations,
		visitedDates: attendance.recentDates,
		achievements: achievements.achievements,
		subjects: subjects.subjects,
		recommended: picks.slice(0, 8),
		basis: bySubject ? basis : null,
	}
})

const recommended = computed(() => data.value?.recommended ?? [])
const recommendedReason = computed(() => {
	const basis = data.value?.basis
	return basis?.subject ? `More ${basis.subject.name}, since you borrowed ${basis.title}.` : 'On the shelf right now, ready to borrow.'
})

/* ---- categories ---- */
const category = ref<number | null>(null)
const chips = computed(() => [
	{ id: null, name: 'All' },
	...[...(data.value?.subjects ?? [])]
		.filter((s) => s.books > 0)
		.sort((a, b) => b.books - a.books)
		.slice(0, 9)
		.map((s) => ({ id: s.subjectID as number | null, name: s.name })),
])

const activeCategoryName = computed(() => chips.value.find((c) => c.id === category.value && c.id !== null)?.name ?? null)

const { data: shelf, pending: shelfPending } = useAsyncData(
	'student-home-shelf',
	async () => (await studentService.catalog({ subjectID: category.value ?? undefined, perPage: 12 })).data,
	{ lazy: true, server: false, watch: [category] },
)

/* ---- the book panel ---- */
const selectedId = ref<number | null>(null)
const selected = computed<CatalogBook | null>(() => {
	const pool = [...recommended.value, ...(shelf.value ?? [])]
	return pool.find((b) => b.bookID === selectedId.value) ?? pool[0] ?? null
})
const isSelected = (id: number) => selected.value?.bookID === id && wideScreen.value

// The panel only exists from xl up; below that a book opens the drawer, as everywhere else.
const wideScreen = ref(false)
let mq: MediaQueryList | undefined
const syncWide = () => { wideScreen.value = !!mq?.matches }
onMounted(() => {
	mq = window.matchMedia('(min-width: 1280px)')
	syncWide()
	mq.addEventListener('change', syncWide)
})
onBeforeUnmount(() => mq?.removeEventListener('change', syncWide))

function pick(book: CatalogBook) {
	if (wideScreen.value) selectedId.value = book.bookID
	else void drawer.open('book', book.bookID)
}

const swatchOf = (book: CatalogBook) => subjectSwatch(book.subject?.name ?? book.title)
const tileTint = (book: CatalogBook) => `color-mix(in srgb, ${swatchOf(book)} 16%, #fffbeb)`
const whereOf = (book: CatalogBook) =>
	book.shelfLocation ?? (book.circulationType ? book.circulationType.charAt(0).toUpperCase() + book.circulationType.slice(1) : '—')

/* ---- attention, streak, week ---- */
const returning = ref<LoanRow | null>(null)

interface AttentionItem { key: string; tone: StudentTone; icon: string; title: string; sub: string; to: string; loan?: LoanRow }

const attentionItems = computed<AttentionItem[]>(() => {
	if (!data.value) return []
	const open = data.value.loans.filter((l) => l.status === 'Active')

	const overdue = open.filter((l) => l.daysLeft < 0).map<AttentionItem>((l) => ({
		key: `o${l.loanID}`, tone: 'bad', icon: 'i-tabler-alert-circle', title: l.book.title,
		sub: `${dueLabel(l.daysLeft)} · was due ${formatDate(l.dueDate)}`, to: '/student/books?tab=loans', loan: l,
	}))
	const soon = open.filter((l) => l.daysLeft >= 0 && l.daysLeft <= 3).map<AttentionItem>((l) => ({
		key: `s${l.loanID}`, tone: 'warn', icon: 'i-tabler-clock', title: l.book.title,
		sub: `${dueLabel(l.daysLeft)} · ${formatDate(l.dueDate)}`, to: '/student/books?tab=loans', loan: l,
	}))
	const ready = data.value.reservations.filter((r) => r.status === 'Accepted').map<AttentionItem>((r) => ({
		key: `r${r.reservationID}`, tone: 'good', icon: 'i-tabler-check', title: r.book.title,
		sub: 'Ready for pickup at the desk', to: '/student/books?tab=reservations',
	}))

	return [...overdue, ...soon, ...ready]
})

// The next streak achievement still ahead of you, so the meter has something to fill towards.
const nextStreak = computed(() => {
	const ahead = (data.value?.achievements ?? [])
		.filter((a) => a.criteria?.metric === 'visitStreak' && a.criteria.threshold > streak.value)
		.sort((a, b) => a.criteria!.threshold - b.criteria!.threshold)[0]

	return ahead ? { name: ahead.name, threshold: ahead.criteria!.threshold } : null
})

const week = computed(() => lastSevenDays(data.value?.visitedDates ?? []))

const tiles = computed(() => [
	{ label: 'My ID', icon: 'i-tabler-id', to: '/student/id' },
	{ label: 'Wishlist', icon: 'i-tabler-heart', to: '/student/wishlist' },
	{ label: 'Suggest', icon: 'i-tabler-bulb', to: '/student/suggest' },
	{ label: 'Facilities', icon: 'i-tabler-device-desktop', to: '/student/facilities' },
])
</script>
