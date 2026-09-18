<template>
	<LibrarianTableShell :columns="['Queue', 'Student', 'Book', 'Reserved At', 'Status', '']" :loading="loading"
		:empty="reservations.length === 0" empty-text="No reservations match your filters.">
		<tr v-for="(reservation, index) in reservations" :key="reservation.reservationID"
			class="row-fade-in border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-stone-50"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3">
				<span v-if="queuePositions[reservation.reservationID]"
					class="inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-accent-100 px-1.5 text-[11px] font-bold text-accent-700">
					#{{ queuePositions[reservation.reservationID] }}
				</span>
				<span v-else class="text-stone-300">—</span>
			</td>
			<td class="px-4 py-3">
				<LibrarianPersonCell :name="personName(reservation.student?.user)" :sub="reservation.student?.studentIDNumber" />
			</td>
			<td class="px-4 py-3">
				<LibrarianBookCell :title="reservation.book?.title ?? 'Removed book'" />
			</td>
			<td class="font-data px-4 py-3 text-[12.5px] text-stone-500">{{ formatDateTime(reservation.reservedAt) }}</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill :label="reservation.status" :tone="tones[reservation.status]" />
			</td>
			<td class="px-4 py-3">
				<div v-if="reservation.status === 'Waiting'" class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="primary" size="sm" @click="emit('accept', reservation)">Accept</ButtonsButton>
					<ButtonsButton variant="danger" size="sm" @click="emit('reject', reservation)">Reject</ButtonsButton>
				</div>
			</td>
		</tr>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { ReservationRecord, ReservationStatus } from '~/services/circulationService'

defineProps<{
	reservations: ReservationRecord[]
	queuePositions: Record<number, number>
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'accept', reservation: ReservationRecord): void
	(e: 'reject', reservation: ReservationRecord): void
}>()

const tones: Record<ReservationStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
	Waiting: 'warning',
	Accepted: 'success',
	Rejected: 'danger',
	Fulfilled: 'neutral',
}
</script>
