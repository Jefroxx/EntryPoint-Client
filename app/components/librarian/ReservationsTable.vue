<template>
	<div>
		<LibrarianCardSkeleton v-if="loading" />

		<!-- One card per student. Each book they reserved gets a row with enough to recognise it (cover, author, where it
			 stands); the button opens the pop-up where the desk accepts, rejects and checks out. -->
		<ul v-else-if="groups.length" class="grid auto-rows-fr gap-3 lg:grid-cols-2 2xl:grid-cols-3">
			<li v-for="group in groups" :key="group.key" class="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white">
				<div class="flex items-center gap-3 px-4 pb-2.5 pt-3.5">
					<LibrarianStudentAvatar :name="personName(group.student?.user)" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-[15.5px] font-semibold leading-tight text-stone-900">{{ personName(group.student?.user) }}</p>
						<p class="font-data truncate text-[12px] text-stone-500">{{ group.student?.memberIDNumber ?? '—' }}</p>
					</div>
					<span class="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[12.5px] font-semibold text-stone-600">
						{{ group.items.length }} {{ group.items.length === 1 ? 'book' : 'books' }}
					</span>
				</div>

				<ul class="flex-1">
					<li v-for="reservation in group.items" :key="reservation.reservationID" class="flex items-center gap-3 border-t border-stone-100 px-4 py-2.5">
						<StudentCover :book="reservation.book ?? { title: 'Removed book' }" :width="34" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-[14px] font-semibold leading-snug text-stone-900" :title="reservation.book?.title">{{ reservation.book?.title ?? 'Removed book' }}</p>
							<!-- One short line: where it stands, its place in the queue, and how many copies are free. The rest is in the pop-up. -->
							<p class="mt-0.5 flex items-center gap-1.5 text-[12px] font-semibold" :class="reservationLook[reservation.status].text">
								<span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="reservationLook[reservation.status].dot" aria-hidden="true" />
								<span class="truncate">
									{{ reservationLook[reservation.status].short }}
									<template v-if="queuePositions[reservation.reservationID]"><span class="font-medium text-stone-500">· #{{ queuePositions[reservation.reservationID] }}</span></template>
									<template v-if="(reservation.status === 'Waiting' || reservation.status === 'Accepted') && reservation.copiesTotal !== undefined">
										<span class="font-medium" :class="reservation.copiesFree ? 'text-stone-500' : 'text-red-600'">· {{ reservation.copiesFree ? `${reservation.copiesFree} of ${reservation.copiesTotal} available` : `0 of ${reservation.copiesTotal} available` }}</span>
									</template>
								</span>
							</p>
						</div>
					</li>
				</ul>

				<div v-if="group.waiting || group.ready" class="px-4 pb-3.5 pt-1.5">
					<ButtonsButton :variant="group.waiting ? 'primary' : 'ghost'" class="w-full !h-12 !text-[15.5px] !font-bold" @click="emit('review', group.key)">
						<Icon :name="group.waiting ? 'i-tabler-checklist' : 'i-tabler-scan'" class="h-5 w-5" />
						{{ group.waiting ? `Review ${group.waiting} waiting` : `Check out ${group.ready} ready` }}
					</ButtonsButton>
				</div>
			</li>
		</ul>

		<p v-else class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[15px] text-stone-500">No reservations match your filters.</p>
	</div>
</template>

<script setup lang="ts">
import type { ReservationRecord } from '~/services/circulationService'

const props = defineProps<{
	reservations: ReservationRecord[]
	queuePositions: Record<number, number>
	loading: boolean
}>()

const emit = defineEmits<{
	/** Open the pop-up for one student (their key, see studentKey). */
	(e: 'review', key: string): void
}>()

/** What makes two reservations "the same student's"; the page uses the same rule to find a card's reservations again. */
function studentKey(reservation: ReservationRecord): string {
	return reservation.student?.memberIDNumber ?? `reservation-${reservation.reservationID}`
}

// One card per student, in the order each student first appears in the list (oldest reservation first).
const groups = computed(() => {
	const byStudent = new Map<string, { key: string; student: ReservationRecord['student']; items: ReservationRecord[] }>()
	for (const reservation of props.reservations) {
		const key = studentKey(reservation)
		const group = byStudent.get(key) ?? { key, student: reservation.student, items: [] }
		group.items.push(reservation)
		byStudent.set(key, group)
	}
	return [...byStudent.values()].map((group) => ({
		...group,
		waiting: group.items.filter((r) => r.status === 'Waiting').length,
		ready: group.items.filter((r) => r.status === 'Accepted').length,
	}))
})
</script>
