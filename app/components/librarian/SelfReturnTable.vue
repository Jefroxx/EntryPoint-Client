<template>
	<LibrarianTableShell :columns="['Student', 'Book', 'Reported At', 'Status', '']" :loading="loading"
		:empty="reports.length === 0" empty-text="No self-return reports are waiting for verification.">
		<tr v-for="(report, index) in reports" :key="report.reportID"
			class="row-fade-in border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
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
			<td class="px-4 py-3">
				<div class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="primary" size="sm" @click="emit('verify', report)">Verify</ButtonsButton>
					<ButtonsButton variant="danger" size="sm" @click="emit('reject', report)">Reject</ButtonsButton>
				</div>
			</td>
		</tr>
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
</script>
