<template>
	<LibrarianTableShell :columns="['Student', 'Book', 'Type', 'Amount', 'Computed', 'Status', 'Receipt no.', '']" :loading="loading"
		:empty="penalties.length === 0" empty-text="No fines recorded. Fines appear automatically when a loan is returned late." min-width="860px">
		<!-- Phones: one card per row, with the row's buttons on it. -->
		<template #cards>
			<li v-for="penalty in penalties" :key="`card-${penalty.penaltyID}`">
				<div role="button" tabindex="0" class="px-4 py-3.5 transition-colors active:bg-accent-50" :class="{ 'bg-red-50/60': isLongUnpaid(penalty) }"
					@click="selected = penalty" @keydown.enter.self="selected = penalty">
					<div class="flex items-start justify-between gap-3">
						<LibrarianPersonCell :name="personName(penalty.loan?.student?.user)" :sub="penalty.loan?.student?.studentIDNumber" />
						<LibrarianStatusPill :label="penalty.paymentStatus" :tone="penalty.paymentStatus === 'Paid' ? 'success' : 'danger'" class="shrink-0" />
					</div>
					<p class="mt-2 text-[14.5px] font-semibold leading-snug text-stone-900">{{ penalty.loan?.copy?.book?.title ?? 'Removed book' }}</p>
					<div class="mt-1 flex items-center justify-between gap-3">
						<p class="text-[12.5px] capitalize text-stone-500">{{ penalty.penalty_type?.category ?? '—' }} · {{ formatDate(penalty.computedAt) }}<template v-if="penalty.receiptNumber"> · <span class="font-data normal-case">{{ penalty.receiptNumber }}</span></template></p>
						<p class="font-data text-[16px] font-bold text-stone-900">{{ formatPeso(penalty.amount) }}</p>
					</div>
					<p v-if="unpaidLabel(penalty)" class="mt-1 text-[12.5px]"
						:class="isLongUnpaid(penalty) ? 'font-semibold text-red-600' : 'text-stone-500'">{{ unpaidLabel(penalty) }}</p>
					<div v-if="penalty.paymentStatus === 'Unpaid'" class="mt-3" @click.stop>
						<ButtonsButton v-if="penalty.loan?.status === 'Returned'" variant="primary" class="w-full" @click="emit('settle', penalty)">Mark paid</ButtonsButton>
						<p v-else class="text-center text-[12.5px] text-stone-400">Still accruing</p>
					</div>
				</div>
			</li>
		</template>
		<tr v-for="(penalty, index) in penalties" :key="penalty.penaltyID" tabindex="0"
			class="row-fade-in cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			:class="{ 'bg-red-50/60': isLongUnpaid(penalty) }"
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
				<p v-if="unpaidLabel(penalty)" class="mt-1 text-[12px]"
					:class="isLongUnpaid(penalty) ? 'font-semibold text-red-600' : 'text-stone-400'">{{ unpaidLabel(penalty) }}</p>
			</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-700">{{ penalty.receiptNumber || '—' }}</td>
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
			:fields="penaltyFields" @close="selected = null">
			<template v-if="selected && selected.paymentStatus === 'Unpaid' && selected.loan?.status === 'Returned'" #footer>
				<ButtonsButton variant="primary" class="w-full" @click="settleSelected(selected)">Mark paid</ButtonsButton>
			</template>
		</LibrarianRecordDrawer>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { PenaltyRecord } from '~/services/circulationService'

const props = withDefaults(defineProps<{
	penalties: PenaltyRecord[]
	loading: boolean
	/** Unpaid this many days after the book came back, a fine is flagged. */
	longUnpaidDays?: number
}>(), { longUnpaidDays: 30 })

// A fine is payable once its book is back, so it counts as unpaid from the return date.
function unpaidDays(p: PenaltyRecord): number | null {
	if (p.paymentStatus !== 'Unpaid' || p.loan?.status !== 'Returned' || !p.loan.returnDate) return null
	return Math.max(0, Math.floor((Date.now() - new Date(p.loan.returnDate).getTime()) / 86_400_000))
}
function isLongUnpaid(p: PenaltyRecord): boolean {
	const days = unpaidDays(p)
	return days !== null && days >= props.longUnpaidDays
}
function unpaidLabel(p: PenaltyRecord): string | null {
	const days = unpaidDays(p)
	if (days === null) return null
	if (days === 0) return 'Unpaid since today'
	return `Unpaid for ${days} day${days === 1 ? '' : 's'}`
}

const emit = defineEmits<{ (e: 'settle', penalty: PenaltyRecord): void }>()

const selected = ref<PenaltyRecord | null>(null)

// The details panel's button closes it, then starts the same flow as the row's button.
function settleSelected(p: PenaltyRecord) { selected.value = null; emit('settle', p) }
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
		{ label: 'Receipt no.', value: p.receiptNumber, mono: true },
		{ label: 'Unpaid for', value: unpaidLabel(p) ? unpaidLabel(p)!.replace(/^Unpaid (for|since) /, '') : null },
		{ label: 'Loan due', value: p.loan ? formatDateTime(p.loan.dueDate) : null },
		{ label: 'Book returned', value: p.loan?.returnDate ? formatDateTime(p.loan.returnDate) : null },
		{ label: 'Loan', value: p.loan ? `#${p.loan.loanID} · ${p.loan.status}` : null },
		{ label: 'Accrual', value: p.loan && p.loan.status !== 'Returned' ? 'Still accruing until the book is back' : null, wide: true },
	]
})
</script>
