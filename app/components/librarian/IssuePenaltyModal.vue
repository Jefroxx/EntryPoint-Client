<template>
	<LibrarianModalShell :open="open" size="xl" title="Issue a Penalty"
		subtitle="Charge a student for a book that is lost or damaged." :busy="busy" :dirty="dirty" fixed-height
		discard-title="Don't Issue This Penalty?"
		discard-text="The penalty won't be issued, and the student won't be charged."
		keep-label="Back to the Penalty" discard-label="Yes, Don't Issue" ref="shell" @close="emit('close')">
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
		<div class="min-w-0 space-y-5">
			<!-- What happened to the book. -->
			<fieldset>
				<legend class="mb-2 text-[13.5px] font-semibold text-stone-800">What happened to the book?<FieldRequired /></legend>
				<div class="grid grid-cols-2 gap-2">
					<button v-for="option in TYPES" :key="option.value" type="button" :aria-pressed="type === option.value"
						class="flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[14px] font-semibold transition-colors"
						:class="type === option.value ? 'border-accent-500 bg-accent-500 text-white' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'"
						@click="type = option.value">
						<Icon :name="option.icon" class="h-4 w-4" aria-hidden="true" />{{ option.label }}
					</button>
				</div>
			</fieldset>

			<!-- Which book and student: from a loan, or by naming both (for a book lost or damaged inside the library). -->
			<fieldset>
				<legend class="mb-2 text-[13.5px] font-semibold text-stone-800">Who and which book?<FieldRequired /></legend>
				<div class="mb-3 flex flex-wrap gap-1.5">
					<button v-for="option in MODES" :key="option.value" type="button" :aria-pressed="mode === option.value"
						class="rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
						:class="mode === option.value ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'"
						@click="mode = option.value">{{ option.label }}</button>
				</div>

				<div v-if="mode === 'loan'">
					<LibrarianSearchSelect v-model="loan" input-id="penalty-loan" placeholder="Search a student or a book title"
						:fetcher="searchLoans" :get-label="loanLabel" :get-sublabel="loanSublabel" />
					<p class="mt-1.5 text-[12.5px] text-stone-500">
						Pick the loan the book was lost or damaged on. A loan that is still out is closed, because the book is not coming back.
					</p>
				</div>

				<div v-else class="space-y-3">
					<LibrarianSearchSelect v-model="student" input-id="penalty-student" placeholder="Search name or student ID"
						:fetcher="searchStudents" :get-label="studentLabel" :get-sublabel="studentSublabel" />
					<LibrarianSearchSelect v-model="book" input-id="penalty-book" placeholder="Search the book by title"
						:fetcher="searchBooks" :get-label="(b: CatalogBook) => b.title" :get-sublabel="bookSublabel" />

					<div v-if="book">
						<label for="penalty-copy" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Copy (accession no.)<FieldRequired /></label>
						<p v-if="loadingBook" class="text-[13.5px] text-stone-500">Loading the copies…</p>
						<select v-else-if="copies.length" id="penalty-copy" v-model="copyID"
							class="font-data h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200">
							<option value="" disabled>Choose the copy that was {{ type }}</option>
							<option v-for="c in copies" :key="c.copyID" :value="c.copyID">{{ c.accessionNumber }} · {{ c.status }}</option>
						</select>
						<p v-else class="rounded-lg bg-red-50 px-3 py-2 text-[13.5px] text-red-600">This book has no copies left in the catalog.</p>
					</div>
				</div>
			</fieldset>

		</div>

		<div class="min-w-0 space-y-5">
			<!-- Once we know the copy, what it costs and who is charged. -->
			<section v-if="target" class="rounded-2xl border border-stone-200 p-4">
				<dl class="grid grid-cols-2 gap-3">
					<div>
						<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">Charged to</dt>
						<dd class="text-[14px] font-semibold text-stone-900">{{ target.studentName }}</dd>
					</div>
					<div>
						<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">Price on record</dt>
						<dd class="font-data text-[14px] font-semibold text-stone-900">{{ target.price !== null ? formatPeso(target.price) : 'Not on record' }}</dd>
					</div>
				</dl>
				<p class="mt-2 text-[12.5px] text-stone-500">{{ target.bookTitle }} · accession no. {{ target.accession }}</p>
			</section>

			<div class="rounded-xl border border-dashed border-amber-400 bg-amber-50/60 p-3">
				<label for="penalty-amount" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Penalty amount (₱)<FieldRequired /></label>
				<input id="penalty-amount" v-model="amount" type="text" inputmode="decimal" autocomplete="off" placeholder="e.g. 450.00"
					class="font-data h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[14px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
					@input="amount = decimalOnly(String(amount), 2); amountEdited = true" @keydown.enter.prevent="submit">
				<p class="mt-1.5 text-[12.5px] text-stone-600">
					<template v-if="!pickedCopy">Pick the copy first: the amount fills in from its price.</template>
					<template v-else-if="price !== null">Filled in from this copy's price. Lower it only if the damage is light.</template>
					<template v-else>This copy has no price on record, so type the amount.</template>
				</p>
			</div>

			<div>
				<label for="penalty-reason" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">What happened?<FieldRequired /></label>
				<textarea id="penalty-reason" v-model="reason" rows="3" maxlength="500" placeholder="e.g. Spilled water on it in the reading room"
					class="w-full resize-none rounded-[10px] border bg-white px-3 py-2.5 text-[14.5px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
					:class="reasonError ? 'border-red-400 bg-red-50' : 'border-stone-200'" @input="reasonError = ''" />
				<p v-if="reasonError" class="mt-1 text-[12.5px] text-red-500">{{ reasonError }}</p>
				<p v-else class="mt-1 text-[12.5px] text-stone-500">Kept on the penalty and the stock log, and the student sees it in their notice.</p>
			</div>

			<p class="flex items-start gap-2 rounded-xl bg-stone-50 px-4 py-3 text-[13.5px] leading-snug text-stone-700">
				<Icon name="i-tabler-info-circle" class="mt-0.5 h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" />
				<span>The copy is marked <b>{{ type }}</b> and the student is told. They can <b>pay this amount</b> at the desk, or <b>replace the book</b>
					with a new copy. Either way this copy then leaves the catalog.</span>
			</p>
		</div>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy || !ready" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				<Icon v-else name="i-tabler-gavel" class="h-3.5 w-3.5" />
				Issue {{ Number(amount) > 0 ? formatPeso(Number(amount)) : '' }} penalty
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { circulationService, type IssuePenaltyPayload, type LoanRecord } from '~/services/circulationService'
import { librarianService, type BookDetail, type CatalogBook, type StudentRecord } from '~/services/librarianService'

const props = defineProps<{
	open: boolean
	busy?: boolean
	/** Sent here from a copy on the Library page: the book and the copy are already chosen, only the student is left. */
	prefill?: { type: 'lost' | 'damaged'; book: CatalogBook; copyID: number } | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: IssuePenaltyPayload): void
}>()

const TYPES = [
	{ value: 'lost', label: 'Lost', icon: 'i-tabler-help-hexagon' },
	{ value: 'damaged', label: 'Damaged', icon: 'i-tabler-book-off' },
] as const

const MODES = [
	{ value: 'loan', label: 'Choose a loan' },
	{ value: 'student', label: 'Enter a student and book' },
] as const

const type = ref<'lost' | 'damaged'>('lost')
const mode = ref<'loan' | 'student'>('loan')
const loan = ref<LoanRecord | null>(null)
const student = ref<StudentRecord | null>(null)
const book = ref<CatalogBook | null>(null)
const bookDetail = ref<BookDetail | null>(null)
const loadingBook = ref(false)
const copyID = ref<number | ''>('')
const amount = ref('')
// Once the librarian types an amount, picking another book no longer overwrites it.
const amountEdited = ref(false)
const reason = ref('')
const reasonError = ref('')
// The copy to select once the prefilled book's copies have loaded.
let pendingCopyID: number | null = null

// A fresh window every time.
// What is typed in this window: closing it with changes asks "Discard Changes?" first (see ModalShell, useUnsavedChanges).
const shell = ref<{ requestClose: () => void } | null>(null)
const { dirty } = useUnsavedChanges(() => [type.value, mode.value, loan.value, student.value, book.value, copyID.value, amount.value, reason.value], () => props.open)

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	type.value = 'lost'
	mode.value = 'loan'
	loan.value = null
	student.value = null
	book.value = null
	bookDetail.value = null
	copyID.value = ''
	amount.value = ''
	amountEdited.value = false
	reason.value = ''
	reasonError.value = ''
	pendingCopyID = null

	if (props.prefill) {
		type.value = props.prefill.type
		mode.value = 'student'
		pendingCopyID = props.prefill.copyID
		book.value = props.prefill.book
	}
})

// ---- Searching ----
async function searchLoans(query: string) {
	const result = await circulationService.fetchLoans({ search: query || undefined, perPage: 8 })
	return result.data
}

async function searchStudents(query: string) {
	const result = await librarianService.fetchStudents({ search: query || undefined, status: 'approved', perPage: 6 })
	return result.data
}

async function searchBooks(query: string) {
	const result = await librarianService.fetchBooks({ search: query || undefined, perPage: 6 })
	return result.data
}

const loanLabel = (l: LoanRecord) => l.copy?.book?.title ?? 'Removed book'
const loanSublabel = (l: LoanRecord) =>
	`${personName(l.student?.user)} · acc. ${l.copy?.accessionNumber ?? '?'} · ${l.status === 'Returned' ? `returned ${formatDate(l.returnDate ?? l.dueDate)}` : `${l.status}, due ${formatDate(l.dueDate)}`}`
const studentLabel = (s: StudentRecord) => (s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown student')
const studentSublabel = (s: StudentRecord) => `${s.memberIDNumber} · ${s.academicProgram ?? '—'}`
const bookSublabel = (b: CatalogBook) => b.authors.map((a) => a.name).join(', ') || 'Unknown author'

// Choosing a book loads its full details: the copies still in the catalog, and what each cost.
watch(book, async (chosen) => {
	copyID.value = ''
	bookDetail.value = null
	if (!chosen) return
	loadingBook.value = true
	try {
		const { book: detail } = await librarianService.fetchBook(chosen.uuid)
		if (book.value?.uuid === chosen.uuid) {
			bookDetail.value = detail
			if (pendingCopyID !== null) { copyID.value = pendingCopyID; pendingCopyID = null }
		}
	} catch {
		// The copies stay empty; the window says so.
	} finally {
		loadingBook.value = false
	}
})

const copies = computed(() => (bookDetail.value?.copies ?? []).filter((c) => c.status !== 'retired'))

// ---- What is being charged ----
const cost = (value: string | number | null | undefined) => (value === null || value === undefined || value === '' ? null : Number(value))

/** The copy, its book, who is charged and the price on record, once the librarian has picked enough to know. */
const target = computed(() => {
	if (mode.value === 'loan') {
		const l = loan.value
		if (!l?.copy) return null
		return {
			studentName: personName(l.student?.user),
			bookTitle: l.copy.book?.title ?? 'Removed book',
			accession: l.copy.accessionNumber,
			price: cost(l.copy.cost) ?? cost(l.copy.book?.cost),
		}
	}

	const copy = copies.value.find((c) => c.copyID === copyID.value)
	if (!student.value || !bookDetail.value || !copy) return null
	return {
		studentName: studentLabel(student.value),
		bookTitle: bookDetail.value.title,
		accession: copy.accessionNumber,
		price: cost(copy.cost) ?? cost(bookDetail.value.cost),
	}
})

/** The price of the copy chosen (its own cost, or the book's), known as soon as the copy is: the student isn't needed for it. */
const pickedCopy = computed(() => {
	if (mode.value === 'loan') return loan.value?.copy ?? null
	return copies.value.find((c) => c.copyID === copyID.value) ?? null
})
const price = computed(() => {
	if (mode.value === 'loan') {
		const c = loan.value?.copy
		return c ? cost(c.cost) ?? cost(c.book?.cost) : null
	}
	const c = copies.value.find((x) => x.copyID === copyID.value)
	return c && bookDetail.value ? cost(c.cost) ?? cost(bookDetail.value.cost) : null
})

// Whenever another copy (or loan) is chosen the amount follows its price; typing in the box only holds until the next choice.
watch(price, (p) => {
	amount.value = p != null ? String(p) : ''
	amountEdited.value = false
})

const ready = computed(() => !!target.value && Number(amount.value) > 0)

function submit() {
	if (!ready.value || props.busy) return
	reasonError.value = reason.value.trim() ? '' : 'Say what happened to the book.'
	if (reasonError.value) return
	const base = { type: type.value, amount: Number(amount.value), reason: reason.value.trim() }

	emit('submit', mode.value === 'loan'
		? { ...base, loan: loan.value!.uuid }
		: { ...base, studentID: student.value!.studentID, copyID: copyID.value as number })
}
</script>
