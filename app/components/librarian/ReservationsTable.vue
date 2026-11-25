<template>
	<div>
		<LibrarianCardSkeleton v-if="loading" />

		<!-- One card per student. Each book they reserved gets a row with enough to recognise it (cover, author, where it
			 stands); the button opens the pop-up where the desk accepts, rejects and checks out. -->
		<ul v-else-if="groups.length" class="grid items-stretch gap-3 lg:grid-cols-2 2xl:grid-cols-3">
			<!-- The whole card opens the student's reservations (every state, so a finished one can be looked at too); the button is the same thing, spelled out. -->
			<li v-for="group in groups" :key="group.key"
				class="relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-shadow duration-150 hover:shadow-card">
				<button type="button" class="card-cover" :aria-label="`Open the reservations of ${personName(group.student?.user)}`" @click="emit('review', group.key)" />
				<div class="card-body flex flex-1 flex-col">
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

					<!-- Room for the most books a student can hold, so cards sitting side by side are the same size whatever they hold. One column (phone, tablet) has nothing to line up, so there each card is only as tall as its books. -->
					<ul class="flex-1 lg:min-h-[var(--rows-h)]" :style="{ '--rows-h': `${rowSlots * ROW_HEIGHT}px` }">
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
										<!-- Only a waiting one is about free copies; a ready one already has its copy set aside. -->
									<template v-if="reservation.status === 'Waiting' && reservation.copiesTotal !== undefined">
											<span class="font-medium" :class="reservation.copiesFree ? 'text-stone-500' : 'text-red-600'">· {{ reservation.copiesFree ? `${reservation.copiesFree} of ${reservation.copiesTotal} available` : `0 of ${reservation.copiesTotal} available` }}</span>
										</template>
									</span>
								</p>
							</div>
						</li>
					</ul>

					<div v-if="group.waiting || group.ready" class="card-action px-4 pb-3.5 pt-1.5">
						<ButtonsButton :variant="group.waiting ? 'primary' : 'ghost'" class="w-full !h-12 !text-[15.5px] !font-bold" @click="emit('review', group.key)">
							<Icon :name="group.waiting ? 'i-tabler-checklist' : 'i-tabler-scan'" class="h-5 w-5" />
							{{ group.waiting ? `Review ${group.waiting} waiting` : `Check out ${group.ready} ready` }}
						</ButtonsButton>
					</div>
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
	/** The most books one student can hold. Every card keeps room for that many. */
	maxBooks?: number
}>()

const emit = defineEmits<{
	/** Open the pop-up for one student (their key, see studentKey). */
	(e: 'review', key: string): void
}>()

/** What makes two reservations "the same student's"; the page uses the same rule to find a card's reservations again. */
function studentKey(reservation: ReservationRecord): string {
	return reservation.student?.memberIDNumber ?? `reservation-${reservation.reservationID}`
}

// Height of one book row on a card (cover, title and status line, with its padding).
const ROW_HEIGHT = 70

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

// Room for the most books a student can hold (or more, if a student somehow holds more than the limit now).
// A finished list (rejected, expired, checked out) has no buttons to line up, so it only needs room for its own biggest card.
const rowSlots = computed(() => {
	const biggest = Math.max(1, ...groups.value.map((group) => group.items.length))
	return groups.value.some((group) => group.waiting || group.ready) ? Math.max(props.maxBooks ?? 3, biggest) : biggest
})
</script>
