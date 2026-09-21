<template>
	<LibrarianTableShell :columns="['Student', 'Book', 'Checkout Date', 'Due Date', 'Status', '']" :loading="loading"
		:empty="loans.length === 0" empty-text="No loans match your filters.">
		<tr v-for="(loan, index) in loans" :key="loan.loanID"
			class="row-fade-in border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
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
			<td class="px-4 py-3">
				<div v-if="loan.status === 'Active'" class="flex justify-end">
					<ButtonsButton variant="primary" size="sm" @click="emit('return', loan)">Return</ButtonsButton>
				</div>
			</td>
		</tr>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { LoanRecord } from '~/services/circulationService'

defineProps<{
	loans: LoanRecord[]
	loading: boolean
}>()

const emit = defineEmits<{ (e: 'return', loan: LoanRecord): void }>()

function pill(loan: LoanRecord): { label: string; tone: 'info' | 'warning' | 'danger' | 'neutral' } {
	if (loan.status === 'Returned') return { label: 'Returned', tone: 'neutral' }

	const due = new Date(loan.dueDate).getTime()
	const now = Date.now()
	if (due < now) return { label: 'Overdue', tone: 'danger' }
	if (due - now <= 24 * 60 * 60 * 1000) return { label: 'Due Soon', tone: 'warning' }
	return { label: 'Active', tone: 'info' }
}
</script>
