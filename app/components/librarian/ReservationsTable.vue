<template>
	<LibrarianTableShell :columns="['Queue', 'Student', 'Book', 'Reserved At', 'Status', '']" :loading="loading"
		:empty="reservations.length === 0" empty-text="No reservations match your filters.">
		<tr v-for="(reservation, index) in reservations" :key="reservation.reservationID" tabindex="0"
			class="row-fade-in cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			@click="selected = reservation" @keydown.enter.self="selected = reservation"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3">
				<span v-if="queuePositions[reservation.reservationID]"
					class="inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-accent-100 px-1.5 text-[12px] font-bold text-accent-700">
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
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ formatDateTime(reservation.reservedAt) }}</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill :label="reservation.status" :tone="tones[reservation.status]" />
			</td>
			<td class="px-4 py-3" @click.stop>
				<div v-if="reservation.status === 'Waiting'" class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="primary" size="sm" :disabled="!!reservation.acceptBlock"
						:class="reservation.acceptBlock ? '!border-stone-200 !bg-stone-200 !text-stone-400 !opacity-100 !shadow-none hover:!bg-stone-200 active:!scale-100' : ''"
						:title="reservation.acceptBlock ?? undefined"
						@click="emit('accept', reservation)">Accept</ButtonsButton>
					<ButtonsButton variant="danger" size="sm" @click="emit('reject', reservation)">Reject</ButtonsButton>
				</div>
				<!-- Accepted: the copy is held for the student, and the slip they bring has its own code. -->
				<div v-else-if="reservation.status === 'Accepted'" class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="primary" size="sm" @click="emit('checkout', reservation)">
						<Icon name="i-tabler-scan" class="h-3.5 w-3.5" />Checkout
					</ButtonsButton>
				</div>
			</td>
		</tr>

		<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Reservation details" :title="selected?.book?.title ?? 'Removed book'"
			:subtitle="selected ? `Reservation #${selected.reservationID}` : ''"
			:status="selected ? { label: selected.status, tone: tones[selected.status] } : undefined"
			:fields="reservationFields" @close="selected = null" />
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { ReservationRecord, ReservationStatus } from '~/services/circulationService'

const props = defineProps<{
	reservations: ReservationRecord[]
	queuePositions: Record<number, number>
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'accept' | 'checkout', reservation: ReservationRecord): void
	(e: 'reject', reservation: ReservationRecord): void
}>()

const selected = ref<ReservationRecord | null>(null)

const reservationFields = computed(() => {
	const r = selected.value
	if (!r) return []
	return [
		{ label: 'Student', value: personName(r.student?.user), wide: true },
		{ label: 'Student ID', value: r.student?.studentIDNumber, mono: true },
		{ label: 'Program', value: r.student?.academicProgram },
		{ label: 'Reserved', value: formatDateTime(r.reservedAt) },
		{ label: 'Queue position', value: props.queuePositions[r.reservationID] ? `#${props.queuePositions[r.reservationID]}` : null },
		{ label: 'Pickup code', value: r.pickupCode, mono: true },
		{ label: 'Can it be accepted?', value: r.status === 'Waiting' ? (r.acceptBlock ?? 'Yes') : null, wide: true },
	]
})

const tones: Record<ReservationStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
	Waiting: 'warning',
	Accepted: 'success',
	Rejected: 'danger',
	Fulfilled: 'neutral',
}
</script>
