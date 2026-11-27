<template>
	<LibrarianTableShell :columns="['Student', 'Book', 'Checkout Date', 'Due Date', 'Status', '']" :loading="loading"
		:empty="loans.length === 0" empty-text="No loans match your filters.">
		<!-- Phones: one card per loan, with the main action on it. -->
		<template #cards>
			<li v-for="loan in loans" :key="`card-${loan.loanID}`">
				<div class="relative h-full px-4 py-3.5 transition-colors active:bg-accent-50">
					<button type="button" class="card-cover" :aria-label="`Open the loan of ${loan.copy?.book?.title ?? 'a removed book'}`" @click="selected = loan" />
					<div class="card-body flex flex-col gap-2.5">
						<div class="flex items-start justify-between gap-3">
							<LibrarianPersonCell :name="personName(loan.student?.user)" :sub="loan.student?.memberIDNumber" />
							<LibrarianStatusPill v-bind="pill(loan)" class="shrink-0" />
						</div>
						<LibrarianBookCell :book="loan.copy?.book" :title="loan.copy?.book?.title ?? 'Removed book'" :sub="loan.copy ? `Acc. no. ${loan.copy.accessionNumber}` : undefined" />
						<div class="flex items-center justify-between gap-3">
							<div class="min-w-0 text-[13px] text-stone-500">
							<p>Due <b class="font-semibold text-stone-800">{{ formatDate(loan.dueDate) }}</b></p>
							<!-- How late, and what it has cost so far (what returning it right now would charge). -->
							<p v-if="overdueFor(loan)" class="font-semibold text-red-600">{{ overdueFor(loan) }}<template v-if="loan.fineSoFar"> · {{ formatPeso(loan.fineSoFar) }} so far</template></p>
						</div>
							<ButtonsButton v-if="loan.status === 'Active'" variant="primary" size="sm" class="card-action" @click="emit('return', loan)">Return</ButtonsButton>
							<ButtonsButton v-else-if="loan.status === 'Received'" variant="primary" size="sm" class="card-action" @click="emit('finish', loan)">
								<Icon name="i-tabler-checklist" class="h-3.5 w-3.5" />Check book
							</ButtonsButton>
						</div>
					</div>
				</div>
			</li>
		</template>

		<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Loan details" :title="selected?.copy?.book?.title ?? 'Removed book'"
			:subtitle="selected ? personName(selected.student?.user) : ''" :status="selected ? pill(selected) : undefined"
			:fields="loanFields" @close="selected = null">
			<template v-if="selected && (selected.status === 'Active' || selected.status === 'Received')" #footer>
				<ButtonsButton variant="primary" class="w-full" @click="actOn(selected)">
					<Icon :name="selected.status === 'Received' ? 'i-tabler-checklist' : 'i-tabler-book-download'" class="h-4 w-4" />
					{{ selected.status === 'Received' ? 'Check book' : 'Return this book' }}
				</ButtonsButton>
			</template>
		</LibrarianRecordDrawer>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { LoanRecord } from '~/services/circulationService'

defineProps<{
	loans: LoanRecord[]
	loading: boolean
}>()

const emit = defineEmits<{ (e: 'return' | 'finish', loan: LoanRecord): void }>()

const selected = ref<LoanRecord | null>(null)

/** The details panel's main button: close it, then start the same flow as the row's button. */
function actOn(loan: LoanRecord) {
	selected.value = null
	if (loan.status === 'Received') emit('finish', loan)
	else emit('return', loan)
}
const loanFields = computed(() => {
	const loan = selected.value
	if (!loan) return []
	const student = loan.student
	return [
		{ label: 'Student', value: personName(student?.user), wide: true },
		{ label: 'Student ID', value: student?.memberIDNumber, mono: true },
		{ label: 'Program', value: student?.academicProgram },
		{ label: 'Accession no.', value: loan.copy?.accessionNumber, mono: true },
		{ label: 'Checked out', value: formatDateTime(loan.checkoutDate) },
		{ label: 'Due', value: formatDateTime(loan.dueDate) },
		{ label: 'Returned', value: loan.returnDate ? formatDateTime(loan.returnDate) : null },
		{ label: 'Overdue by', value: overdueFor(loan)?.replace(/ overdue$/, '') ?? null },
		{ label: 'Fine so far', value: loan.fineSoFar ? formatPeso(loan.fineSoFar) : null },
		{ label: 'Loan length', value: dayCount(loan.checkoutDate, loan.dueDate) },
	]
})

/** "25 days overdue" or "3 hours overdue" for an active loan past its due time; nothing otherwise. */
function overdueFor(loan: LoanRecord): string | null {
	if (loan.status !== 'Active') return null
	const late = Date.now() - new Date(loan.dueDate).getTime()
	if (late <= 0) return null
	const days = Math.floor(late / 86_400_000)
	if (days >= 1) return `${days} ${days === 1 ? 'day' : 'days'} overdue`
	const hours = Math.max(1, Math.floor(late / 3_600_000))
	return `${hours} ${hours === 1 ? 'hour' : 'hours'} overdue`
}

function dayCount(from: string, to: string): string {
	const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000)
	return `${days} day${days === 1 ? '' : 's'}`
}

function pill(loan: LoanRecord): { label: string; tone: 'info' | 'warning' | 'danger' | 'neutral' } {
	if (loan.status === 'Returned') return { label: 'Returned', tone: 'neutral' }
	if (loan.status === 'Received') return { label: 'Received · to check', tone: 'warning' }

	const due = new Date(loan.dueDate).getTime()
	const now = Date.now()
	if (due < now) return { label: 'Overdue', tone: 'danger' }
	if (due - now <= 24 * 60 * 60 * 1000) return { label: 'Due Soon', tone: 'warning' }
	return { label: 'Active', tone: 'info' }
}
</script>
