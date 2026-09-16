<template>
	<div class="flex h-full flex-col rounded-xl bg-white p-5 shadow-sm">
		<div class="mb-4 flex items-center justify-between">
			<p class="font-bold text-amber-900">Recent Loans</p>
			<NuxtLink to="/Librarian/Circulation" class="text-sm font-medium text-amber-700 hover:underline">
				View All
			</NuxtLink>
		</div>

		<div class="flex-1 overflow-x-auto">
			<table class="w-full min-w-max text-left text-sm">
				<thead>
					<tr class="border-b border-gray-100 text-xs font-medium text-gray-500">
						<th class="pb-2 pr-4 font-medium">Student</th>
						<th class="pb-2 pr-4 font-medium">Book</th>
						<th class="pb-2 pr-4 font-medium">Loan Date</th>
						<th class="pb-2 pr-4 font-medium">Due Date</th>
						<th class="pb-2 font-medium">Status</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="loan in loans" :key="`${loan.studentName}-${loan.bookTitle}-${loan.checkoutDate}`"
						class="border-b border-gray-50 last:border-0">
						<td class="py-3 pr-4">
							<div class="flex items-center gap-2">
								<LibrarianStudentAvatar :name="loan.studentName" />
								<span class="text-gray-700">{{ loan.studentName }}</span>
							</div>
						</td>
						<td class="py-3 pr-4 text-gray-700">{{ loan.bookTitle }}</td>
						<td class="py-3 pr-4 text-gray-500">{{ formatDate(loan.checkoutDate) }}</td>
						<td class="py-3 pr-4 text-gray-500">{{ formatDate(loan.dueDate) }}</td>
						<td class="py-3">
							<span class="rounded-full border px-2.5 py-1 text-xs font-medium" :class="statusClass(loan.status)">
								{{ loan.status }}
							</span>
						</td>
					</tr>

					<tr v-if="loans.length === 0">
						<td colspan="5" class="py-6 text-center text-sm text-gray-400">No recent loans.</td>
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
			return 'border-amber-800 text-amber-800'
		case 'Due Soon':
			return 'border-amber-400 text-amber-600'
		case 'Due':
			return 'border-red-400 text-red-600'
		case 'Returned':
			return 'border-emerald-400 text-emerald-600'
		default:
			return 'border-gray-300 text-gray-500'
	}
}
</script>
