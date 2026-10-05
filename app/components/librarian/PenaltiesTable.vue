<template>
	<LibrarianTableShell :columns="['Student', 'Book', 'Type', 'Amount', 'Computed', 'Status', '']" :loading="loading"
		:empty="penalties.length === 0" empty-text="No fines recorded. Fines appear automatically when a loan is returned late." min-width="860px">
		<tr v-for="(penalty, index) in penalties" :key="penalty.penaltyID" tabindex="0"
			class="row-fade-in cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			@click="selected = penalty" @keydown.enter.self="selected = penalty"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3">
				<LibrarianPersonCell :name="personName(penalty.loan?.student?.user)" :sub="penalty.loan?.student?.studentIDNumber" />
			</td>
			<td class="px-4 py-3">
				<LibrarianBookCell :title="penalty.loan?.copy?.book?.title ?? 'Removed book'" />
			</td>
			<td class="px-4 py-3 text-[14px] capitalize text-stone-600">{{ penalty.penalty_type?.category ?? '—' }}</td>
			<td class="font-data px-4 py-3 text-[14px] font-semibold text-stone-900">{{ formatPeso(penalty.amount) }}</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ formatDate(penalty.computedAt) }}</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill :label="penalty.paymentStatus"
					:tone="penalty.paymentStatus === 'Paid' ? 'success' : 'danger'" />
			</td>
			<td class="px-4 py-3" @click.stop>
				<div v-if="penalty.paymentStatus === 'Unpaid'" class="flex justify-end">
					<ButtonsButton v-if="penalty.loan?.status === 'Returned'" variant="primary" size="sm"
						@click="emit('settle', penalty)">
						Mark paid
					</ButtonsButton>
					<span v-else class="text-[12.5px] text-stone-400">Still accruing</span>
				</div>
			</td>
		</tr>

		<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Fine details" :title="selected ? formatPeso(selected.amount) : ''"
			:subtitle="selected?.loan?.copy?.book?.title ?? 'Removed book'"
			:status="selected ? { label: selected.paymentStatus, tone: selected.paymentStatus === 'Paid' ? 'success' : 'danger' } : undefined"
			:fields="penaltyFields" @close="selected = null" />
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { PenaltyRecord } from '~/services/circulationService'

defineProps<{
	penalties: PenaltyRecord[]
	loading: boolean
}>()

const emit = defineEmits<{ (e: 'settle', penalty: PenaltyRecord): void }>()

const selected = ref<PenaltyRecord | null>(null)

const penaltyFields = computed(() => {
	const p = selected.value
	if (!p) return []
	const student = p.loan?.student
	return [
		{ label: 'Student', value: personName(student?.user), wide: true },
		{ label: 'Student ID', value: student?.studentIDNumber, mono: true },
		{ label: 'Reason', value: p.penalty_type?.category },
		{ label: 'Computed', value: formatDateTime(p.computedAt) },
		{ label: 'Settled', value: p.settledAt ? formatDateTime(p.settledAt) : null },
		{ label: 'Loan due', value: p.loan ? formatDateTime(p.loan.dueDate) : null },
		{ label: 'Book returned', value: p.loan?.returnDate ? formatDateTime(p.loan.returnDate) : null },
		{ label: 'Loan', value: p.loan ? `#${p.loan.loanID} · ${p.loan.status}` : null },
		{ label: 'Accrual', value: p.loan && p.loan.status !== 'Returned' ? 'Still accruing until the book is back' : null, wide: true },
	]
})
</script>
