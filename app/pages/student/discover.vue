<template>
	<div>
		<div class="st-in mb-5">
			<h1 class="dashboard-heading text-3xl font-bold text-amber-900">Discover</h1>
			<p class="dashboard-heading mt-1 text-amber-900">Search the catalog and see what's on the shelf right now.</p>
		</div>

		<!-- Phones: the search box lives on the page (wide screens use the one in the top bar) -->
		<div class="st-in relative mb-3 md:hidden" style="animation-delay: 35ms">
			<Icon name="i-lucide-search" class="pointer-events-none absolute left-3.5 top-[13px] h-[18px] w-[18px] text-stone-400" />
			<input v-model="search" type="search" placeholder="Title, author or subject" autocomplete="off" enterkeyhint="search" aria-label="Search books"
				class="h-11 w-full rounded-[13px] border border-transparent bg-stone-100 pl-10 pr-3 text-[16px] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-stone-400 focus:border-accent-500 focus:bg-white focus:ring-[3px] focus:ring-accent-100">
		</div>

		<div class="md:grid md:grid-cols-[230px_minmax(0,1fr)] md:items-start md:gap-8">
			<!-- Filters: chips on phones, a rail on wide screens -->
			<aside class="st-in md:sticky md:top-24" style="animation-delay: 70ms">
				<div class="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:hidden">
					<button type="button" class="h-8 shrink-0 rounded-full border px-3.5 text-[13px] font-medium transition-[transform,background-color,color] duration-150 ease-out active:scale-95"
						:class="availableOnly ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-200 bg-white text-stone-500'" :aria-pressed="availableOnly"
						@click="setParam({ available: availableOnly ? undefined : '1' })">Available now</button>
					<button v-for="s in subjectOptions" :key="s.id" type="button"
						class="h-8 shrink-0 rounded-full border px-3.5 text-[13px] font-medium transition-[transform,background-color,color] duration-150 ease-out active:scale-95"
						:class="subjectID === s.id ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-500'" :aria-pressed="subjectID === s.id"
						@click="setParam({ subject: s.id ? String(s.id) : undefined })">{{ s.name }}</button>
				</div>

				<div class="hidden space-y-5 md:block">
					<div>
						<h3 class="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">Subject</h3>
						<button v-for="s in subjectOptions" :key="s.id" type="button"
							class="flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-[13.5px] transition-colors duration-150"
							:class="subjectID === s.id ? 'bg-accent-100 font-semibold text-accent-600' : 'text-stone-500 hover:bg-stone-100'" :aria-pressed="subjectID === s.id"
							@click="setParam({ subject: s.id ? String(s.id) : undefined })">
							{{ s.name }}<small class="text-[12px] text-stone-400">{{ s.books }}</small>
						</button>
					</div>
					<div>
						<h3 class="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">Availability</h3>
						<button type="button" role="switch" :aria-checked="availableOnly"
							class="flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors duration-150 hover:bg-stone-100"
							@click="setParam({ available: availableOnly ? undefined : '1' })">
							Available now
							<span class="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ease-out" :class="availableOnly ? 'bg-accent-500' : 'bg-stone-200'">
								<span class="absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-[250ms] ease-drawer" :class="availableOnly ? 'translate-x-4' : ''" />
							</span>
						</button>
					</div>
				</div>
			</aside>

			<section class="st-in mt-3 md:mt-0" style="animation-delay: 105ms">
				<div v-if="pending && !data" class="space-y-3" aria-busy="true">
					<div v-for="n in 5" :key="n" class="h-[92px] animate-pulse rounded-2xl bg-stone-200/70" />
				</div>

				<template v-else-if="data">
					<p class="mb-3 px-0.5 text-[12.5px] text-stone-400">{{ data.total }} book{{ data.total === 1 ? '' : 's' }}</p>

					<div :key="resultsKey" class="st-swap transition-opacity duration-150" :class="pending ? 'opacity-60' : ''">
						<StudentEmptyState v-if="!data.data.length" icon="i-lucide-search" title="No matches"
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
							<div class="hidden gap-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
								<StudentBookCard v-for="book in data.data" :key="book.bookID" :book="book" />
							</div>
						</template>
					</div>

					<div v-if="data.last_page > 1" class="mt-5 flex items-center justify-center gap-3">
						<ButtonsButton variant="ghost" size="sm" :disabled="data.current_page <= 1" @click="setParam({ page: String(data.current_page - 1) }, true)">
							<Icon name="i-lucide-chevron-left" class="h-3.5 w-3.5" />Previous
						</ButtonsButton>
						<span class="text-[12.5px] tabular-nums text-stone-400">Page {{ data.current_page }} of {{ data.last_page }}</span>
						<ButtonsButton variant="ghost" size="sm" :disabled="data.current_page >= data.last_page" @click="setParam({ page: String(data.current_page + 1) }, true)">
							Next<Icon name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
						</ButtonsButton>
					</div>
				</template>

				<StudentEmptyState v-else icon="i-lucide-wifi-off" title="Couldn't load the catalog" text="Check your connection and try again.">
					<ButtonsButton @click="refresh()">Try again</ButtonsButton>
				</StudentEmptyState>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { studentService } from '~/services/studentService'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Discover', nav: 'discover', tab: 'discover' })
useHead({ title: 'Discover' })

const route = useRoute()
const router = useRouter()

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
	void router.replace({ query: Object.fromEntries(Object.entries(route.query).filter(([k]) => ['book', 'cart', 'wishlist'].includes(k))) })
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

const { dataVersion } = useStudent()
const { data, pending, refresh } = useLiveAsyncData(
	'student-catalog',
	() => studentService.catalog({ search: q.value, subjectID: subjectID.value || undefined, availableOnly: availableOnly.value, page: page.value, perPage: 24 }),
	{ lazy: true, watch: [q, subjectID, availableOnly, page] },
)
watch(dataVersion, () => { void refresh() })

// A new key restarts the short cross-fade whenever the result set changes.
const resultsKey = computed(() => `${q.value}|${subjectID.value}|${availableOnly.value}|${page.value}`)
</script>
