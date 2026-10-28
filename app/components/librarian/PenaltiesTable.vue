<template>
	<LibrarianTableShell :columns="['Student', 'Book', 'Type', 'Amount', 'Issued', 'Status', 'Receipt no.', '']" :loading="loading"
		:empty="penalties.length === 0" :empty-text="emptyText" min-width="860px">
		<!-- Phones: one card per row, with the row's buttons on it. -->
		<template #cards>
			<li v-for="penalty in penalties" :key="`card-${penalty.penaltyID}`">
				<div role="button" tabindex="0" class="px-4 py-3.5 transition-colors active:bg-accent-50" :class="{ 'bg-red-50/60': isLongUnpaid(penalty) }"
					@click="selected = penalty" @keydown.enter.self="selected = penalty">
					<div class="flex items-start justify-between gap-3">
						<LibrarianPersonCell :name="personName(penaltyStudent(penalty)?.user)" :sub="penaltyStudent(penalty)?.studentIDNumber" />
						<LibrarianStatusPill :label="penalty.paymentStatus" :tone="statusTone(penalty)" class="shrink-0" />
					</div>
					<p class="mt-2 text-[14.5px] font-semibold leading-snug text-stone-900">{{ bookTitle(penalty) }}</p>
					<div class="mt-1 flex items-center justify-between gap-3">
						<p class="text-[12.5px] capitalize text-stone-500">{{ penalty.penalty_type?.category ?? '—' }}<template v-if="penaltyCopy(penalty)"> · acc. {{ penaltyCopy(penalty)!.accessionNumber }}</template> · {{ formatDate(penalty.computedAt) }}<template v-if="penalty.receiptNumber"> · <span class="font-data normal-case">{{ penalty.receiptNumber }}</span></template></p>
						<p class="font-data text-[16px] font-bold text-stone-900">{{ formatPeso(penalty.amount) }}</p>
					</div>
					<p v-if="unpaidLabel(penalty)" class="mt-1 text-[12.5px]"
						:class="isLongUnpaid(penalty) ? 'font-semibold text-red-600' : 'text-stone-500'">{{ unpaidLabel(penalty) }}</p>
					<div v-if="penalty.paymentStatus === 'Unpaid'" class="mt-3" @click.stop>
						<div v-if="isCopyPenalty(penalty)" class="flex items-center gap-2">
							<ButtonsButton variant="primary" class="flex-1" @click="emit('settle', penalty)">Mark paid</ButtonsButton>
							<ButtonsButton variant="ghost" class="flex-1" @click="emit('replace', penalty)">Replaced</ButtonsButton>
							<LibrarianRowMenu :items="menu(penalty)" :label="`More actions for ${bookTitle(penalty)}`" @select="() => emit('cancel', penalty)" />
						</div>
						<ButtonsButton v-else-if="penalty.loan?.status === 'Returned'" variant="primary" class="w-full" @click="emit('settle', penalty)">Mark paid</ButtonsButton>
						<p v-else class="text-center text-[12.5px] text-stone-500">Still accruing</p>
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
				<LibrarianPersonCell :name="personName(penaltyStudent(penalty)?.user)" :sub="penaltyStudent(penalty)?.studentIDNumber" />
			</td>
			<td class="px-4 py-3">
				<LibrarianBookCell :title="bookTitle(penalty)" :sub="penaltyCopy(penalty) ? `Accession no. ${penaltyCopy(penalty)!.accessionNumber}` : undefined" />
			</td>
			<td class="px-4 py-3 text-[14px] capitalize text-stone-600">{{ penalty.penalty_type?.category ?? '—' }}</td>
			<td class="font-data px-4 py-3 text-[14px] font-semibold text-stone-900">{{ formatPeso(penalty.amount) }}</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ formatDate(penalty.computedAt) }}</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill :label="penalty.paymentStatus" :tone="statusTone(penalty)" />
				<p v-if="unpaidLabel(penalty)" class="mt-1 text-[12px]"
					:class="isLongUnpaid(penalty) ? 'font-semibold text-red-600' : 'text-stone-500'">{{ unpaidLabel(penalty) }}</p>
			</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-700">{{ penalty.receiptNumber || '—' }}</td>
			<td class="px-4 py-3" @click.stop>
				<div v-if="penalty.paymentStatus === 'Unpaid'" class="flex items-center justify-end gap-1.5">
					<template v-if="isCopyPenalty(penalty)">
						<ButtonsButton variant="primary" size="sm" @click="emit('settle', penalty)">Mark paid</ButtonsButton>
						<ButtonsButton variant="ghost" size="sm" @click="emit('replace', penalty)">Replaced</ButtonsButton>
						<LibrarianRowMenu :items="menu(penalty)" :label="`More actions for ${bookTitle(penalty)}`" @select="() => emit('cancel', penalty)" />
					</template>
					<ButtonsButton v-else-if="penalty.loan?.status === 'Returned'" variant="primary" size="sm"
						@click="emit('settle', penalty)">
						Mark paid
					</ButtonsButton>
					<span v-else class="text-[12.5px] text-stone-500">Still accruing</span>
				</div>
			</td>
		</tr>

		<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" :heading="selected && isCopyPenalty(selected) ? 'Penalty details' : 'Fine details'" :title="selected ? formatPeso(selected.amount) : ''"
			:subtitle="selected ? bookTitle(selected) : ''"
			:status="selected ? { label: selected.paymentStatus, tone: statusTone(selected) } : undefined"
			:fields="penaltyFields" @close="selected = null">
			<template v-if="selected && selected.paymentStatus === 'Unpaid' && (isCopyPenalty(selected) || selected.loan?.status === 'Returned')" #footer>
				<div class="flex w-full gap-2">
					<ButtonsButton variant="primary" class="flex-1" @click="settleSelected(selected)">Mark paid</ButtonsButton>
					<ButtonsButton v-if="isCopyPenalty(selected)" variant="ghost" class="flex-1" @click="replaceSelected(selected)">Replaced</ButtonsButton>
				</div>
			</template>
		</LibrarianRecordDrawer>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import { isCopyPenalty, penaltyCopy, penaltyStudent, type PenaltyRecord } from '~/services/circulationService'

const props = withDefaults(defineProps<{
	penalties: PenaltyRecord[]
	loading: boolean
	/** Unpaid this many days after the book came back, a fine is flagged. */
	longUnpaidDays?: number
	emptyText?: string
}>(), {
	longUnpaidDays: 30,
	emptyText: 'No fines recorded. Fines appear automatically when a loan is returned late.',
})

const emit = defineEmits<{
	(e: 'settle', penalty: PenaltyRecord): void
	/** Only for a lost or damaged book: the student brought a replacement instead of paying. */
	(e: 'replace', penalty: PenaltyRecord): void
	/** Only for a lost or damaged book: it turned up (or was repaired), so the unpaid penalty is cancelled. */
	(e: 'cancel', penalty: PenaltyRecord): void
}>()

function bookTitle(p: PenaltyRecord): string {
	return penaltyCopy(p)?.book?.title ?? 'Removed book'
}

function statusTone(p: PenaltyRecord): 'success' | 'info' | 'danger' {
	return p.paymentStatus === 'Paid' ? 'success' : p.paymentStatus === 'Replaced' ? 'info' : 'danger'
}

// The row's own menu: the way out when the book turns up (lost) or is fixed (damaged).
function menu(p: PenaltyRecord) {
	return [{
		key: 'cancel',
		label: p.penalty_type?.category === 'lost' ? 'Book was found: cancel penalty' : 'Book was repaired: cancel penalty',
		icon: 'i-tabler-arrow-back-up',
		tone: 'success' as const,
	}]
}

// A late fee is payable once its book is back, so it counts as unpaid from the return date. A lost/damaged penalty
// is payable the moment it is issued.
function unpaidDays(p: PenaltyRecord): number | null {
	if (p.paymentStatus !== 'Unpaid') return null
	const since = isCopyPenalty(p) ? p.computedAt : p.loan?.status === 'Returned' ? p.loan.returnDate : null
	if (!since) return null
	return Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000))
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

const selected = ref<PenaltyRecord | null>(null)

// The details panel's buttons close it, then start the same flow as the row's buttons.
function settleSelected(p: PenaltyRecord) { selected.value = null; emit('settle', p) }
function replaceSelected(p: PenaltyRecord) { selected.value = null; emit('replace', p) }

const penaltyFields = computed(() => {
	const p = selected.value
	if (!p) return []
	const student = penaltyStudent(p)
	const copy = penaltyCopy(p)
	return [
		{ label: 'Student', value: personName(student?.user), wide: true },
		{ label: 'Student ID', value: student?.studentIDNumber, mono: true },
		{ label: 'Reason', value: p.penalty_type?.category },
		{ label: 'Accession no.', value: copy ? String(copy.accessionNumber) : null, mono: true },
		{ label: 'Issued', value: formatDateTime(p.computedAt) },
		{ label: p.paymentStatus === 'Replaced' ? 'Replaced' : 'Settled', value: p.settledAt ? formatDateTime(p.settledAt) : null },
		{ label: 'Receipt no.', value: p.receiptNumber, mono: true },
		{ label: 'Unpaid for', value: unpaidLabel(p) ? unpaidLabel(p)!.replace(/^Unpaid (for|since) /, '') : null },
		{ label: 'Loan due', value: p.loan ? formatDateTime(p.loan.dueDate) : null },
		{ label: 'Book returned', value: p.loan?.returnDate ? formatDateTime(p.loan.returnDate) : null },
		{ label: 'Loan', value: p.loan ? `#${p.loan.loanID} · ${p.loan.status}` : (isCopyPenalty(p) ? 'None (lost or damaged in the library)' : null) },
		{ label: 'Accrual', value: p.loan && !isCopyPenalty(p) && p.loan.status !== 'Returned' ? 'Still accruing until the book is back' : null, wide: true },
	]
})
</script>
