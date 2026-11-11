<template>
	<LibrarianModalShell :open="open" size="xl" :title="shellTitle" :subtitle="shellSubtitle" :busy="busy" @close="emit('close')">
		<!-- Done: the copies are in the catalog, and their barcode labels are one tap away. -->
		<div v-if="added" class="mx-auto max-w-[620px] space-y-4 py-2">
			<div class="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
				<Icon name="i-tabler-circle-check" class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
				<div class="min-w-0">
					<p class="text-[15px] font-semibold text-stone-900">{{ added.accessions.length }} {{ added.accessions.length === 1 ? 'copy' : 'copies' }} added</p>
					<p class="font-data text-[13px] text-stone-600">Accession no. {{ addedNumbers }}</p>
				</div>
			</div>
			<p class="text-[14px] leading-snug text-stone-600">Each copy needs a barcode label stuck on it before it can be scanned at checkout. Print them now, or later from the Book Catalog.</p>
		</div>

		<!-- Last step: a summary of what is about to be added. It replaces the form in this same window (no second pop-up). -->
		<div v-else-if="confirming" class="mx-auto max-w-[620px] space-y-4 py-2">
			<div class="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
				<img v-if="coverOk" :src="chosen?.coverImageURL ?? ''" alt="" class="h-16 w-11 shrink-0 rounded-md object-cover ring-1 ring-stone-200" @error="coverFailed = true" />
				<div class="min-w-0">
					<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Book</p>
					<p class="text-[15px] font-semibold text-stone-900">{{ pending?.title }}</p>
					<p v-if="authorLine" class="text-[13px] text-stone-600">{{ authorLine }}</p>
				</div>
			</div>
			<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
				<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Copies to add</dt><dd class="font-semibold text-stone-900">{{ pending?.quantity }}</dd></div>
				<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Cost per copy</dt><dd class="font-semibold text-stone-900">{{ formatPeso(pending?.cost ?? 0) }}</dd></div>
				<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Total cost</dt><dd class="font-semibold text-stone-900">{{ formatPeso((pending?.cost ?? 0) * (pending?.quantity ?? 0)) }}</dd></div>
				<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Source of fund</dt><dd class="text-right font-semibold text-stone-900">{{ pending?.sourceOfFund }}</dd></div>
				<div v-if="pending?.remarks" class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Remarks</dt><dd class="text-right text-stone-900">{{ pending.remarks }}</dd></div>
			</dl>
			<p class="text-[13px] text-stone-500">Each copy gets the next accession number and its own barcode. This is recorded in the stock log.</p>
		</div>

		<!-- Step 1: choose the book. A search with the matches listed as cards; picking one carries straight on to the details. -->
		<div v-else-if="stage === 'choose'" class="mx-auto max-w-[820px] space-y-4">
			<div class="relative">
				<Icon name="i-tabler-search" class="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400" />
				<input id="add-copies-search" ref="searchInput" v-model="query" type="search" autocomplete="off" placeholder="Search by title, author or ISBN"
					class="h-12 w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 text-[15px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
			</div>

			<p class="flex min-h-[20px] items-center gap-2 text-[13px] text-stone-500" aria-live="polite">
				<span v-if="searching" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-accent-500" />
				<span v-if="searchError" class="text-red-500">Couldn't load the books. Check the connection and try again.</span>
				<span v-else-if="results.length">{{ query.trim() ? `${total} ${total === 1 ? 'match' : 'matches'}` : `Showing ${results.length} of ${total} books` }}. Choose the one you are adding copies of.</span>
				<span v-else-if="!searching">No book matches "{{ query.trim() }}". Check the spelling, or search by ISBN. A new title is added from Add New Book.</span>
			</p>

			<ul v-if="results.length" class="grid gap-2.5 sm:grid-cols-2">
				<li v-for="b in results" :key="b.uuid">
					<button type="button"
						class="flex w-full items-center gap-3.5 rounded-2xl border border-stone-200 bg-white p-3 text-left transition-[transform,border-color,background-color] duration-150 ease-out hover:border-accent-300 hover:bg-accent-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 active:scale-[0.99]"
						@click="choose(b)">
						<img v-if="b.coverImageURL && !brokenCovers.has(b.uuid)" :src="b.coverImageURL" alt="" class="h-[72px] w-12 shrink-0 rounded-md object-cover ring-1 ring-stone-200"
							@error="brokenCovers.add(b.uuid)" />
						<span v-else class="flex h-[72px] w-12 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-400 ring-1 ring-stone-200"><Icon name="i-tabler-book-2" class="h-5 w-5" /></span>
						<span class="min-w-0 flex-1">
							<span class="line-clamp-2 block text-[14.5px] font-semibold leading-snug text-stone-900">{{ b.title }}</span>
							<span class="mt-0.5 block truncate text-[12.5px] text-stone-600">{{ b.authors.map((a) => a.name).join(', ') || 'Unknown author' }}</span>
							<span class="mt-1 flex items-center gap-2 text-[12px] text-stone-500">
								<span v-if="b.callNumber" class="font-data">{{ b.callNumber }}</span>
								<span>{{ b.copies.length }} {{ b.copies.length === 1 ? 'copy' : 'copies' }}</span>
							</span>
						</span>
						<Icon name="i-tabler-chevron-right" class="h-4 w-4 shrink-0 text-stone-300" />
					</button>
				</li>
			</ul>
		</div>

		<!-- Step 2: the copy details, next to the book that was chosen. -->
		<div v-else class="mx-auto grid max-w-[860px] gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
			<aside class="flex items-start gap-4 md:flex-col md:items-stretch">
				<div class="w-[110px] shrink-0 md:w-[150px]">
					<img v-if="coverOk" :src="chosen?.coverImageURL ?? ''" alt="Cover" class="aspect-[2/3] w-full rounded-[14px] object-cover shadow-[0_10px_24px_-12px_rgba(28,23,18,.45)] ring-1 ring-stone-200"
						@error="coverFailed = true" />
					<div v-else class="flex aspect-[2/3] w-full items-center justify-center rounded-[14px] bg-stone-100 text-stone-400 ring-1 ring-stone-200">
						<Icon name="i-tabler-book-2" class="h-8 w-8" />
					</div>
				</div>
				<div class="min-w-0">
					<p class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">Adding copies of</p>
					<p class="mt-0.5 text-[16px] font-bold leading-snug text-crimson">{{ chosen?.title }}</p>
					<p v-if="authorLine" class="mt-0.5 text-[13px] text-stone-600">{{ authorLine }}</p>
					<p v-if="chosen?.callNumber" class="font-data mt-1.5 text-[12.5px] text-stone-500">{{ chosen.callNumber }}</p>
					<p v-if="chosen?.copyCount != null" class="mt-0.5 text-[12.5px] text-stone-500">{{ chosen.copyCount }} {{ chosen.copyCount === 1 ? 'copy' : 'copies' }} in the catalog now</p>
					<button v-if="!fixedBook" type="button" class="mt-2.5 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-600 transition-opacity hover:opacity-70" @click="backToChoose">
						<Icon name="i-tabler-arrows-exchange" class="h-3.5 w-3.5" />Choose a different book
					</button>
				</div>
			</aside>

			<div class="space-y-4">
				<!-- How many, and what each one cost, side by side. -->
				<div class="grid items-start gap-4 sm:grid-cols-2">
					<LibrarianTextField id="add-copies-quantity" v-model="quantity" type="number" label="How many copies" :min="1" :max="50"
						:error="errors.quantity" hint="Each gets the next accession number and its own barcode."
						@update:model-value="errors.quantity = ''" />

					<LibrarianTextField id="add-copies-cost" v-model="cost" type="number" label="Cost per copy (₱)" :min="0" step="0.01"
						placeholder="0.00" :error="errors.cost" hint="Enter 0 for a donated copy."
						@update:model-value="errors.cost = ''" />
				</div>

				<!-- Where these copies came from. The source of fund and the cost are required; remarks are not. -->
				<LibrarianTextField id="add-copies-fund" v-model="sourceOfFund" label="Source of fund" :maxlength="255"
					placeholder="e.g. Library budget, Donation, Alumni gift" :error="errors.sourceOfFund"
					@update:model-value="errors.sourceOfFund = ''" />

				<LibrarianTextField id="add-copies-remarks" v-model="remarks" label="Remarks" optional :maxlength="1000"
					placeholder="e.g. Donated by the Class of 2025, or Purchase order #1042" />
			</div>
		</div>

		<template #footer>
			<template v-if="added">
				<ButtonsButton variant="ghost" @click="emit('close')">Done</ButtonsButton>
				<ButtonsButton variant="primary" @click="emit('print', added.accessions)">
					<Icon name="i-tabler-printer" class="h-3.5 w-3.5" />Print {{ added.accessions.length === 1 ? 'label' : `${added.accessions.length} labels` }}
				</ButtonsButton>
			</template>
			<template v-else-if="confirming">
				<ButtonsButton variant="ghost" :disabled="busy" @click="confirming = false">Back</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy" @click="confirm">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					<Icon v-else name="i-tabler-check" class="h-3.5 w-3.5" />
					Yes, add {{ pending?.quantity === 1 ? 'copy' : `${pending?.quantity} copies` }}
				</ButtonsButton>
			</template>
			<template v-else-if="stage === 'choose'">
				<ButtonsButton variant="ghost" @click="emit('close')">Cancel</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton v-if="fixedBook" variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
				<ButtonsButton v-else variant="ghost" :disabled="busy" @click="backToChoose">
					<Icon name="i-tabler-arrow-left" class="h-3.5 w-3.5" />Back
				</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy" @click="submit">
					<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5" />
					Review
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { librarianService, type CatalogBook } from '~/services/librarianService'
import { describeRanges, toRanges } from '~/utils/accessionRanges'

/** A book the copies are for: what the details step shows beside the form. */
export interface ChosenBook {
	bookUuid: string
	title: string
	authors?: string[]
	coverImageURL?: string | null
	callNumber?: string | null
	/** How many copies the catalog holds now, when known. */
	copyCount?: number | null
}

const props = defineProps<{
	open: boolean
	/** Set when opened from a catalog row (the book is already known, so the choosing step is skipped); otherwise the librarian chooses it first. */
	book: ChosenBook | null
	busy?: boolean
	/** Set once the copies are in: the window then shows what was added, with a button to print their labels. */
	added?: { title: string; accessions: number[] } | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	/** Print the barcode labels of the copies that were just added (their accession numbers). */
	(e: 'print', accessions: number[]): void
	(e: 'submit', payload: Payload): void
}>()

type Payload = { bookUuid: string; title: string; quantity: number; sourceOfFund: string; cost: number; remarks: string | undefined }

// Two steps: choose the book, then the details. A row-opened window starts on the details.
const stage = ref<'choose' | 'details'>('choose')
const chosen = ref<ChosenBook | null>(null)
const fixedBook = computed(() => !!props.book)

const quantity = ref<string | number>(1)
const sourceOfFund = ref('')
const cost = ref<string | number>('')
const remarks = ref('')
const errors = reactive({ quantity: '', sourceOfFund: '', cost: '' })

// Once the details validate, `pending` holds what was typed and `confirming` swaps in the summary.
const confirming = ref(false)
const pending = ref<Payload | null>(null)
const addedNumbers = computed(() => describeRanges(toRanges(props.added?.accessions ?? [])))

const authorLine = computed(() => chosen.value?.authors?.filter(Boolean).join(', ') ?? '')
const coverFailed = ref(false)
const coverOk = computed(() => !!chosen.value?.coverImageURL && !coverFailed.value)

const shellTitle = computed(() => (props.added ? 'Copies Added' : confirming.value ? 'Confirm New Copies' : 'Add Book Copy'))
const shellSubtitle = computed(() => {
	if (props.added) return props.added.title
	if (confirming.value) return 'Check the details before they go into the catalog.'
	if (stage.value === 'choose') return 'Step 1 of 2: choose the book you are adding copies of.'
	return fixedBook.value ? 'Log more copies of this book.' : 'Step 2 of 2: how many copies, and where they came from.'
})

/* ---------- Step 1: finding the book ---------- */
const searchInput = ref<HTMLInputElement | null>(null)
const query = ref('')
const results = ref<CatalogBook[]>([])
const total = ref(0)
const searching = ref(false)
const searchError = ref(false)
const brokenCovers = reactive(new Set<string>())
// Each search gets a number, so a slow answer to an older search can't replace a newer one.
let searchRun = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined

async function runSearch() {
	const run = ++searchRun
	searching.value = true
	searchError.value = false
	try {
		const page = await librarianService.fetchBooks({ search: query.value.trim() || undefined, perPage: 12 })
		if (run !== searchRun) return
		results.value = page.data
		total.value = page.total
	} catch {
		if (run !== searchRun) return
		searchError.value = true
		results.value = []
	} finally {
		if (run === searchRun) searching.value = false
	}
}

watch(query, () => {
	clearTimeout(searchTimer)
	searchTimer = setTimeout(runSearch, 250)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

function choose(book: CatalogBook) {
	chosen.value = {
		bookUuid: book.uuid,
		title: book.title,
		authors: book.authors.map((a) => a.name),
		coverImageURL: book.coverImageURL,
		callNumber: book.callNumber,
		copyCount: book.copies.length,
	}
	coverFailed.value = false
	stage.value = 'details'
}

function backToChoose() {
	stage.value = 'choose'
	void nextTick(() => searchInput.value?.focus())
}

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	confirming.value = false
	pending.value = null
	quantity.value = 1
	sourceOfFund.value = ''
	cost.value = ''
	remarks.value = ''
	errors.quantity = ''
	errors.sourceOfFund = ''
	errors.cost = ''
	coverFailed.value = false
	query.value = ''
	results.value = []

	if (props.book) {
		chosen.value = props.book
		stage.value = 'details'
		return
	}

	chosen.value = null
	stage.value = 'choose'
	clearTimeout(searchTimer)
	void runSearch()
	void nextTick(() => searchInput.value?.focus())
})

function submit() {
	const target = chosen.value
	if (!target) {
		backToChoose()
		return
	}

	const n = Number(quantity.value)
	errors.quantity = Number.isInteger(n) && n >= 1 && n <= 50 ? '' : 'Enter a whole number from 1 to 50.'

	errors.sourceOfFund = sourceOfFund.value.trim() ? '' : 'Enter where the money for these copies came from.'

	// An empty box is not a cost of 0: it has to be typed (a donated copy is 0).
	const price = cost.value === '' ? NaN : Number(cost.value)
	errors.cost = Number.isFinite(price) && price >= 0 ? '' : 'Enter the cost of each copy (0 if it was donated).'

	if (errors.quantity || errors.sourceOfFund || errors.cost) return

	pending.value = {
		bookUuid: target.bookUuid, title: target.title, quantity: n,
		sourceOfFund: sourceOfFund.value.trim(), cost: price, remarks: remarks.value.trim() || undefined,
	}
	confirming.value = true
}

function confirm() {
	if (pending.value) emit('submit', pending.value)
}
</script>
