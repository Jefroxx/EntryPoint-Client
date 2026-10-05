<template>
	<LibrarianTableShell :columns="['Student', 'Book', 'Reported At', 'Status', '']" :loading="loading"
		:empty="reports.length === 0" empty-text="No self-return reports are waiting for verification.">
		<tr v-for="(report, index) in reports" :key="report.reportID" tabindex="0" @click="selected = report" @keydown.enter.self="selected = report"
			class="row-fade-in cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3">
				<LibrarianPersonCell :name="personName(report.loan?.student?.user)" :sub="report.loan?.student?.studentIDNumber" />
			</td>
			<td class="px-4 py-3">
				<LibrarianBookCell :title="report.loan?.copy?.book?.title ?? 'Removed book'" :sub="report.loan?.copy?.accessionNumber" />
			</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ formatDateTime(report.reportedAt) }}</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill label="Pending" tone="warning" />
			</td>
			<td class="px-4 py-3" @click.stop>
				<div class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="primary" size="sm" @click="emit('verify', report)">Verify</ButtonsButton>
					<ButtonsButton variant="danger" size="sm" @click="emit('reject', report)">Reject</ButtonsButton>
				</div>
			</td>
		</tr>
	<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Self-return report" :title="selected?.loan?.copy?.book?.title ?? 'Removed book'"
			:subtitle="selected ? `Report #${selected.reportID}` : ''" :status="{ label: 'Pending', tone: 'warning' }"
			:fields="fields" @close="selected = null" />
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { SelfReturnReportRecord } from '~/services/circulationService'

defineProps<{
	reports: SelfReturnReportRecord[]
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'verify', report: SelfReturnReportRecord): void
	(e: 'reject', report: SelfReturnReportRecord): void
}>()
const selected = ref<SelfReturnReportRecord | null>(null)

const fields = computed(() => {
	const loan = selected.value?.loan
	if (!selected.value) return []
	return [
		{ label: 'Student', value: personName(loan?.student?.user), wide: true },
		{ label: 'Student ID', value: loan?.student?.studentIDNumber, mono: true },
		{ label: 'Program', value: loan?.student?.academicProgram },
		{ label: 'Accession no.', value: loan?.copy?.accessionNumber, mono: true },
		{ label: 'Reported', value: formatDateTime(selected.value.reportedAt) },
		{ label: 'Checked out', value: loan ? formatDateTime(loan.checkoutDate) : null },
		{ label: 'Due', value: loan ? formatDateTime(loan.dueDate) : null },
		{ label: 'Loan', value: loan ? `#${loan.loanID}` : null, mono: true },
	]
})
</script>
