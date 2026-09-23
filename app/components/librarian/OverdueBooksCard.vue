<template>
	<div class="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
		<div class="mb-4">
			<p class="font-bold text-amber-900">Overdue Books</p>
		</div>

		<div class="flex-1 overflow-x-auto">
			<table class="w-full min-w-max text-left text-[15px]">
				<thead>
					<tr class="border-b border-stone-100 text-[13px] font-medium text-stone-500">
						<th class="pb-2 pr-4 font-medium">Student</th>
						<th class="pb-2 pr-4 font-medium">Book</th>
						<th class="pb-2 font-medium">Days Overdue</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="loan in loans" :key="`${loan.studentName}-${loan.bookTitle}`"
						class="border-b border-stone-50 last:border-0">
						<td class="py-3 pr-4">
							<div class="flex items-center gap-2">
								<LibrarianStudentAvatar :name="loan.studentName" />
								<span class="text-stone-700">{{ loan.studentName }}</span>
							</div>
						</td>
						<td class="py-3 pr-4 text-stone-700">{{ loan.bookTitle }}</td>
						<td class="py-3">
							<span class="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[13px] font-bold text-red-700">
								<Icon name="i-tabler-alert-circle" class="h-3 w-3" />{{ loan.daysOverdue }} Days
							</span>
						</td>
					</tr>

					<tr v-if="loans.length === 0">
						<td colspan="3" class="py-6 text-center text-[15px] text-stone-400">No overdue books.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { OverdueLoan } from '~/services/librarianService'

defineProps<{
	loans: OverdueLoan[]
}>()
</script>
