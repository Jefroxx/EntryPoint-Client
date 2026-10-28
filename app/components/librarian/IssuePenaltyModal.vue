<template>
	<LibrarianModalShell :open="open" size="xl" title="Issue a penalty"
		subtitle="Charge a student for a book that is lost or damaged." :busy="busy" @close="emit('close')">
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
		<div class="space-y-5">
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

		<div class="space-y-5">
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
				<input id="penalty-amount" v-model="amount" type="number" inputmode="decimal" min="0" step="0.01" placeholder="e.g. 450.00"
					class="font-data h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[14px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
					@input="amountEdited = true" @keydown.enter.prevent="submit">
				<p class="mt-1.5 text-[12.5px] text-stone-600">
					<template v-if="!target">Pick the book first: the amount starts at its full price.</template>
					<template v-else-if="target.price !== null">Starts at the book's full price. Lower it only if the damage is light.</template>
					<template v-else>This book has no price on record, so type the amount.</template>
				</p>
			</div>

			<p class="flex items-start gap-2 rounded-xl bg-stone-50 px-4 py-3 text-[13.5px] leading-snug text-stone-700">
				<Icon name="i-tabler-info-circle" class="mt-0.5 h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" />
				<span>The copy is marked <b>{{ type }}</b> and the student is told. They can <b>pay this amount</b> at the desk, or <b>replace the book</b>
					with a new copy. Either way this copy then leaves the catalog.</span>
			</p>
		</div>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
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

// A fresh window every time.
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
const studentSublabel = (s: StudentRecord) => `${s.studentIDNumber} · ${s.academicProgram ?? '—'}`
const bookSublabel = (b: CatalogBook) => b.authors.map((a) => a.name).join(', ') || 'Unknown author'

// Choosing a book loads its full details: the copies still in the catalog, and what each cost.
watch(book, async (chosen) => {
	copyID.value = ''
	bookDetail.value = null
	if (!chosen) return
	loadingBook.value = true
	try {
		const { book: detail } = await librarianService.fetchBook(chosen.uuid)
		if (book.value?.uuid === chosen.uuid) bookDetail.value = detail
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

// The amount starts at the price, until the librarian types their own.
watch(target, (t) => {
	if (!amountEdited.value) amount.value = t?.price != null ? String(t.price) : ''
})

const ready = computed(() => !!target.value && Number(amount.value) > 0)

function submit() {
	if (!ready.value || props.busy) return
	const base = { type: type.value, amount: Number(amount.value) }

	emit('submit', mode.value === 'loan'
		? { ...base, loan: loan.value!.uuid }
		: { ...base, studentID: student.value!.studentID, copyID: copyID.value as number })
}
</script>
