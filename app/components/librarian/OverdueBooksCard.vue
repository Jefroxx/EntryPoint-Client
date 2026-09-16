<template>
	<div class="flex h-full flex-col rounded-xl bg-white p-5 shadow-sm">
		<div class="mb-4 flex items-center justify-between">
			<p class="font-bold text-amber-900">Overdue Books</p>
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
						<th class="pb-2 font-medium">Days Overdue</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="loan in loans" :key="`${loan.studentName}-${loan.bookTitle}`"
						class="border-b border-gray-50 last:border-0">
						<td class="py-3 pr-4">
							<div class="flex items-center gap-2">
								<LibrarianStudentAvatar :name="loan.studentName" />
								<span class="text-gray-700">{{ loan.studentName }}</span>
							</div>
						</td>
						<td class="py-3 pr-4 text-gray-700">{{ loan.bookTitle }}</td>
						<td class="py-3 font-medium text-red-600">{{ loan.daysOverdue }} Days</td>
					</tr>

					<tr v-if="loans.length === 0">
						<td colspan="3" class="py-6 text-center text-sm text-gray-400">No overdue books.</td>
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
