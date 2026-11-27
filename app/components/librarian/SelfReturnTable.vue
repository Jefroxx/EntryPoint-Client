<template>
	<LibrarianTableShell :columns="['Student', 'Book', 'Due Date', 'Returned At', 'Status', '']" :loading="loading"
		:empty="reports.length === 0" empty-text="No self-return reports are waiting for verification.">
		<!-- Phones: one card per row, with the row's buttons on it. -->
		<template #cards>
			<li v-for="report in reports" :key="`card-${report.reportID}`">
				<div class="relative h-full px-4 py-3.5 transition-colors active:bg-accent-50">
					<button type="button" class="card-cover" :aria-label="`Open the report for ${report.loan?.copy?.book?.title ?? 'a removed book'}`" @click="selected = report" />
					<div class="card-body">
						<div class="flex items-start justify-between gap-3">
							<LibrarianPersonCell :name="personName(report.loan?.student?.user)" :sub="report.loan?.student?.memberIDNumber" />
							<LibrarianStatusPill label="Pending" tone="warning" class="shrink-0" />
						</div>
						<LibrarianBookCell class="mt-3" :book="report.loan?.copy?.book" :title="report.loan?.copy?.book?.title ?? 'Removed book'" :sub="report.loan?.copy ? `Acc. no. ${report.loan.copy.accessionNumber}` : undefined" />
						<p class="mt-0.5 text-[12.5px] text-stone-500">Returned {{ formatDateTime(report.reportedAt) }}</p>
						<p v-if="report.loan" class="mt-0.5 text-[12.5px] text-stone-500">Due {{ formatDate(report.loan.dueDate) }} ·
							<span class="font-semibold" :class="lateness(report) ? 'text-red-600' : 'text-emerald-700'">{{ lateness(report) ?? 'On time' }}</span>
						</p>
						<div class="card-action mt-3 flex gap-2">
							<ButtonsButton variant="danger" class="flex-1" @click="emit('reject', report)">Reject</ButtonsButton>
							<ButtonsButton variant="primary" class="flex-[1.4]" @click="emit('verify', report)">Verify</ButtonsButton>
						</div>
					</div>
				</div>
			</li>
		</template>
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

const DAY_MS = 86_400_000

/**
 * How late the book was when the student returned it (the report time against the due date), or null if on time.
 * Counted in calendar days like the student's "N days overdue"; a same-day late return shows hours instead.
 */
function lateness(report: SelfReturnReportRecord): string | null {
	const due = report.loan?.dueDate
	if (!due) return null
	const dueAt = new Date(due)
	const returnedAt = new Date(report.reportedAt)
	if (returnedAt <= dueAt) return null

	const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
	const days = Math.round((startOfDay(returnedAt) - startOfDay(dueAt)) / DAY_MS)
	if (days >= 1) return `${days} day${days === 1 ? '' : 's'} overdue`

	const hours = Math.max(1, Math.ceil((returnedAt.getTime() - dueAt.getTime()) / 3_600_000))
	return `${hours} hour${hours === 1 ? '' : 's'} overdue`
}

// The details panel's buttons close it, then start the same flow as the row's buttons.
function verifySelected(r: SelfReturnReportRecord) { selected.value = null; emit('verify', r) }
function rejectSelected(r: SelfReturnReportRecord) { selected.value = null; emit('reject', r) }
const fields = computed(() => {
	const loan = selected.value?.loan
	if (!selected.value) return []
	return [
		{ label: 'Student', value: personName(loan?.student?.user), wide: true },
		{ label: 'Student ID', value: loan?.student?.memberIDNumber, mono: true },
		{ label: 'Program', value: loan?.student?.academicProgram },
		{ label: 'Accession no.', value: loan?.copy?.accessionNumber, mono: true },
		{ label: 'Returned', value: formatDateTime(selected.value.reportedAt) },
		{ label: 'Checked out', value: loan ? formatDateTime(loan.checkoutDate) : null },
		{ label: 'Due', value: loan ? formatDateTime(loan.dueDate) : null },
		{ label: 'Overdue', value: loan ? (lateness(selected.value) ?? 'No, returned on time') : null },
		{ label: 'Loan', value: loan ? `#${loan.loanID}` : null, mono: true },
	]
})
</script>
