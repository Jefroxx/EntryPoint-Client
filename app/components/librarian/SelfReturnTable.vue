<template>
	<LibrarianTableShell :columns="['Student', 'Book', 'Returned At', 'Status', '']" :loading="loading"
		:empty="reports.length === 0" empty-text="No self-return reports are waiting for verification.">
		<!-- Phones: one card per row, with the row's buttons on it. -->
		<template #cards>
			<li v-for="report in reports" :key="`card-${report.reportID}`">
				<div role="button" tabindex="0" class="px-4 py-3.5 transition-colors active:bg-accent-50" @click="selected = report" @keydown.enter.self="selected = report">
					<div class="flex items-start justify-between gap-3">
						<LibrarianPersonCell :name="personName(report.loan?.student?.user)" :sub="report.loan?.student?.studentIDNumber" />
						<LibrarianStatusPill label="Pending" tone="warning" class="shrink-0" />
					</div>
					<p class="mt-2 text-[14.5px] font-semibold leading-snug text-stone-900">{{ report.loan?.copy?.book?.title ?? 'Removed book' }}</p>
					<p class="mt-0.5 text-[12.5px] text-stone-500">Returned {{ formatDateTime(report.reportedAt) }}</p>
					<div class="mt-3 flex gap-2" @click.stop>
						<ButtonsButton variant="danger" class="flex-1" @click="emit('reject', report)">Reject</ButtonsButton>
						<ButtonsButton variant="primary" class="flex-[1.4]" @click="emit('verify', report)">Verify</ButtonsButton>
					</div>
				</div>
			</li>
		</template>
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
			:fields="fields" @close="selected = null">
			<template v-if="selected" #footer>
				<ButtonsButton variant="danger" class="flex-1" @click="rejectSelected(selected)">Reject</ButtonsButton>
				<ButtonsButton variant="primary" class="flex-[1.4]" @click="verifySelected(selected)">Verify</ButtonsButton>
			</template>
		</LibrarianRecordDrawer>
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

// The details panel's buttons close it, then start the same flow as the row's buttons.
function verifySelected(r: SelfReturnReportRecord) { selected.value = null; emit('verify', r) }
function rejectSelected(r: SelfReturnReportRecord) { selected.value = null; emit('reject', r) }
const fields = computed(() => {
	const loan = selected.value?.loan
	if (!selected.value) return []
	return [
		{ label: 'Student', value: personName(loan?.student?.user), wide: true },
		{ label: 'Student ID', value: loan?.student?.studentIDNumber, mono: true },
		{ label: 'Program', value: loan?.student?.academicProgram },
		{ label: 'Accession no.', value: loan?.copy?.accessionNumber, mono: true },
		{ label: 'Returned', value: formatDateTime(selected.value.reportedAt) },
		{ label: 'Checked out', value: loan ? formatDateTime(loan.checkoutDate) : null },
		{ label: 'Due', value: loan ? formatDateTime(loan.dueDate) : null },
		{ label: 'Loan', value: loan ? `#${loan.loanID}` : null, mono: true },
	]
})
</script>
