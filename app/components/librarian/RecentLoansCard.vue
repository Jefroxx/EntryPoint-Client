<template>
	<div class="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
		<div class="mb-4">
			<p class="font-bold text-amber-900">Recent Loans</p>
		</div>

		<div class="flex-1 overflow-x-auto">
			<table class="w-full min-w-max text-left text-[15px]">
				<thead>
					<tr class="border-b border-stone-100 text-[13px] font-medium text-stone-500">
						<th class="pb-2 pr-4 font-medium">Student</th>
						<th class="pb-2 pr-4 font-medium">Book</th>
						<th class="pb-2 pr-4 font-medium">Loan Date</th>
						<th class="pb-2 pr-4 font-medium">Due Date</th>
						<th class="pb-2 font-medium">Status</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="loan in loans" :key="`${loan.studentName}-${loan.bookTitle}-${loan.checkoutDate}`"
						class="border-b border-stone-50 last:border-0">
						<td class="py-3 pr-4">
							<div class="flex items-center gap-2">
								<LibrarianStudentAvatar :name="loan.studentName" />
								<span class="text-stone-700">{{ loan.studentName }}</span>
							</div>
						</td>
						<td class="py-3 pr-4 text-stone-700">{{ loan.bookTitle }}</td>
						<td class="py-3 pr-4 text-stone-500">{{ formatDate(loan.checkoutDate) }}</td>
						<td class="py-3 pr-4 text-stone-500">{{ formatDate(loan.dueDate) }}</td>
						<td class="py-3">
							<span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[13px] font-bold" :class="statusClass(loan.status)">
								<Icon :name="statusIcon(loan.status)" class="h-3 w-3" />
								{{ loan.status }}
							</span>
						</td>
					</tr>

					<tr v-if="loans.length === 0">
						<td colspan="5" class="py-6 text-center text-[15px] text-stone-400">No recent loans.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { RecentLoan } from '~/services/librarianService'

defineProps<{
	loans: RecentLoan[]
}>()

function formatDate(value: string): string {
	return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusClass(status: RecentLoan['status']): string {
	switch (status) {
		case 'Active':
			return 'border-accent-200 bg-accent-50 text-accent-700'
		case 'Due Soon':
			return 'border-amber-200 bg-amber-50 text-amber-700'
		case 'Due':
			return 'border-red-200 bg-red-50 text-red-700'
		case 'Returned':
			return 'border-emerald-200 bg-emerald-50 text-emerald-700'
		default:
			return 'border-stone-200 bg-stone-50 text-stone-500'
	}
}

function statusIcon(status: RecentLoan['status']): string {
	switch (status) {
		case 'Active':
			return 'i-tabler-clock'
		case 'Due Soon':
			return 'i-tabler-alarm'
		case 'Due':
			return 'i-tabler-alert-circle'
		case 'Returned':
			return 'i-tabler-check'
		default:
			return 'i-tabler-circle'
	}
}
</script>
