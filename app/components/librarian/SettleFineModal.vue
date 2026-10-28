<template>
	<LibrarianModalShell :open="open" size="xl" :title="step === 'confirm' ? 'Confirm the payment' : 'Mark this fine as paid?'"
		:subtitle="step === 'confirm' ? 'This is the last step. Check it, then record the payment.' : 'Check the details, then continue.'"
		:busy="busy" @close="emit('close')">
		<!-- Step 2: the final confirmation. Nothing has changed yet. -->
		<div v-if="penalty && step === 'confirm'" class="space-y-4">
			<section class="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
				<p class="text-[12px] font-bold uppercase tracking-wide text-emerald-800">You are about to record a payment</p>
				<p class="mt-1 text-[26px] font-extrabold tabular-nums text-stone-900">{{ formatPeso(penalty.amount) }}</p>
				<p class="text-[14px] text-stone-700">
					paid by <b class="text-stone-900">{{ studentName }}</b> ({{ student?.studentIDNumber || 'no ID' }})
					for <b class="text-stone-900">{{ bookTitle }}</b>.
				</p>
				<p class="mt-2 text-[13.5px] text-emerald-900">
					The {{ copyKind ? 'penalty' : 'fine' }} is marked <b>paid</b> as of now, and it can't be undone from here. Only continue if the money has been collected at the desk.<template v-if="copyKind"> The {{ copyKind }} copy is then removed from the catalog.</template>
				</p>
			</section>

			<div class="rounded-xl border border-dashed border-amber-400 bg-amber-50/60 p-3">
				<label for="settle-receipt" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Cashier receipt no.<FieldRequired /></label>
				<input id="settle-receipt" v-model="receiptNumber" type="text" autocomplete="off" maxlength="50" placeholder="e.g. OR-2026-00123"
					class="font-data h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200">
				<p class="mt-1.5 text-[12.5px] text-stone-600">Copy it from the cashier's official receipt. It is saved with this fine.</p>
			</div>
		</div>

		<!-- Step 1: everything about the fine on one screen. -->
		<div v-else-if="penalty" class="space-y-4">
			<section class="rounded-2xl border border-amber-300 bg-amber-50 p-4">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="text-[12px] font-bold uppercase tracking-wide text-amber-800">{{ copyKind ? `${copyKind === 'lost' ? 'Lost' : 'Damaged'} book` : 'Late fee' }}</p>
						<p class="text-[26px] font-extrabold tabular-nums text-stone-900">{{ formatPeso(penalty.amount) }}</p>
						<p class="text-[13.5px] text-stone-700">{{ reason }}</p>
					</div>
					<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-[14px] font-bold text-white">
						<Icon name="i-tabler-clock-exclamation" class="h-4 w-4" aria-hidden="true" />Unpaid
					</span>
				</div>
			</section>

			<div class="grid gap-3 md:grid-cols-3">
				<section class="rounded-xl border border-stone-200 p-4">
					<h3 class="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
						<Icon name="i-tabler-book-2" class="h-4 w-4" aria-hidden="true" />Book
					</h3>
					<p class="text-[15.5px] font-bold leading-snug text-stone-900">{{ bookTitle }}</p>
					<dl class="mt-3 grid grid-cols-1 gap-y-2.5">
						<div v-for="f in bookFields" :key="f.label">
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">{{ f.label }}</dt>
							<dd class="break-words text-[14px] font-medium text-stone-800" :class="f.mono ? 'font-data text-[13px]' : ''">{{ f.value || '—' }}</dd>
						</div>
					</dl>
				</section>

				<section class="rounded-xl border border-stone-200 p-4">
					<h3 class="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
						<Icon name="i-tabler-user" class="h-4 w-4" aria-hidden="true" />Student
					</h3>
					<p class="text-[15.5px] font-bold leading-snug text-stone-900">{{ studentName }}</p>
					<p class="font-data text-[13px] text-stone-600">{{ student?.studentIDNumber || '—' }}</p>
					<dl class="mt-3 grid grid-cols-1 gap-y-2.5">
						<div>
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">Program</dt>
							<dd class="text-[14px] font-medium text-stone-800">{{ student?.academicProgram || '—' }}</dd>
						</div>
					</dl>
				</section>

				<section class="rounded-xl border border-stone-200 p-4">
					<h3 class="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
						<Icon name="i-tabler-calendar-time" class="h-4 w-4" aria-hidden="true" />{{ penalty.loan ? `Loan #${penalty.loan.loanID}` : 'Loan' }}
					</h3>
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
				<ButtonsButton variant="primary" :disabled="busy || !receiptNumber.trim()" @click="emit('submit', { receiptNumber: receiptNumber.trim() })">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					<Icon v-else name="i-tabler-circle-check" class="h-3.5 w-3.5" />
					Yes, mark {{ penalty ? formatPeso(penalty.amount) : '' }} as paid
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="!penalty" @click="step = 'confirm'">
					Continue<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5" />
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { isCopyPenalty, penaltyCopy, penaltyStudent, type PenaltyRecord } from '~/services/circulationService'

const props = defineProps<{
	open: boolean
	penalty: PenaltyRecord | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: { receiptNumber: string }): void
}>()

// Two steps: the details, then a last look before anything is changed.
const step = ref<'details' | 'confirm'>('details')
// The cashier's receipt number, written down with the payment.
const receiptNumber = ref('')
watch(() => [props.open, props.penalty?.penaltyID], () => { step.value = 'details'; receiptNumber.value = '' })

const loan = computed(() => props.penalty?.loan ?? null)
const student = computed(() => (props.penalty ? penaltyStudent(props.penalty) : null))
const copy = computed(() => (props.penalty ? penaltyCopy(props.penalty) : null))
const studentName = computed(() => personName(student.value?.user))
const bookTitle = computed(() => copy.value?.book?.title ?? 'Removed book')

// 'lost' or 'damaged' when the student is paying for the book itself; null for a late fee.
const copyKind = computed(() => (props.penalty && isCopyPenalty(props.penalty) ? props.penalty.penalty_type!.category : null))

const reason = computed(() => {
	const p = props.penalty
	if (!p) return ''
	if (copyKind.value) return `Paying for the ${copyKind.value} copy · the copy leaves the catalog once this is recorded`
	const category = p.penalty_type?.category
	const lateBy = loan.value?.returnDate ? daysBetween(loan.value.dueDate, loan.value.returnDate) : null
	return [category ? `${category.charAt(0).toUpperCase()}${category.slice(1)} collection` : null, lateBy ? `returned ${lateBy} late` : null]
		.filter(Boolean).join(' · ') || 'Late return'
})

function daysBetween(from: string, to: string): string | null {
	const days = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000)
	return days > 0 ? `${days} day${days === 1 ? '' : 's'}` : null
}

const bookFields = computed(() => [
	{ label: 'Accession no.', value: copy.value?.accessionNumber != null ? String(copy.value.accessionNumber) : '', mono: true },
])

const loanFields = computed(() => {
	const l = loan.value
	const p = props.penalty
	if (!p) return []
	// A book lost or damaged inside the library has no loan behind it.
	if (!l) return [
		{ label: 'Loan', value: 'None. Lost or damaged in the library.' },
		{ label: 'Issued', value: formatDateTime(p.computedAt) },
	]
	return [
		{ label: 'Checked out', value: formatDateTime(l.checkoutDate) },
		{ label: 'Due', value: formatDateTime(l.dueDate) },
		{ label: 'Returned', value: l.returnDate ? formatDateTime(l.returnDate) : '—' },
		{ label: 'Fine computed', value: formatDateTime(p.computedAt) },
	]
})
</script>
