<template>
	<LibrarianTableShell :columns="['Student', 'Book', 'Type', 'Amount', 'Computed', 'Status', '']" :loading="loading"
		:empty="penalties.length === 0" empty-text="No fines recorded. Fines appear automatically when a loan is returned late." min-width="860px">
		<tr v-for="(penalty, index) in penalties" :key="penalty.penaltyID"
			class="row-fade-in border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-stone-50"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3">
				<LibrarianPersonCell :name="personName(penalty.loan?.student?.user)" :sub="penalty.loan?.student?.studentIDNumber" />
			</td>
			<td class="px-4 py-3">
				<LibrarianBookCell :title="penalty.loan?.copy?.book?.title ?? 'Removed book'" />
			</td>
			<td class="px-4 py-3 text-[13px] capitalize text-stone-600">{{ penalty.penalty_type?.category ?? '—' }}</td>
			<td class="font-data px-4 py-3 text-[13px] font-semibold text-stone-900">{{ formatPeso(penalty.amount) }}</td>
			<td class="font-data px-4 py-3 text-[12.5px] text-stone-500">{{ formatDate(penalty.computedAt) }}</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill :label="penalty.paymentStatus"
					:tone="penalty.paymentStatus === 'Paid' ? 'success' : 'danger'" />
			</td>
			<td class="px-4 py-3">
				<div v-if="penalty.paymentStatus === 'Unpaid'" class="flex justify-end">
					<ButtonsButton v-if="penalty.loan?.status === 'Returned'" variant="primary" size="sm"
						@click="emit('settle', penalty)">
						Mark paid
					</ButtonsButton>
					<span v-else class="text-[11.5px] text-stone-400">Still accruing</span>
				</div>
			</td>
		</tr>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { PenaltyRecord } from '~/services/circulationService'

defineProps<{
	penalties: PenaltyRecord[]
	loading: boolean
}>()

const emit = defineEmits<{ (e: 'settle', penalty: PenaltyRecord): void }>()
</script>
