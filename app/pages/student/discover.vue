<template>
	<div>
		<div class="st-in mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
			<div>
				<h1 class="dashboard-heading text-3xl font-bold text-amber-900">Discover</h1>
				<p class="mt-1 text-[14px] text-stone-500">Search the catalog and see what's on the shelf right now.</p>
			</div>
			<NuxtLink to="/student/suggest"
				class="hidden items-center gap-1.5 text-[13px] font-semibold text-accent-600 hover:underline md:inline-flex">
				<Icon name="i-tabler-bulb" class="h-4 w-4" />Can't find it? Suggest a book
			</NuxtLink>
		</div>

		<!-- Phones: the search box lives on the page (wide screens use the one in the top bar) -->
		<div class="st-in relative mb-3 md:hidden" style="animation-delay: 35ms">
			<Icon name="i-tabler-search" class="pointer-events-none absolute left-3.5 top-[13px] h-[18px] w-[18px] text-stone-400" />
			<input v-model="search" type="search" placeholder="Title, author or subject" autocomplete="off" enterkeyhint="search" aria-label="Search books"
				class="h-11 w-full rounded-[13px] border border-transparent bg-stone-100 pl-10 pr-3 text-[16px] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-stone-400 focus:border-accent-500 focus:bg-white focus:ring-[3px] focus:ring-accent-100">
		</div>

		<!-- From xl up the filters are a panel on the right (nav on the left, books in the middle, filters beside them).
			 Narrower screens have no room for it, so they get the chip toolbar instead. -->
		<div class="xl:grid xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start xl:gap-6">
		<div class="min-w-0">
		<div ref="sentinel" aria-hidden="true" />
		<div class="st-in z-20 -mx-4 mb-4 px-4 py-2.5 md:sticky md:top-[68px] md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 xl:hidden"
			:class="stuck ? 'border-b border-stone-200 bg-amber-50/90 backdrop-blur-sm' : 'border-b border-transparent'"
			style="animation-delay: 70ms">
			<div class="flex items-center gap-3">
				<div class="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)] md:pr-8"
					role="group" aria-label="Filter by subject">
					<button v-for="s in subjectOptions" :key="s.id" type="button" :aria-pressed="subjectID === s.id"
						class="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[13.5px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200"
						:class="subjectID === s.id ? 'bg-accent-500 text-white' : 'bg-accent-50 text-accent-700 hover:bg-accent-100'"
						@click="setParam({ subject: s.id ? String(s.id) : undefined })">
						{{ s.name }}
						<span class="font-data text-[11.5px] font-medium" :class="subjectID === s.id ? 'text-white/75' : 'text-accent-700/60'">{{ s.books }}</span>
					</button>
				</div>

				<button type="button" role="switch" :aria-checked="availableOnly"
					class="flex h-9 shrink-0 items-center gap-2.5 rounded-xl border bg-white pl-3 pr-2 text-[13.5px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200"
					:class="availableOnly ? 'border-emerald-200 text-emerald-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'"
					@click="setParam({ available: availableOnly ? undefined : '1' })">
					<span class="hidden sm:inline">Available now</span>
					<span class="sm:hidden">Available</span>
					<span class="relative h-[20px] w-[34px] shrink-0 rounded-full transition-colors duration-200 ease-out" :class="availableOnly ? 'bg-emerald-600' : 'bg-stone-200'">
						<span class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-[250ms] ease-drawer" :class="availableOnly ? 'translate-x-3.5' : ''" />
					</span>
				</button>
			</div>
		</div>

		<section class="st-in" style="animation-delay: 105ms">
			<div v-if="pending && !data" aria-busy="true">
				<div class="space-y-3 md:hidden">
					<div v-for="n in 5" :key="n" class="h-[92px] animate-pulse rounded-2xl bg-stone-200/70" />
				</div>
				<div class="hidden gap-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
					<div v-for="n in 10" :key="n" class="h-[344px] animate-pulse rounded-[20px] bg-stone-200/60" />
				</div>
			</div>

			<template v-else-if="data">
				<div class="mb-3 flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1 px-0.5">
					<p class="text-[13px] text-stone-500">
						<span class="font-semibold text-stone-800 tabular-nums">{{ data.total }}</span>
						book{{ data.total === 1 ? '' : 's' }}<template v-if="q"> for <span class="font-semibold text-stone-800">“{{ q }}”</span></template><template v-if="activeSubject"> in {{ activeSubject }}</template><template v-if="availableOnly">, on the shelf now</template>
					</p>
					<button v-if="hasFilters" type="button" class="inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent-600 hover:underline" @click="reset">
						<Icon name="i-tabler-x" class="h-3.5 w-3.5" />Clear filters
					</button>
				</div>

				<div :key="resultsKey" class="st-swap transition-opacity duration-150" :class="pending ? 'opacity-60' : ''">
					<StudentEmptyState v-if="!data.data.length" icon="i-tabler-search" title="No matches"
						text="Try another title, or suggest the book to the librarians.">
						<div class="flex gap-2">
							<ButtonsButton v-if="hasFilters" variant="ghost" @click="reset">Clear filters</ButtonsButton>
							<NuxtLink to="/student/suggest"><ButtonsButton>Suggest a book</ButtonsButton></NuxtLink>
						</div>
					</StudentEmptyState>

					<template v-else>
						<div class="overflow-hidden rounded-2xl border border-stone-200 bg-white md:hidden">
							<div v-for="book in data.data" :key="book.bookID" class="border-b border-stone-100 last:border-0">
								<StudentBookRow :book="book" />
							</div>
						</div>
						<div class="hidden gap-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
							<StudentBookCard v-for="book in data.data" :key="book.bookID" :book="book" />
						</div>
					</template>
				</div>

				<div v-if="data.last_page > 1" class="mt-6 flex items-center justify-center gap-3">
					<ButtonsButton variant="ghost" size="sm" :disabled="data.current_page <= 1" @click="setParam({ page: String(data.current_page - 1) }, true)">
						<Icon name="i-tabler-chevron-left" class="h-3.5 w-3.5" />Previous
					</ButtonsButton>
					<span class="text-[12.5px] tabular-nums text-stone-500">Page {{ data.current_page }} of {{ data.last_page }}</span>
					<ButtonsButton variant="ghost" size="sm" :disabled="data.current_page >= data.last_page" @click="setParam({ page: String(data.current_page + 1) }, true)">
						Next<Icon name="i-tabler-chevron-right" class="h-3.5 w-3.5" />
					</ButtonsButton>
				</div>
			</template>

			<StudentEmptyState v-else icon="i-tabler-wifi-off" title="Couldn't load the catalog" text="Check your connection and try again.">
				<ButtonsButton @click="refresh()">Try again</ButtonsButton>
			</StudentEmptyState>
		</section>
		</div>

		<aside class="st-in sticky top-[92px] hidden max-h-[calc(100dvh-116px)] flex-col overflow-hidden rounded-[22px] border border-stone-200 bg-white xl:flex"
			style="animation-delay: 140ms" aria-label="Filters">
			<div class="border-b border-stone-100 p-3">
				<button type="button" role="switch" :aria-checked="availableOnly"
					class="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold transition-colors duration-150 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200"
					:class="availableOnly ? 'text-emerald-700' : 'text-stone-700'"
					@click="setParam({ available: availableOnly ? undefined : '1' })">
					<span>
						Available now
						<span class="block text-[12px] font-normal text-stone-500">Only books with a copy on the shelf</span>
					</span>
					<span class="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ease-out" :class="availableOnly ? 'bg-emerald-600' : 'bg-stone-200'">
						<span class="absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-[250ms] ease-drawer" :class="availableOnly ? 'translate-x-4' : ''" />
					</span>
				</button>
			</div>

			<h2 class="px-6 pb-1.5 pt-4 text-[15px] font-bold text-stone-900">Genres</h2>
			<div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3" role="group" aria-label="Filter by genre">
				<button v-for="s in subjectOptions" :key="s.id" type="button" :aria-pressed="subjectID === s.id"
					class="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[13.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200"
					:class="subjectID === s.id ? 'bg-accent-100 font-semibold text-accent-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'"
					@click="setParam({ subject: s.id ? String(s.id) : undefined })">
					<span class="min-w-0 truncate">{{ s.name }}</span>
					<span class="font-data shrink-0 text-[12px]" :class="subjectID === s.id ? 'text-accent-700/70' : 'text-stone-400'">{{ s.books }}</span>
				</button>
			</div>
		</aside>
		</div>
	</div>
</template>

<script setup lang="ts">
import { studentService } from '~/services/studentService'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Discover', nav: 'discover', tab: 'discover', wide: true })
useHead({ title: 'Discover' })

const route = useRoute()
const router = useRouter()

// Full rows at five across (beside the filter panel) and at three across, and short enough to scan.
const PER_PAGE = 15

/* The URL is the single source of truth: ?q=&subject=&available=1&page= (so filters survive a refresh and the back button). */
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const q = computed(() => str(route.query.q))
const subjectID = computed(() => Number(str(route.query.subject)) || 0)
const availableOnly = computed(() => str(route.query.available) === '1')
const page = computed(() => Number(str(route.query.page)) || 1)
const hasFilters = computed(() => !!(q.value || subjectID.value || availableOnly.value))

function setParam(patch: Record<string, string | undefined>, keepPage = false) {
	void router.replace({ query: { ...route.query, ...(keepPage ? {} : { page: undefined }), ...patch } })
}

function reset() {
	void router.replace({ query: Object.fromEntries(Object.entries(route.query).filter(([k]) => ['book', 'cart'].includes(k))) })
}

// Phones type here; the query updates a beat after the last keystroke.
const search = ref(q.value)
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
	clearTimeout(timer)
	timer = setTimeout(() => setParam({ q: value.trim() || undefined }), 250)
})
watch(q, (value) => { if (value !== search.value.trim()) search.value = value })
onBeforeUnmount(() => clearTimeout(timer))

const { data: subjectData } = useLiveAsyncData('student-subjects', () => studentService.subjects(), { lazy: true })
const subjectOptions = computed(() => {
	const list = subjectData.value?.subjects ?? []
	return [{ id: 0, name: 'All', books: list.reduce((sum, s) => sum + s.books, 0) }, ...list.map((s) => ({ id: s.subjectID, name: s.name, books: s.books }))]
})
const activeSubject = computed(() => (subjectID.value ? subjectOptions.value.find((s) => s.id === subjectID.value)?.name : null))

const { dataVersion } = useStudent()
const { data, pending, refresh } = useLiveAsyncData(
	'student-catalog',
	() => studentService.catalog({ search: q.value, subjectID: subjectID.value || undefined, availableOnly: availableOnly.value, page: page.value, perPage: PER_PAGE }),
	{ lazy: true, watch: [q, subjectID, availableOnly, page] },
)
watch(dataVersion, () => { void refresh() })

// Paging happens at the bottom of the list; bring the reader back up to the first book of the new page.
watch(page, () => {
	if (!sentinel.value) return
	const top = sentinel.value.getBoundingClientRect().top + window.scrollY - 76
	if (window.scrollY > top) window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
})

// A new key restarts the short cross-fade whenever the result set changes.
const resultsKey = computed(() => `${q.value}|${subjectID.value}|${availableOnly.value}|${page.value}`)

/* The toolbar gets a backing only once it's actually stuck under the top bar. */
const sentinel = ref<HTMLElement | null>(null)
const stuck = ref(false)
let observer: IntersectionObserver | undefined
onMounted(() => {
	if (!sentinel.value) return
	observer = new IntersectionObserver(([entry]) => { stuck.value = !entry!.isIntersecting }, { rootMargin: '-69px 0px 0px 0px' })
	observer.observe(sentinel.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>
