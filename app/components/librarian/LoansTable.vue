<template>
	<LibrarianTableShell :columns="['Student', 'Book', 'Checkout Date', 'Due Date', 'Status', '']" :loading="loading"
		:empty="loans.length === 0" empty-text="No loans match your filters.">
		<tr v-for="(loan, index) in loans" :key="loan.loanID" tabindex="0"
			class="row-fade-in cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			@click="selected = loan" @keydown.enter.self="selected = loan"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3">
				<LibrarianPersonCell :name="personName(loan.student?.user)" :sub="loan.student?.studentIDNumber" />
			</td>
			<td class="px-4 py-3">
				<LibrarianBookCell :title="loan.copy?.book?.title ?? 'Removed book'" :sub="loan.copy?.accessionNumber" />
			</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ formatDate(loan.checkoutDate) }}</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ formatDate(loan.dueDate) }}</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill v-bind="pill(loan)" />
			</td>
			<td class="px-4 py-3" @click.stop>
				<div v-if="loan.status === 'Active'" class="flex justify-end">
					<ButtonsButton variant="primary" size="sm" @click="emit('return', loan)">Return</ButtonsButton>
				</div>
				<div v-else-if="loan.status === 'Received'" class="flex justify-end">
					<ButtonsButton variant="primary" size="sm" @click="emit('finish', loan)">
						<Icon name="i-tabler-checklist" class="h-3.5 w-3.5" />Check book
					</ButtonsButton>
				</div>
			</td>
		</tr>

		<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Loan details" :title="selected?.copy?.book?.title ?? 'Removed book'"
			:subtitle="selected ? `Loan #${selected.loanID}` : ''" :status="selected ? pill(selected) : undefined"
			:fields="loanFields" @close="selected = null" />
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

const loanFields = computed(() => {
	const loan = selected.value
	if (!loan) return []
	const student = loan.student
	return [
		{ label: 'Student', value: personName(student?.user), wide: true },
		{ label: 'Student ID', value: student?.studentIDNumber, mono: true },
		{ label: 'Program', value: student?.academicProgram },
		{ label: 'Accession no.', value: loan.copy?.accessionNumber, mono: true },
		{ label: 'Copy ID', value: loan.copy?.copyID, mono: true },
		{ label: 'Checked out', value: formatDateTime(loan.checkoutDate) },
		{ label: 'Due', value: formatDateTime(loan.dueDate) },
		{ label: 'Returned', value: loan.returnDate ? formatDateTime(loan.returnDate) : null },
		{ label: 'Loan length', value: dayCount(loan.checkoutDate, loan.dueDate) },
	]
})

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
