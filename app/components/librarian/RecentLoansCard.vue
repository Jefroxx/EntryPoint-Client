<template>
	<!-- Same build as OverdueBooksCard (Student · Book · one pill), so the two read as a pair side by side.
		 The pill carries the loan's state in its colour and the due date as its text. -->
	<div class="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
		<div class="mb-4 flex items-center justify-between gap-2">
			<p class="font-bold text-crimson">Recent loans</p>
			<NuxtLink to="/librarian/circulation" class="text-[13px] font-semibold text-accent-600 hover:underline">View all</NuxtLink>
		</div>

		<!-- A phone gets one row per loan; the table is for wider screens. -->
		<ul class="divide-y divide-stone-100 sm:hidden">
			<li v-for="loan in loans" :key="`m-${loan.studentName}-${loan.bookTitle}-${loan.checkoutDate}`">
				<button type="button" class="flex w-full items-center gap-3 py-3 text-left" @click="selected = loan">
					<LibrarianStudentAvatar :name="loan.studentName" />
					<span class="min-w-0 flex-1">
						<span class="block truncate text-[14.5px] font-semibold text-stone-800">{{ loan.studentName }}</span>
						<span class="block truncate text-[13px] text-stone-500">{{ loan.bookTitle }}</span>
					</span>
					<span class="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-bold" :class="statusClass(loan.status)">
						<Icon :name="statusIcon(loan.status)" class="h-3 w-3" />
						{{ loan.status === 'Returned' ? 'Returned' : shortDate(loan.dueDate) }}
					</span>
				</button>
			</li>
			<li v-if="loans.length === 0" class="py-6 text-center text-[15px] text-stone-400">No recent loans.</li>
		</ul>

		<div class="hidden flex-1 overflow-x-auto sm:block">
			<table class="w-full min-w-max text-left text-[15px]">
				<thead>
					<tr class="border-b border-stone-100 text-[13px] font-medium text-stone-500">
						<th class="pb-2 pr-4 font-medium">Student</th>
						<th class="pb-2 pr-4 font-medium">Book</th>
						<th class="pb-2 font-medium">Due</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="loan in loans" :key="`${loan.studentName}-${loan.bookTitle}-${loan.checkoutDate}`" tabindex="0"
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
							<span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[13px] font-bold"
								:class="statusClass(loan.status)" :title="`${loan.status}, borrowed ${shortDate(loan.checkoutDate)}`">
								<Icon :name="statusIcon(loan.status)" class="h-3 w-3" />
								{{ loan.status === 'Returned' ? 'Returned' : shortDate(loan.dueDate) }}
							</span>
						</td>
					</tr>

					<tr v-if="loans.length === 0">
						<td colspan="3" class="py-6 text-center text-[15px] text-stone-400">No recent loans.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Click a row for the whole loan. Teleports to <body>. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Loan details" :title="selected?.bookTitle ?? ''"
			:subtitle="selected?.loanID ? `Loan #${selected.loanID}` : undefined" :status="selected ? pill(selected) : undefined"
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
import type { RecentLoan } from '~/services/librarianService'

defineProps<{
	loans: RecentLoan[]
}>()

const selected = ref<RecentLoan | null>(null)

const fields = computed(() => {
	const loan = selected.value
	if (!loan) return []
	return [
		{ label: 'Student', value: loan.studentName, wide: true },
		{ label: 'Student ID', value: loan.studentIDNumber, mono: true },
		{ label: 'Program', value: loan.academicProgram },
		{ label: 'Accession no.', value: loan.accessionNumber, mono: true },
		{ label: 'Checked out', value: formatDateTime(loan.checkoutAt ?? loan.checkoutDate) },
		{ label: 'Due', value: formatDateTime(loan.dueAt ?? loan.dueDate) },
		{ label: 'Returned', value: loan.returnedAt ? formatDateTime(loan.returnedAt) : null },
		{ label: 'Loan length', value: dayCount(loan.checkoutAt ?? loan.checkoutDate, loan.dueAt ?? loan.dueDate) },
	]
})

function dayCount(from: string, to: string): string {
	const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000)
	return `${days} day${days === 1 ? '' : 's'}`
}

/** The same states and words as the Loans page, so a loan reads the same wherever it shows up. */
function pill(loan: RecentLoan): { label: string; tone: 'info' | 'warning' | 'danger' | 'neutral' } {
	switch (loan.status) {
		case 'Returned': return { label: 'Returned', tone: 'neutral' }
		case 'Received': return { label: 'Received · to check', tone: 'warning' }
		case 'Due': return { label: 'Overdue', tone: 'danger' }
		case 'Due Soon': return { label: 'Due Soon', tone: 'warning' }
		default: return { label: 'Active', tone: 'info' }
	}
}

function shortDate(value: string): string {
	return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
