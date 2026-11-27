<template>
	<!-- Check Details: the online catalogues are asked for what each book's record lacks (books brought in from the
		 accession record never went through Add Book's scan). Nothing is saved until the librarian accepts, and only
		 empty fields are filled. All in this one window. -->
	<LibrarianModalShell :open="open" size="xl" fixed-height :title="TITLES[phase]" :subtitle="subtitle" :busy="phase === 'running' || phase === 'saving'" @close="stopOrClose">
		<!-- 1. How many to check now. -->
		<div v-if="phase === 'intro'" class="mx-auto max-w-[640px] space-y-4">
			<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
				<div class="rounded-xl bg-stone-50 px-4 py-3">
					<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Books still to check</p>
					<p class="text-[26px] font-bold tabular-nums text-stone-900">{{ remaining === null ? '…' : formatCount(remaining) }}</p>
				</div>
				<label class="block">
					<span class="mb-1.5 block text-[13px] font-semibold text-stone-700">Area of the library</span>
					<select v-model="area" class="h-[42px] w-full rounded-xl border border-stone-200 bg-white px-3 text-[14.5px] text-stone-800 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200">
						<option value="">All areas</option>
						<option v-for="(label, key) in LIBRARY_AREAS" :key="key" :value="key">{{ label }}</option>
					</select>
				</label>
			</div>

			<div>
				<p class="mb-1.5 text-[13px] font-semibold text-stone-700">How many to check now</p>
				<div class="flex flex-wrap gap-1.5" role="group" aria-label="How many to check now">
					<button v-for="size in BATCHES" :key="size" type="button"
						class="rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
						:class="batch === size ? 'bg-accent-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'"
						@click="batch = size">
						{{ size === 0 ? 'All' : size }}
					</button>
				</div>
				<p class="mt-1.5 text-[12.5px] text-stone-500">Each book takes a few seconds, so {{ batch === 0 || batch > 100 ? 'a big batch takes a while; you can stop it and still review what was found' : `${batch} books take about ${Math.max(1, Math.round((batch * 3) / 60 / CONCURRENCY))} minutes` }}.</p>
			</div>

			<div class="space-y-1.5 rounded-xl border border-stone-200 px-4 py-3 text-[13.5px] leading-relaxed text-stone-600">
				<p><b class="text-stone-800">With an ISBN:</b> the book is looked up by it in the Library of Congress, Open Library and Google Books, as Add Book does.</p>
				<p><b class="text-stone-800">Without one:</b> it is searched by title and author in Open Library, in the edition of the year the record gives. Its ISBN is then looked up the same way.</p>
				<p><b class="text-stone-800">Nothing is saved until you accept.</b> Only empty fields are filled; nothing a librarian typed is replaced. Every book checked leaves this list, found or not.</p>
			</div>
		</div>

		<!-- 2. Checking (nothing is saved). -->
		<div v-else-if="phase === 'running'" class="mx-auto max-w-[640px] space-y-4" aria-live="polite">
			<div class="rounded-xl bg-stone-50 px-4 py-4">
				<div class="flex items-baseline justify-between">
					<p class="text-[15px] font-semibold text-stone-900">{{ formatCount(results.length) }} of {{ formatCount(books.length) }} checked</p>
					<p class="text-[13px] tabular-nums text-stone-500">{{ percent }}%</p>
				</div>
				<div class="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
					<div class="h-full rounded-full bg-accent-500 transition-[width] duration-200" :style="{ width: `${percent}%` }" />
				</div>
				<p class="mt-2 truncate text-[13px] text-stone-500">{{ current || '…' }}</p>
			</div>
			<div class="grid grid-cols-3 gap-3">
				<div class="rounded-xl bg-emerald-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-emerald-800">By ISBN</p><p class="text-[22px] font-bold tabular-nums text-emerald-800">{{ count('isbn') }}</p></div>
				<div class="rounded-xl bg-amber-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-amber-800">By title</p><p class="text-[22px] font-bold tabular-nums text-amber-800">{{ count('title') }}</p></div>
				<div class="rounded-xl bg-stone-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Nothing found</p><p class="text-[22px] font-bold tabular-nums text-stone-900">{{ count('none') }}</p></div>
			</div>
			<p class="text-center text-[13px] text-stone-500">Closing this window stops after the books in hand; what was found can still be reviewed.</p>
		</div>

		<!-- 3. Review: tick what is right, then save. -->
		<div v-else-if="phase === 'review'" class="space-y-3">
			<p v-if="stopped" class="rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">Stopped early: {{ formatCount(books.length - results.length) }} books were not checked and stay on the list for next time.</p>

			<div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Show">
				<button v-for="f in FILTERS" :key="f.key" type="button"
					class="rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
					:class="filter === f.key ? 'bg-accent-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'"
					@click="filter = f.key; page = 1">
					{{ f.label }} <span class="opacity-80">({{ f.key === 'all' ? rows.length : count(f.key) }})</span>
				</button>
				<span class="flex-1" />
				<button type="button" class="text-[13px] font-semibold text-accent-600 hover:underline" @click="tickShown(true)">Tick all shown</button>
				<span class="text-stone-300">·</span>
				<button type="button" class="text-[13px] font-semibold text-stone-500 hover:underline" @click="tickShown(false)">Untick all shown</button>
			</div>

			<ul class="divide-y divide-stone-100 rounded-xl border border-stone-200">
				<li v-for="row in shownRows" :key="row.book.uuid" class="flex gap-3 px-4 py-3">
					<input :id="`chk-${row.book.uuid}`" v-model="row.ticked" type="checkbox" :disabled="!canTick(row)"
						class="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 text-accent-600 focus:ring-accent-300 disabled:opacity-40" />
					<div class="min-w-0 flex-1 space-y-1.5">
						<label :for="`chk-${row.book.uuid}`" class="block">
							<span class="text-[14.5px] font-semibold text-stone-900">{{ row.book.title }}</span>
							<span class="block text-[12.5px] text-stone-500">{{ [row.book.authors.join(', ') || 'No author', row.book.publicationYear, areaName(row.book.areaOfLibrary)].filter(Boolean).join(' · ') }}</span>
						</label>

						<template v-if="row.result.found && row.result.matched">
							<p class="flex flex-wrap items-center gap-1.5 text-[12.5px] text-stone-600">
								<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="row.result.matchedBy === 'isbn' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
									{{ row.result.matchedBy === 'isbn' ? 'By ISBN' : 'By title & author' }}
								</span>
								<span v-if="row.result.titleAgrees === false" class="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">Different title</span>
								<span v-if="row.result.yearAgrees === true" class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Year agrees</span>
								<span v-else-if="row.result.yearAgrees === false" class="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">Different year</span>
								<span class="min-w-0">Found: <i>{{ row.result.matched.title }}</i>{{ row.result.matched.authors.length ? ` by ${row.result.matched.authors.slice(0, 2).join(', ')}` : '' }}{{ row.result.matched.publisher ? `, ${row.result.matched.publisher}` : '' }}{{ row.result.matched.year ? ` ${row.result.matched.year}` : '' }}</span>
							</p>
							<p v-if="row.result.isbnTakenBy" class="text-[12.5px] text-red-600">Its ISBN is already on "{{ row.result.isbnTakenBy }}", so it isn't added here.</p>
							<div v-if="fillChips(row).length" class="flex flex-wrap gap-1.5">
								<span v-for="chip in fillChips(row)" :key="chip" class="rounded-md bg-stone-100 px-2 py-0.5 text-[12px] text-stone-700">{{ chip }}</span>
							</div>
							<p v-else-if="!needsDewey(row)" class="text-[12.5px] text-stone-500">The record already has everything this catalogue knows.</p>
						</template>
						<p v-else class="text-[12.5px] text-stone-500">{{ row.result.reason || 'Nothing found.' }} Fill it in by editing the book.</p>

						<!-- The Dewey number: what the catalogue found, or typed here when none was found. -->
						<div v-if="needsDewey(row)" class="flex flex-wrap items-center gap-2">
							<label :for="`dewey-${row.book.uuid}`" class="text-[12.5px] font-semibold text-stone-700">Dewey no.</label>
							<input :id="`dewey-${row.book.uuid}`" v-model="row.dewey" type="text" inputmode="decimal" maxlength="14" placeholder="e.g. 005.1"
								class="font-data h-8 w-[120px] rounded-lg border px-2 text-[13px] outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
								:class="row.dewey && !DEWEY_FORMAT.test(row.dewey.trim()) ? 'border-red-400 bg-red-50' : 'border-stone-200'"
								@input="onDeweyInput(row)" />
							<span class="text-[12px] text-stone-500">{{ row.result.fills?.deweyNumber ? 'Found in a library catalogue' : 'None found; type it if you know it' }}</span>
						</div>
					</div>
				</li>
				<li v-if="!shownRows.length" class="px-4 py-8 text-center text-[13.5px] text-stone-500">Nothing to show here.</li>
			</ul>

			<LibrarianPagination v-if="filteredRows.length > PER_PAGE" :shown="shownRows.length" :total="filteredRows.length" noun="books"
				:page="page" :last-page="Math.ceil(filteredRows.length / PER_PAGE)" @change="page = $event" />
		</div>

		<!-- 4. Saving. -->
		<div v-else-if="phase === 'saving'" class="flex h-full flex-col items-center justify-center gap-3 py-10 text-center" aria-live="polite">
			<span class="h-7 w-7 animate-spin rounded-full border-[3px] border-stone-200 border-t-accent-500" />
			<p class="text-[15px] font-semibold text-stone-800">Saving…</p>
		</div>

		<!-- 5. Done. -->
		<div v-else-if="phase === 'done'" class="mx-auto max-w-[640px] space-y-3.5">
			<div class="flex items-start gap-3 rounded-xl border px-4 py-3" :class="saveError ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60'">
				<Icon :name="saveError ? 'i-tabler-alert-triangle' : 'i-tabler-circle-check'" class="mt-0.5 h-5 w-5 shrink-0" :class="saveError ? 'text-amber-600' : 'text-emerald-600'" />
				<div class="min-w-0">
					<p class="text-[15px] font-semibold text-stone-900">{{ formatCount(summary.updated) }} {{ summary.updated === 1 ? 'book' : 'books' }} filled in, {{ formatCount(summary.checked) }} checked</p>
					<p v-if="saveError" class="text-[13.5px] text-stone-700">Saving stopped: {{ saveError }} What was saved stays saved; check the rest again.</p>
					<p v-else class="text-[13.5px] text-stone-600">Checked books won't be offered again. {{ remainingAfter ? `${formatCount(remainingAfter)} still to check.` : 'Every book has been checked.' }}</p>
				</div>
			</div>
			<p v-if="summary.refused.length" class="text-[13px] text-stone-600">The ISBN found for {{ summary.refused.length === 1 ? 'one book' : `${summary.refused.length} books` }} was already another book's, so it wasn't added: {{ summary.refused.slice(0, 5).join(', ') }}{{ summary.refused.length > 5 ? '…' : '' }}.</p>
		</div>

		<template #footer>
			<template v-if="phase === 'intro'">
				<ButtonsButton variant="ghost" @click="emit('close')">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="!remaining" @click="start">
					<Icon name="i-tabler-world-search" class="h-3.5 w-3.5" />Check {{ batch === 0 ? 'All' : formatCount(Math.min(batch, remaining ?? 0)) }} {{ (batch === 0 ? remaining : Math.min(batch, remaining ?? 0)) === 1 ? 'Book' : 'Books' }}
				</ButtonsButton>
			</template>
			<template v-else-if="phase === 'running'">
				<ButtonsButton variant="ghost" @click="stopRequested = true">
					<Icon name="i-tabler-player-stop" class="h-3.5 w-3.5" />{{ stopRequested ? 'Stopping…' : 'Stop and Review' }}
				</ButtonsButton>
			</template>
			<template v-else-if="phase === 'review'">
				<span class="mr-auto text-[13px] text-stone-500">{{ formatCount(tickedCount) }} ticked</span>
				<ButtonsButton variant="primary" @click="save">
					<Icon name="i-tabler-check" class="h-3.5 w-3.5" />Save {{ formatCount(tickedCount) }} and Finish
				</ButtonsButton>
			</template>
			<template v-else-if="phase === 'done'">
				<ButtonsButton variant="primary" @click="emit('close')">Done</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { LIBRARY_AREAS, librarianService, type DetailsCheckResult, type DetailsFills, type DetailsQueueBook } from '~/services/librarianService'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'changed'): void }>()

type Phase = 'intro' | 'running' | 'review' | 'saving' | 'done'
type Kind = 'isbn' | 'title' | 'none'
interface Row { book: DetailsQueueBook; result: DetailsCheckResult; ticked: boolean; dewey: string }

const TITLES: Record<Phase, string> = { intro: 'Check Book Details', running: 'Checking Books', review: 'Review What Was Found', saving: 'Saving', done: 'Check Finished' }
const BATCHES = [25, 100, 250, 0]
const FILTERS: { key: 'all' | Kind; label: string }[] = [
	{ key: 'all', label: 'All' }, { key: 'isbn', label: 'By ISBN' }, { key: 'title', label: 'By title' }, { key: 'none', label: 'Nothing found' },
]
const DEWEY_FORMAT = /^\d{3}(\.\d{1,10})?$/
// Two books at a time: quicker, and still gentle with the free catalogues.
const CONCURRENCY = 2
const PER_PAGE = 15

const phase = ref<Phase>('intro')
const remaining = ref<number | null>(null)
const area = ref('')
const batch = ref(100)
const books = ref<DetailsQueueBook[]>([])
const results = ref<Row[]>([])
const current = ref('')
const stopRequested = ref(false)
const stopped = ref(false)
const filter = ref<'all' | Kind>('all')
const page = ref(1)
const saveError = ref('')
const summary = reactive({ updated: 0, checked: 0, refused: [] as string[] })
const remainingAfter = ref(0)

const formatCount = (n: number) => n.toLocaleString('en-US')
const areaName = (key: string | null) => (key ? LIBRARY_AREAS[key] ?? key : '')
const percent = computed(() => Math.round((results.value.length / Math.max(1, books.value.length)) * 100))
const subtitle = computed(() => (phase.value === 'intro' ? 'Fill in what imported books are missing from the online catalogues.' : area.value ? areaName(area.value) : 'All areas'))

const kindOf = (r: Row): Kind => (!r.result.found ? 'none' : r.result.matchedBy === 'isbn' ? 'isbn' : 'title')
const count = (kind: Kind) => results.value.filter((r) => kindOf(r) === kind).length
const rows = computed(() => results.value)
const filteredRows = computed(() => rows.value.filter((r) => filter.value === 'all' || kindOf(r) === filter.value))
const shownRows = computed(() => filteredRows.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))
const tickedCount = computed(() => rows.value.filter((r) => r.ticked).length)

// The Dewey number is asked for when the book has none that was checked.
const needsDewey = (r: Row) => !r.book.callNumber || r.book.deweyStatus === 'needs_review'
const validDewey = (r: Row) => DEWEY_FORMAT.test(r.dewey.trim())
const hasFills = (r: Row) => Object.keys(r.result.fills ?? {}).some((k) => k !== 'deweyNumber' && k !== 'deweySource')
const canTick = (r: Row) => hasFills(r) || (needsDewey(r) && validDewey(r))

function fillChips(r: Row): string[] {
	const f = r.result.fills ?? {}
	return [
		f.isbn && `ISBN ${f.isbn}`,
		f.authors?.length && `Author ${f.authors.slice(0, 2).join(', ')}`,
		f.publisher && `Publisher ${f.publisher}`,
		f.publicationYear && `Year ${f.publicationYear}`,
		f.pageCount && `${f.pageCount} pages`,
		f.edition && `Edition ${f.edition}`,
		f.volume && `Volume ${f.volume}`,
		f.coverImageURL && 'Cover picture',
	].filter(Boolean) as string[]
}

function onDeweyInput(r: Row) {
	if (validDewey(r)) r.ticked = true
	else if (!hasFills(r)) r.ticked = false
}

function tickShown(value: boolean) {
	filteredRows.value.forEach((r) => { r.ticked = value && canTick(r) })
}

async function loadRemaining() {
	remaining.value = null
	try {
		remaining.value = (await librarianService.fetchDetailsQueue({ area: area.value || undefined, perPage: 1 })).remaining
	} catch {
		remaining.value = 0
	}
}
watch(area, loadRemaining)

/** The books to check, a page of 250 at a time, up to the batch size. */
async function loadBooks(limit: number) {
	const out: DetailsQueueBook[] = []
	for (let p = 1; out.length < limit; p++) {
		const res = await librarianService.fetchDetailsQueue({ area: area.value || undefined, perPage: 250, page: p })
		out.push(...res.books.data)
		if (p >= res.books.last_page) break
	}
	return out.slice(0, limit)
}

async function start() {
	phase.value = 'running'
	stopRequested.value = false
	stopped.value = false
	results.value = []
	try {
		books.value = await loadBooks(batch.value === 0 ? Number.MAX_SAFE_INTEGER : batch.value)
	} catch {
		books.value = []
	}

	let next = 0
	const worker = async () => {
		while (next < books.value.length && !stopRequested.value) {
			const book = books.value[next++]!
			current.value = book.title
			let result: DetailsCheckResult
			try {
				result = await librarianService.checkBookDetails(book.uuid)
			} catch (e) {
				result = { bookUuid: book.uuid, found: false, reason: apiErrorMessage(e, "The catalogues couldn't be reached.") }
			}
			// Ticked from the start only when it is a sure match: the titles agree, and it was found by ISBN or by title
			// with a year that doesn't disagree. (A mistyped ISBN can be another book's real one: its title gives it away.)
			const sure = result.found && result.titleAgrees !== false && (result.matchedBy === 'isbn' || result.yearAgrees !== false)
			const row: Row = { book, result, ticked: false, dewey: result.fills?.deweyNumber ?? '' }
			row.ticked = sure && canTick(row)
			results.value.push(row)
		}
	}
	await Promise.all(Array.from({ length: CONCURRENCY }, worker))

	stopped.value = stopRequested.value && results.value.length < books.value.length
	current.value = ''
	filter.value = 'all'
	page.value = 1
	phase.value = 'review'
}

/** Saves the ticked books, and marks every book that was checked (ticked or not) so it isn't offered again. */
async function save() {
	phase.value = 'saving'
	saveError.value = ''
	Object.assign(summary, { updated: 0, checked: 0, refused: [] })

	const items = rows.value.filter((r) => r.ticked && canTick(r)).map((r) => {
		const fills: DetailsFills = { ...(r.result.fills ?? {}) }
		if (needsDewey(r) && validDewey(r)) {
			// A number changed (or typed) here is the librarian's; one left as found keeps its catalogue.
			if (r.dewey.trim() !== r.result.fills?.deweyNumber) fills.deweySource = 'manual'
			fills.deweyNumber = r.dewey.trim()
		} else {
			delete fills.deweyNumber
			delete fills.deweySource
		}
		if (r.result.isbnTakenBy) delete fills.isbn
		return { book: r.book.uuid, fills }
	})
	const checked = rows.value.map((r) => r.book.uuid)

	try {
		for (let i = 0; i < Math.max(items.length, checked.length); i += 100) {
			const result = await librarianService.applyBookDetails(items.slice(i, i + 100), checked.slice(i, i + 100))
			summary.updated += result.updated
			summary.checked += result.checked
			summary.refused.push(...result.refusedIsbns)
		}
	} catch (e) {
		saveError.value = apiErrorMessage(e, 'the connection was lost.')
	}

	try {
		remainingAfter.value = (await librarianService.fetchDetailsQueue({ perPage: 1 })).remaining
	} catch {
		remainingAfter.value = 0
	}
	phase.value = 'done'
	emit('changed')
}

function stopOrClose() {
	if (phase.value === 'running') { stopRequested.value = true; return }
	if (phase.value === 'saving') return
	emit('close')
}

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	phase.value = 'intro'
	area.value = ''
	batch.value = 100
	books.value = []
	results.value = []
	void loadRemaining()
})
</script>
