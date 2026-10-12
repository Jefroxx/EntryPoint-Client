<template>
	<div class="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
		<div class="mb-4 flex items-center justify-between gap-2">
			<p class="font-bold text-crimson">Overdue books</p>
			<NuxtLink to="/librarian/circulation" class="text-[13px] font-semibold text-accent-600 hover:underline">View all</NuxtLink>
		</div>

		<!-- A phone gets one row per loan; the table is for wider screens. -->
		<ul class="divide-y divide-stone-100 sm:hidden">
			<li v-for="loan in loans" :key="`m-${loan.studentName}-${loan.bookTitle}`">
				<button type="button" class="flex w-full items-center gap-3 py-3 text-left" @click="selected = loan">
					<LibrarianStudentAvatar :name="loan.studentName" />
					<span class="min-w-0 flex-1">
						<span class="block truncate text-[14.5px] font-semibold text-stone-800">{{ loan.studentName }}</span>
						<span class="block truncate text-[13px] text-stone-500">{{ loan.bookTitle }}</span>
					</span>
					<span class="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[12.5px] font-bold text-red-700">
						<Icon name="i-tabler-alert-circle" class="h-3 w-3" />{{ loan.daysOverdue }} {{ loan.daysOverdue === 1 ? 'day' : 'days' }}
					</span>
				</button>
			</li>
			<li v-if="loans.length === 0" class="py-6 text-center text-[15px] text-stone-400">No overdue books.</li>
		</ul>

		<div class="hidden flex-1 overflow-x-auto sm:block">
			<table class="w-full min-w-max text-left text-[15px]">
				<thead>
					<tr class="border-b border-stone-100 text-[13px] font-medium text-stone-500">
						<th class="pb-2 pr-4 font-medium">Student</th>
						<th class="pb-2 pr-4 font-medium">Book</th>
						<th class="pb-2 font-medium">Days Overdue</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="loan in loans" :key="`${loan.studentName}-${loan.bookTitle}`" tabindex="0"
						class="cursor-pointer border-b border-stone-50 transition-colors duration-150 last:border-0 hover:bg-accent-50 focus-visible:bg-accent-50 focus-visible:outline-none"
						@click="selected = loan" @keydown.enter.self="selected = loan">
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

		<!-- Click a row for the whole loan. Teleports to <body>. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Overdue loan" :title="selected?.bookTitle ?? ''"
			:subtitle="selected?.loanID ? `Loan #${selected.loanID}` : undefined"
			:status="selected ? { label: `${selected.daysOverdue} day${selected.daysOverdue === 1 ? '' : 's'} overdue`, tone: 'danger' } : undefined"
			:fields="fields" @close="selected = null">
			<template #footer>
				<NuxtLink to="/librarian/circulation" class="w-full">
					<ButtonsButton variant="primary" class="w-full">Open in Circulation</ButtonsButton>
				</NuxtLink>
			</template>
		</LibrarianRecordDrawer>
	</div>
</template>

<script setup lang="ts">
import type { OverdueLoan } from '~/services/librarianService'

defineProps<{
	loans: OverdueLoan[]
}>()

const selected = ref<OverdueLoan | null>(null)

const fields = computed(() => {
	const loan = selected.value
	if (!loan) return []
	return [
		{ label: 'Student', value: loan.studentName, wide: true },
		{ label: 'Student ID', value: loan.studentIDNumber, mono: true },
		{ label: 'Program', value: loan.academicProgram },
		{ label: 'Accession no.', value: loan.accessionNumber, mono: true },
		{ label: 'Checked out', value: loan.checkoutAt ? formatDateTime(loan.checkoutAt) : null },
		{ label: 'Was due', value: loan.dueAt ? formatDateTime(loan.dueAt) : null },
		{ label: 'Days overdue', value: loan.daysOverdue },
	]
})
</script>
