<template>
	<LibrarianModalShell :open="open" size="xl" :title="step === 'confirm' ? words.confirmTitle : words.title"
		:subtitle="step === 'confirm' ? words.confirmSubtitle : words.subtitle"
		:busy="busy" @close="emit('close')">
		<div v-if="loading" class="space-y-3" aria-busy="true">
			<div class="h-24 animate-pulse rounded-xl bg-stone-100" />
			<div class="h-32 animate-pulse rounded-xl bg-stone-100" />
		</div>

		<p v-else-if="error" class="rounded-xl bg-red-50 px-4 py-4 text-[14px] text-red-600">{{ error }}</p>

		<!-- Step 2: the final confirmation. Nothing has changed yet; the button below is what returns the book. -->
		<div v-else-if="preview && step === 'confirm'" class="space-y-4">
			<section class="rounded-2xl border border-stone-200 p-4">
				<p class="text-[12px] font-bold uppercase tracking-wide text-stone-500">{{ words.about }}</p>
				<p class="mt-1.5 text-[17px] font-bold leading-snug text-stone-900">{{ preview.book.title }}</p>
				<p class="text-[14px] text-stone-600">
					Accession no. <span class="font-data">{{ preview.book.accessionNumber }}</span> · borrowed by
					<b class="text-stone-800">{{ preview.student.name }}</b> ({{ preview.student.studentIDNumber || 'no ID' }})
				</p>
				<p v-if="preview.report" class="mt-2 text-[13.5px] text-stone-600">
					The student reported returning it on {{ formatDateTime(preview.report.reportedAt) }}.
				</p>
				<p class="mt-2 text-[13.5px] text-stone-600">
					Due {{ formatDateTime(preview.loan.dueAt) }}. {{ words.outcome }}
				</p>
			</section>

			<section v-if="owesFee" class="rounded-2xl border p-4" :class="feePaid ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="text-[12px] font-bold uppercase tracking-wide" :class="feePaid ? 'text-emerald-800' : 'text-amber-800'">Late fee</p>
						<p class="text-[22px] font-extrabold tabular-nums text-stone-900">{{ formatPeso(fine.amount) }}</p>
						<p class="text-[13px] text-stone-600">{{ fine.unitsLate }} {{ unitWord(fine.unitsLate) }} late × {{ formatPeso(fine.rate ?? 0) }} per {{ fine.rateUnit }}</p>
					</div>
					<span class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[14px] font-bold"
						:class="feePaid ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'">
						<Icon :name="feePaid ? 'i-tabler-circle-check' : 'i-tabler-clock-exclamation'" class="h-4 w-4" aria-hidden="true" />
						{{ feePaid ? 'Fee paid' : 'Fee NOT paid' }}
					</span>
				</div>
				<p class="mt-2.5 text-[13.5px]" :class="feePaid ? 'text-emerald-900' : 'text-amber-900'">{{ feeOutcome }}</p>
			</section>

			<p v-else-if="kind !== 'reject'" class="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[14px] font-medium text-emerald-900">
				<Icon name="i-tabler-circle-check" class="h-4 w-4" aria-hidden="true" />No late fee. The book is not overdue, or its collection has no fine rule.
			</p>

			<p v-if="preview.student.unpaidFinesTotal > 0" class="rounded-lg bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-900">
				{{ preview.student.name }} also owes <b class="tabular-nums">{{ formatPeso(preview.student.unpaidFinesTotal) }}</b> in unpaid fines from other loans.
			</p>
		</div>

		<!-- Step 1: everything about the return on one screen. -->
		<div v-else-if="preview" class="space-y-4">
			<!-- The fee is already on record as paid: the window says so itself and asks nothing. -->
			<section v-if="owesFee && alreadyPaid" role="status" class="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
				<div class="flex items-start gap-3">
					<Icon name="i-tabler-circle-check" class="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
					<div class="min-w-0 flex-1">
						<p class="text-[15px] font-bold text-emerald-900">This book is overdue, and the late fee is already paid.</p>
						<p class="mt-1 text-[14px] leading-snug text-emerald-900">
							Late by {{ fine.unitsLate }} {{ unitWord(fine.unitsLate) }} · fee <b class="tabular-nums">{{ formatPeso(fine.amount) }}</b>
							<template v-if="fine.onRecord?.settledAt"> · paid {{ formatDateTime(fine.onRecord.settledAt) }}</template>.
							Nothing more to collect.
						</p>
					</div>
					<span class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-[14px] font-bold text-white">
						<Icon name="i-tabler-circle-check" class="h-4 w-4" aria-hidden="true" />Fee paid
					</span>
				</div>
			</section>

			<!-- A late fee applies and isn't paid: the desk says whether it was collected. -->
			<section v-else-if="owesFee" role="alert" class="rounded-2xl border border-amber-300 bg-amber-50 p-4">
				<div class="flex items-start gap-3">
					<Icon name="i-tabler-alert-triangle" class="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
					<div class="min-w-0 flex-1">
						<p class="text-[15px] font-bold text-amber-900">This book is overdue. A late fee applies.</p>
						<p class="mt-1 text-[14px] leading-snug text-amber-900">
							Late by {{ fine.unitsLate }} {{ unitWord(fine.unitsLate) }} (due {{ formatDateTime(preview.loan.dueAt) }}).
							Fee: {{ fine.unitsLate }} {{ unitWord(fine.unitsLate) }} × {{ formatPeso(fine.rate ?? 0) }} per {{ fine.rateUnit }}
							= <b class="tabular-nums">{{ formatPeso(fine.amount) }}</b>
						</p>
					</div>
					<span v-if="fine.onRecord" class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-[14px] font-bold text-white">
						<Icon name="i-tabler-clock-exclamation" class="h-4 w-4" aria-hidden="true" />Unpaid on record
					</span>
				</div>

				<fieldset class="mt-3.5 grid gap-2 sm:grid-cols-2">
					<legend class="mb-2 text-[13.5px] font-semibold text-amber-950">Has the student paid the late fee?<FieldRequired /></legend>
					<label v-for="option in PAID_OPTIONS" :key="String(option.value)"
						class="flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3 transition-colors"
						:class="paid === option.value ? (option.value ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-amber-500 ring-1 ring-amber-300') : 'border-stone-200 hover:bg-stone-50'">
						<input v-model="paid" type="radio" name="return-fee-paid" :value="option.value" class="mt-1 accent-accent-500" />
						<span>
							<span class="block text-[14.5px] font-semibold text-stone-900">{{ option.label(formatPeso(fine.amount)) }}</span>
							<span class="block text-[13px] text-stone-600">{{ option.hint }}</span>
						</span>
					</label>
				</fieldset>
			</section>

			<p v-else-if="preview.loan.overdue && kind !== 'reject'" class="flex items-start gap-2.5 rounded-xl bg-stone-100 px-4 py-3 text-[13.5px] text-stone-700">
				<Icon name="i-tabler-info-circle" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
				This book is overdue, but this collection has no fine rule, so there is no fee to collect.
			</p>

			<!-- Book, student and loan side by side, so all of it is in view at once. -->
			<div class="grid gap-3 md:grid-cols-3">
				<section class="rounded-xl border border-stone-200 p-4">
					<h3 class="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
						<Icon name="i-tabler-book-2" class="h-4 w-4" aria-hidden="true" />Book
					</h3>
					<p class="text-[15.5px] font-bold leading-snug text-stone-900">{{ preview.book.title }}</p>
					<p v-if="preview.book.authors.length" class="text-[13.5px] text-stone-600">{{ preview.book.authors.join(', ') }}</p>
					<dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
						<div v-for="f in bookFields" :key="f.label" :class="f.wide ? 'col-span-2' : ''">
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">{{ f.label }}</dt>
							<dd class="break-words text-[14px] font-medium text-stone-800" :class="f.mono ? 'font-data text-[13px]' : ''">{{ f.value || '—' }}</dd>
						</div>
					</dl>
				</section>

				<section class="rounded-xl border border-stone-200 p-4">
					<h3 class="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
						<Icon name="i-tabler-user" class="h-4 w-4" aria-hidden="true" />Student
					</h3>
					<p class="text-[15.5px] font-bold leading-snug text-stone-900">{{ preview.student.name }}</p>
					<p class="font-data text-[13px] text-stone-600">{{ preview.student.studentIDNumber || '—' }}</p>
					<dl class="mt-3 grid grid-cols-1 gap-y-2.5">
						<div v-for="f in studentFields" :key="f.label">
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">{{ f.label }}</dt>
							<dd class="break-words text-[14px] font-medium text-stone-800">{{ f.value || '—' }}</dd>
						</div>
					</dl>
					<p v-if="preview.student.unpaidFinesTotal > 0" class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-900">
						Also owes <b class="tabular-nums">{{ formatPeso(preview.student.unpaidFinesTotal) }}</b> in unpaid fines.
					</p>
				</section>

				<section class="rounded-xl border border-stone-200 p-4">
					<div class="mb-2.5 flex items-center justify-between gap-3">
						<h3 class="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
							<Icon name="i-tabler-calendar-time" class="h-4 w-4" aria-hidden="true" />Loan #{{ preview.loan.loanID }}
						</h3>
						<LibrarianStatusPill v-bind="loanPill" />
					</div>
					<dl class="grid grid-cols-1 gap-y-2.5">
						<div v-for="f in loanFields" :key="f.label">
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">{{ f.label }}</dt>
							<dd class="text-[14px] font-medium text-stone-800">{{ f.value }}</dd>
						</div>
					</dl>
				</section>
			</div>
		</div>

		<template #footer>
			<template v-if="step === 'confirm'">
				<ButtonsButton variant="ghost" :disabled="busy" @click="step = 'details'">
					<Icon name="i-tabler-arrow-left" class="h-3.5 w-3.5" />Back
				</ButtonsButton>
				<ButtonsButton :variant="kind === 'reject' ? 'danger' : 'primary'" :disabled="busy" @click="confirm">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					<Icon v-else :name="words.icon" class="h-3.5 w-3.5" />
					{{ confirmLabel }}
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="loading || !preview || needsAnswer" @click="step = 'confirm'">
					Continue<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5" />
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { ReturnPreview } from '~/services/circulationService'

const props = defineProps<{
	open: boolean
	/** What the librarian is doing: returning a book at the desk (the default), or verifying or rejecting a student's self-return report. */
	mode?: 'return' | 'verify' | 'reject'
	preview: ReturnPreview | null
	loading?: boolean
	error?: string
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	/** `finePaid` is undefined when there is nothing to answer (no fee, or a fee already on record as paid). */
	(e: 'submit', payload: { finePaid: boolean | undefined }): void
}>()

const kind = computed(() => props.mode ?? 'return')

const WORDS = {
	return: {
		title: 'Return this book?', subtitle: 'Check the details, then continue.',
		confirmTitle: 'Confirm the return', confirmSubtitle: 'This is the last step. Check it, then return the book.',
		about: 'You are about to return', outcome: 'It goes back on the shelf and the next person in line is told.',
		confirm: 'Yes, return the book', icon: 'i-tabler-arrow-back-up',
	},
	verify: {
		title: 'Verify this self-return?', subtitle: 'The student says they brought the book back. Check the details, then continue.',
		confirmTitle: 'Confirm the verification', confirmSubtitle: 'This is the last step. Check it, then verify the return.',
		about: 'You are about to verify the return of', outcome: 'The book is returned and goes back on the shelf, and the student is told it was verified.',
		confirm: 'Yes, verify the return', icon: 'i-tabler-circle-check',
	},
	reject: {
		title: 'Reject this report?', subtitle: "Check the details, then continue. The book stays on the student's loan.",
		confirmTitle: 'Confirm the rejection', confirmSubtitle: 'This is the last step. Check it, then reject the report.',
		about: 'You are about to reject the report for', outcome: 'The book stays on loan. The student is told it could not be verified and can report again after 6 hours.',
		confirm: 'Yes, reject the report', icon: 'i-tabler-circle-x',
	},
} as const

const words = computed(() => WORDS[kind.value])

const PAID_OPTIONS = [
	{ value: true, label: (amount: string) => `Yes, ${amount} has been paid`, hint: 'The fine is recorded as paid together with the return.' },
	{ value: false, label: () => 'Not yet', hint: 'The book is returned and the fine stays unpaid. It can be collected later in the Penalties tab.' },
]

// No default on purpose: when the system doesn't know, the librarian has to answer.
const paid = ref<boolean | null>(null)

// Two steps: the details (and the fee question), then a last look before anything is changed.
const step = ref<'details' | 'confirm'>('details')

watch(() => [props.open, props.preview?.loan.loanID], () => { paid.value = null; step.value = 'details' })

const fine = computed(() => props.preview?.fine ?? { hasRule: false, unitsLate: 0, rateUnit: null, rate: null, amount: 0, onRecord: null })
// Rejecting a report returns nothing, so there is no fee to ask about.
const owesFee = computed(() => kind.value !== 'reject' && !!props.preview && props.preview.loan.overdue && fine.value.hasRule && fine.value.amount > 0)

// The fine is already on record as paid (marked in the Penalties tab): nothing to ask.
const alreadyPaid = computed(() => fine.value.onRecord?.paymentStatus === 'Paid')
const needsAnswer = computed(() => owesFee.value && !alreadyPaid.value && paid.value === null)
const feePaid = computed(() => alreadyPaid.value || paid.value === true)

const feeOutcome = computed(() => {
	if (alreadyPaid.value) return 'It was already paid, so there is nothing more to collect.'
	return paid.value ? 'It will be recorded as paid together with the return.' : 'It will stay on record as unpaid, to collect later in the Penalties tab.'
})

const unitWord = (n: number) => `${fine.value.rateUnit ?? 'day'}${n === 1 ? '' : 's'}`

const confirmLabel = computed(() => {
	if (!owesFee.value) return words.value.confirm
	const base = kind.value === 'verify' ? 'Yes, verify it' : 'Yes, return it'
	return feePaid.value ? `${base}. Fee paid` : `${base}. Fee unpaid`
})

const AREAS: Record<string, string> = {
	circulation: 'Circulation', reserved: 'Reserved', filipiniana: 'Filipiniana', fiction: 'Fiction',
	thesis: 'Thesis', journal: 'Journal', dissertation: 'Dissertation',
}

const bookFields = computed(() => {
	const b = props.preview?.book
	if (!b) return []
	return [
		{ label: 'Accession no.', value: String(b.accessionNumber), mono: true },
		{ label: 'Call no.', value: b.callNumber ?? '', mono: true },
		{ label: 'Collection', value: b.areaOfLibrary ? (AREAS[b.areaOfLibrary] ?? b.areaOfLibrary) : '' },
		{ label: 'ISBN', value: b.isbn ?? '', mono: true },
	]
})

const studentFields = computed(() => {
	const s = props.preview?.student
	if (!s) return []
	return [
		{ label: 'Program', value: s.academicProgram ?? '' },
		{ label: 'Email', value: s.email ?? '' },
		{ label: 'Phone', value: s.phoneNumber ?? '' },
	]
})

function dayCount(from: string, to: string): string {
	const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000)
	return `${days} day${days === 1 ? '' : 's'}`
}

const loanFields = computed(() => {
	const l = props.preview?.loan
	if (!l) return []
	return [
		...(props.preview?.report ? [{ label: 'Reported', value: formatDateTime(props.preview.report.reportedAt) }] : []),
		{ label: 'Checked out', value: formatDateTime(l.checkoutAt) },
		{ label: 'Due', value: formatDateTime(l.dueAt) },
		{ label: 'Loan length', value: dayCount(l.checkoutAt, l.dueAt) },
	]
})

const loanPill = computed<{ label: string; tone: 'info' | 'warning' | 'danger' | 'neutral' }>(() => {
	const l = props.preview?.loan
	if (!l) return { label: 'Active', tone: 'info' }
	if (l.overdue) return { label: 'Overdue', tone: 'danger' }
	if (new Date(l.dueAt).getTime() - Date.now() <= 24 * 60 * 60 * 1000) return { label: 'Due Soon', tone: 'warning' }
	return { label: 'Active', tone: 'info' }
})

function confirm() {
	// Only send an answer when the librarian gave one; a fee already on record as paid stays as it is.
	emit('submit', { finePaid: owesFee.value && !alreadyPaid.value ? (paid.value as boolean) : undefined })
}
</script>
