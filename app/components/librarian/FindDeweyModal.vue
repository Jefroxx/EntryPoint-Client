<template>
	<LibrarianModalShell :open="open" size="xl" :title="TITLES[phase]" :subtitle="SUBTITLES[phase]" :busy="phase === 'running' || phase === 'accepting'" @close="stopAndClose">
		<!-- 1. What is about to happen. -->
		<div v-if="phase === 'intro'" class="space-y-4">
			<div v-if="loadingList" class="flex items-center gap-2 text-[14px] text-stone-500">
				<Icon name="i-tabler-loader-2" class="h-4 w-4 animate-spin" />Counting the books…
			</div>
			<template v-else>
				<div class="rounded-xl bg-stone-50 px-4 py-3">
					<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Books without an accepted Dewey number</p>
					<p class="text-[26px] font-bold text-stone-900">{{ total }}</p>
				</div>
				<p class="text-[14px] leading-snug text-stone-600">
					First, each book is looked up by its ISBN in the Library of Congress catalogue, then Open Library. Then you get <b class="text-stone-800">the list of every book still waiting</b>,
					each with a number to check: the one the catalogue found, or the guess from its category.
					Edit any number that is wrong, tick the ones you are happy with, and accept them all at once.
				</p>
				<p class="text-[13px] leading-snug text-stone-500">
					<b class="text-stone-700">Nothing is saved until you accept.</b> The lookup takes a moment per book, so a long list takes a few minutes. You can stop it early and still get the list.
					Or skip the lookup and go straight to the list.
				</p>
			</template>
		</div>

		<!-- 2. Looking the books up (nothing is saved). -->
		<div v-else-if="phase === 'running'" class="space-y-4">
			<div class="rounded-xl bg-stone-50 px-4 py-4">
				<div class="flex items-baseline justify-between">
					<p class="text-[15px] font-semibold text-stone-900">{{ checked }} of {{ books.length }} looked up</p>
					<p class="text-[13px] tabular-nums text-stone-500">{{ Math.round((checked / Math.max(1, books.length)) * 100) }}%</p>
				</div>
				<div class="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
					<div class="h-full rounded-full bg-accent-500 transition-[width] duration-200" :style="{ width: `${(checked / Math.max(1, books.length)) * 100}%` }" />
				</div>
				<p class="mt-2 truncate text-[13px] text-stone-500">{{ current ?? '…' }}</p>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-xl bg-emerald-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-emerald-800">Numbers found</p><p class="text-[22px] font-bold text-emerald-800">{{ countOf('catalogue') }}</p></div>
				<div class="rounded-xl bg-stone-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Not found</p><p class="text-[22px] font-bold text-stone-900">{{ checked - countOf('catalogue') }}</p></div>
			</div>
		</div>

		<!-- 3. Every book still waiting: edit a number, tick the ones to accept. -->
		<div v-else-if="phase === 'review'" class="space-y-3">
			<p v-if="stopped" class="rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">Stopped early: {{ books.length - checked }} books were not looked up, so they show their category guess.</p>

			<!-- Find a book in the list: by title, author, ISBN or the number it has now. -->
			<LibrarianSearchInput id="dewey-search" v-model="search" placeholder="Search title, author, ISBN or number" />

			<!-- Which of them to show. -->
			<div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Show">
				<button v-for="f in FILTERS" :key="f.key" type="button"
					class="rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
					:class="filter === f.key ? 'bg-accent-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'"
					@click="filter = f.key; page = 1">
					{{ f.label }} <span class="opacity-80">({{ f.key === 'all' ? rows.length : countOf(f.key) }})</span>
				</button>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-2 text-[13.5px] text-stone-600">
				<span><b class="text-stone-900">{{ tickedCount }}</b> ticked to accept</span>
				<div class="flex gap-1.5">
					<ButtonsButton variant="ghost" size="sm" :disabled="!tickableShown" @click="tickShown(true)">Tick all shown ({{ tickableShown }})</ButtonsButton>
					<ButtonsButton variant="ghost" size="sm" :disabled="!tickedCount" @click="untickAll">Untick all</ButtonsButton>
				</div>
			</div>

			<div v-if="shownRows.length" class="overflow-hidden rounded-xl border border-stone-200">
				<div v-for="row in shownRows" :key="row.uuid" class="flex items-center gap-3 border-b border-stone-100 px-3.5 py-2.5 last:border-0" :class="row.ticked ? 'bg-accent-50/40' : ''">
					<input v-model="row.ticked" type="checkbox" class="h-[18px] w-[18px] shrink-0 cursor-pointer accent-accent-500 disabled:cursor-not-allowed disabled:opacity-40"
						:disabled="!isValid(row.number)" :aria-label="`Accept the number for ${row.title}`" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-[14px] font-semibold text-stone-900">{{ row.title }}</p>
						<p class="flex flex-wrap items-center gap-x-2 text-[12px] text-stone-500">
							<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="ORIGIN[row.origin].pill">{{ ORIGIN[row.origin].label }}</span>
							<span class="truncate">{{ row.origin === 'catalogue' ? row.source : row.authors || row.subject || '' }}</span>
						</p>
					</div>
					<div class="shrink-0">
						<input v-model="row.number" type="text" inputmode="decimal" maxlength="14" placeholder="e.g. 005.1" aria-label="Dewey number"
							class="font-data h-10 w-[112px] rounded-[10px] border bg-white px-2.5 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
							:class="row.number.trim() && !isValid(row.number) ? 'border-red-400 bg-red-50' : 'border-stone-200'"
							@input="onEdit(row)" />
					</div>
				</div>
			</div>
			<p v-else class="rounded-xl border border-stone-200 px-4 py-6 text-center text-[14px] text-stone-500">{{ search.trim() ? 'No book matches that search.' : 'Nothing in this group.' }}</p>
			<LibrarianListPager v-model:page="page" :total="filteredRows.length" :page-size="PER_PAGE" />

			<p class="text-[12.5px] leading-snug text-stone-500">
				A number needs three digits, then an optional decimal (like <span class="font-data">005.133</span>). A row can be ticked once it has one.
				Leaving a row unticked keeps that book unchecked.
			</p>
		</div>

		<!-- 4. Saving the accepted ones. -->
		<div v-else-if="phase === 'accepting'" class="space-y-4">
			<div class="rounded-xl bg-stone-50 px-4 py-4">
				<p class="text-[15px] font-semibold text-stone-900">{{ saved }} of {{ toSave.length }} saved</p>
				<div class="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
					<div class="h-full rounded-full bg-accent-500 transition-[width] duration-200" :style="{ width: `${(saved / Math.max(1, toSave.length)) * 100}%` }" />
				</div>
			</div>
		</div>

		<!-- 5. Done. -->
		<div v-else class="space-y-3">
			<div class="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
				<Icon name="i-tabler-circle-check" class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
				<div>
					<p class="text-[15px] font-semibold text-stone-900">{{ saved }} {{ saved === 1 ? 'Dewey number' : 'Dewey numbers' }} accepted</p>
					<p class="text-[13px] text-stone-600">Students now see them, and the shelf labels fill in.</p>
				</div>
			</div>
			<p v-if="failedSaves.length" class="rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] leading-snug text-red-800">
				{{ failedSaves.length }} could not be saved: {{ failedSaves.slice(0, 3).join(', ') }}<span v-if="failedSaves.length > 3"> and {{ failedSaves.length - 3 }} more</span>. They are still unchecked.
			</p>
			<p v-if="remaining > 0" class="text-[13.5px] text-stone-600">{{ remaining }} {{ remaining === 1 ? 'book is' : 'books are' }} still waiting. Open this again to keep going.</p>
		</div>

		<template #footer>
			<template v-if="phase === 'intro'">
				<ButtonsButton variant="ghost" @click="emit('close')">Cancel</ButtonsButton>
				<ButtonsButton variant="ghost" :disabled="loadingList || !total" @click="skipLookup">Skip the lookup</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="loadingList || !total" @click="start">
					<Icon name="i-tabler-search" class="h-3.5 w-3.5" />Look up {{ total }} {{ total === 1 ? 'book' : 'books' }}
				</ButtonsButton>
			</template>
			<template v-else-if="phase === 'running'">
				<ButtonsButton variant="ghost" @click="stopRequested = true">Stop and show the list</ButtonsButton>
			</template>
			<template v-else-if="phase === 'review'">
				<ButtonsButton variant="ghost" @click="emit('close')">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="!tickedCount" @click="accept">
					<Icon name="i-tabler-check" class="h-3.5 w-3.5" />Accept {{ tickedCount }} {{ tickedCount === 1 ? 'number' : 'numbers' }}
				</ButtonsButton>
			</template>
			<template v-else-if="phase === 'done'">
				<ButtonsButton variant="primary" @click="emit('close')">Done</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { DEWEY_SOURCE_LABEL, librarianService, type DeweySource } from '~/services/librarianService'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
	(e: 'close'): void
	/** Some numbers were accepted: the books list should refresh. */
	(e: 'changed'): void
}>()

type Phase = 'intro' | 'running' | 'review' | 'accepting' | 'done'
/** Where a row's number came from: a catalogue match, the guess from the book's category, or nothing at all. */
type Origin = 'catalogue' | 'guess' | 'none'
interface Row {
	uuid: string; title: string; isbn: string | null; authors: string; subject: string
	number: string; origin: Origin; source: string; ticked: boolean
}

const TITLES: Record<Phase, string> = {
	intro: 'Accept Dewey Numbers', running: 'Looking Up Dewey Numbers', review: 'Accept Dewey Numbers', accepting: 'Saving…', done: 'Dewey Numbers Accepted',
}
const SUBTITLES: Record<Phase, string> = {
	intro: 'Look up the books waiting for a number, then accept many at once.',
	running: 'Looking each book up by its ISBN. Nothing is saved yet.',
	review: 'Edit any number, tick the right ones, then accept them together.',
	accepting: 'Saving the numbers you accepted.',
	done: 'All done.',
}
const ORIGIN: Record<Origin, { label: string; pill: string }> = {
	catalogue: { label: 'Found', pill: 'bg-emerald-100 text-emerald-800' },
	guess: { label: 'Category guess', pill: 'bg-amber-100 text-amber-800' },
	none: { label: 'No number', pill: 'bg-stone-200 text-stone-600' },
}
const FILTERS: { key: 'all' | Origin; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'catalogue', label: 'Found' },
	{ key: 'guess', label: 'Category guess' },
	{ key: 'none', label: 'No number' },
]

const PER_PAGE = 7
const PAUSE_MS = 250   // a short breath between lookups, so the catalogues are not hammered
const DEWEY = /^\d{3}(\.\d{1,10})?$/
const isValid = (value: string) => DEWEY.test(value.trim())

const phase = ref<Phase>('intro')
const loadingList = ref(false)
const total = ref(0)
const books = ref<{ uuid: string; title: string; isbn: string | null; authors: string; subject: string; guess: string }[]>([])
const checked = ref(0)
const current = ref<string | null>(null)
const rows = ref<Row[]>([])
const stopRequested = ref(false)
const stopped = ref(false)
const filter = ref<'all' | Origin>('all')
const page = ref(1)

const toSave = ref<Row[]>([])
const saved = ref(0)
const failedSaves = ref<string[]>([])
const remaining = computed(() => Math.max(0, total.value - saved.value))

const countOf = (origin: Origin) => rows.value.filter((r) => r.origin === origin).length
const search = ref('')
// The group chosen above the list, narrowed by whatever is typed in the search box.
const filteredRows = computed(() => {
	const term = search.value.trim().toLowerCase()
	return rows.value.filter((r) =>
		(filter.value === 'all' || r.origin === filter.value)
		&& (!term || [r.title, r.authors, r.subject, r.isbn ?? '', r.number].some((field) => field.toLowerCase().includes(term))))
})
watch(search, () => { page.value = 1 })
const shownRows = computed(() => filteredRows.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))
const tickedCount = computed(() => rows.value.filter((r) => r.ticked && isValid(r.number)).length)
const tickableShown = computed(() => filteredRows.value.filter((r) => !r.ticked && isValid(r.number)).length)

function tickShown(value: boolean) {
	filteredRows.value.forEach((r) => { if (isValid(r.number)) r.ticked = value })
}
const untickAll = () => rows.value.forEach((r) => { r.ticked = false })

// Typing a number: a row that no longer has a valid one can't stay ticked.
function onEdit(row: Row) {
	if (!isValid(row.number)) row.ticked = false
}

// Opening it counts the books that still need a number.
watch(() => props.open, async (isOpen) => {
	if (!isOpen) return
	phase.value = 'intro'
	books.value = []
	rows.value = []
	toSave.value = []
	failedSaves.value = []
	checked.value = 0
	saved.value = 0
	stopRequested.value = false
	stopped.value = false
	filter.value = 'all'
	search.value = ''
	page.value = 1
	loadingList.value = true
	try {
		total.value = (await librarianService.fetchDeweyReview({ perPage: 1 })).needsReview
	} catch {
		total.value = 0
	} finally {
		loadingList.value = false
	}
})

/** Every book still without an accepted number (with the category guess it has now), a page of 100 at a time. */
async function loadAllBooks() {
	const all: typeof books.value = []
	for (let p = 1; ; p++) {
		const res = await librarianService.fetchDeweyReview({ perPage: 100, page: p })
		all.push(...res.books.data.map((b) => ({
			uuid: b.uuid, title: b.title, isbn: b.isbn, authors: b.authors.join(', '), subject: b.subject ?? '', guess: b.deweyNumber ?? '',
		})))
		if (p >= res.books.last_page) break
	}
	return all
}

/** Every waiting book as a row: its category guess, or nothing, until a lookup finds better. */
function buildRows() {
	rows.value = books.value.map((b) => ({
		uuid: b.uuid, title: b.title, isbn: b.isbn, authors: b.authors, subject: b.subject,
		number: b.guess, origin: b.guess ? 'guess' : 'none', source: '', ticked: false,
	}))
}

async function skipLookup() {
	loadingList.value = true
	try {
		books.value = await loadAllBooks()
		buildRows()
		phase.value = 'review'
	} finally {
		loadingList.value = false
	}
}

// Looks each ISBN up. This saves nothing: a number the catalogue has replaces the guess in that row, ticked.
async function start() {
	phase.value = 'running'
	try {
		books.value = await loadAllBooks()
	} catch {
		books.value = []
	}
	buildRows()

	for (const [i, book] of books.value.entries()) {
		if (stopRequested.value) { stopped.value = true; break }
		current.value = book.title

		if (book.isbn) {
			try {
				const result = await librarianService.lookupIsbnDewey(book.isbn)
				if (result.found && result.deweyNumber) {
					const row = rows.value[i]!
					row.number = result.deweyNumber
					row.origin = 'catalogue'
					row.source = `Found in ${result.source ? DEWEY_SOURCE_LABEL[result.source as DeweySource] : 'a library catalogue'}`
					row.ticked = true
				}
			} catch {
				// Couldn't reach the catalogues for this one: it keeps its guess, and can still be edited by hand.
			}
			await new Promise((resolve) => setTimeout(resolve, PAUSE_MS))
		}

		checked.value++
	}

	current.value = null
	phase.value = 'review'
}

// Saves the ticked numbers (each as shown, counted as accepted), one request each.
async function accept() {
	toSave.value = rows.value.filter((r) => r.ticked && isValid(r.number))
	saved.value = 0
	failedSaves.value = []
	phase.value = 'accepting'

	for (const row of toSave.value) {
		try {
			await librarianService.setBookDewey(row.uuid, row.number.trim())
			saved.value++
		} catch {
			failedSaves.value.push(row.title)
		}
	}

	phase.value = 'done'
	if (saved.value) emit('changed')
}

// Closing while it works stops after the book in hand; the lookups already done can still be reviewed.
function stopAndClose() {
	if (phase.value === 'running') { stopRequested.value = true; return }
	if (phase.value === 'accepting') return
	emit('close')
}
</script>
