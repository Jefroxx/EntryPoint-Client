<template>
	<!-- One screen in two steps. Step 1 picks, step 2 confirms: the title, the rows, the covers and the footer buttons stay
		 where they are, so the only things that change are the heading, the tick boxes and the wording on the buttons. -->
	<LibrarianModalShell :open="open" size="xl" :title="title" :subtitle="subtitle" :busy="busy" @close="emit('close')">
		<div class="space-y-6">
			<section v-if="waiting.length" aria-labelledby="review-waiting">
				<div class="mb-2.5 flex min-h-[34px] items-center justify-between gap-3">
					<h3 id="review-waiting" class="text-[14.5px] font-bold text-stone-900">
						<template v-if="confirming">{{ confirming === 'accept' ? 'Accepting' : 'Rejecting' }} <span class="font-medium text-stone-500">({{ pickedItems.length }} of {{ waiting.length }})</span></template>
						<template v-else>Waiting for review <span class="font-medium text-stone-500">({{ waiting.length }})</span></template>
					</h3>
					<button v-if="!confirming && waiting.length > 1" type="button" class="rounded-lg px-2.5 py-1.5 text-[13.5px] font-semibold text-accent-500 hover:bg-accent-50" @click="toggleAll">
						{{ allPicked ? 'Clear selection' : 'Select all' }}
					</button>
				</div>

				<ul class="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200">
					<li v-for="r in shownWaiting" :key="r.reservationID">
						<component :is="confirming ? 'div' : 'label'" class="flex items-start gap-4 px-4 py-4 sm:px-5"
							:class="confirming ? 'bg-accent-50/60' : [ 'cursor-pointer transition-colors hover:bg-stone-50', picked.has(r.reservationID) ? 'bg-accent-50/60' : '' ]">
							<input v-if="!confirming" type="checkbox" class="mt-1 h-5 w-5 shrink-0 accent-accent-500" :checked="picked.has(r.reservationID)" :disabled="busy"
								@change="toggle(r.reservationID)" />
							<StudentCover :book="r.book ?? { title: 'Removed book' }" :width="64" />
							<span class="min-w-0 flex-1">
								<span class="block text-[16px] font-semibold leading-snug text-stone-900">{{ r.book?.title ?? 'Removed book' }}</span>
								<span v-if="reservedAuthors(r.book)" class="mt-0.5 block text-[13.5px] text-stone-500">{{ reservedAuthors(r.book) }}</span>
								<span v-if="r.book?.classNumber || r.book?.subject" class="mt-0.5 block text-[12.5px] text-stone-500">
									<span v-if="r.book?.subject">{{ r.book.subject.name }}</span><template v-if="r.book?.subject && r.book?.classNumber"> · </template><span v-if="r.book?.classNumber" class="font-data">{{ r.book.classNumber }}</span>
								</span>
								<span class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
									<span v-if="queuePositions[r.reservationID]" class="inline-flex h-5 items-center rounded-full bg-accent-100 px-2 text-[12px] font-bold text-accent-700">#{{ queuePositions[r.reservationID] }} in line</span>
									<span class="text-stone-500">Reserved {{ formatDateTime(r.reservedAt) }}</span>
									<span class="font-medium" :class="r.copiesFree ? 'text-stone-700' : 'text-red-600'">{{ copiesFreeLine(r.copiesFree, r.copiesTotal) }}</span>
								</span>
								<span v-if="r.acceptBlock && !confirming" class="mt-2 block rounded-lg bg-amber-50 px-3 py-2 text-[13px] leading-snug text-amber-800">{{ r.acceptBlock }}</span>
							</span>
						</component>
					</li>
				</ul>

				<!-- Step 2 only: what happens next, right under the same list. -->
				<p v-if="confirming" role="alert" class="mt-3 rounded-xl px-4 py-3.5 text-[14.5px] leading-snug" :class="confirming === 'reject' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-900'">
					<template v-if="confirming === 'accept'">
						<b>Accept {{ pickedItems.length === 1 ? 'this reservation' : `these ${pickedItems.length} reservations` }}?</b>
						A copy of {{ pickedItems.length === 1 ? 'the book is' : 'each book is' }} held for {{ studentName }}, and they are told {{ pickedItems.length === 1 ? 'it is' : 'they are' }} ready for pickup.
					</template>
					<template v-else>
						<b>Reject {{ pickedItems.length === 1 ? 'this reservation' : `these ${pickedItems.length} reservations` }}?</b>
						{{ studentName }} is told {{ pickedItems.length === 1 ? 'it was' : 'they were' }} declined and no copy is held. This can't be undone.
					</template>
				</p>
			</section>

			<!-- Accepted: the copy is held; each one is checked out on its own (the slip has its own code). -->
			<section v-if="ready.length && !confirming" aria-labelledby="review-ready">
				<h3 id="review-ready" class="mb-2.5 text-[14.5px] font-bold text-stone-900">Ready for pickup <span class="font-medium text-stone-500">({{ ready.length }})</span></h3>
				<ul class="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200">
					<li v-for="r in ready" :key="r.reservationID" class="flex items-center gap-4 px-4 py-4 sm:px-5">
						<StudentCover :book="r.book ?? { title: 'Removed book' }" :width="64" />
						<span class="min-w-0 flex-1">
							<span class="block text-[16px] font-semibold leading-snug text-stone-900">{{ r.book?.title ?? 'Removed book' }}</span>
							<span v-if="reservedAuthors(r.book)" class="mt-0.5 block text-[13.5px] text-stone-500">{{ reservedAuthors(r.book) }}</span>
							<span class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
								<span class="inline-flex items-center gap-1.5 font-semibold text-emerald-700"><span class="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />Ready for pickup</span>
								<span class="text-stone-500">Reserved {{ formatDateTime(r.reservedAt) }}</span>
								<span v-if="r.pickupCode" class="font-data text-stone-500">{{ r.pickupCode }}</span>
							</span>
						</span>
						<ButtonsButton variant="primary" class="shrink-0 !h-11" :disabled="busy" @click="emit('checkout', r)">
							<Icon name="i-tabler-scan" class="h-4 w-4" />Check out
						</ButtonsButton>
					</li>
				</ul>
			</section>

			<p v-if="!waiting.length && !ready.length" class="rounded-xl bg-stone-50 px-4 py-10 text-center text-[14.5px] text-stone-500">
				Nothing left to do for this student.
			</p>
		</div>

		<!-- The two buttons keep their places in both steps: the quiet one on the left, the main one on the right. -->
		<template v-if="waiting.length" #footer>
			<template v-if="confirming">
				<ButtonsButton variant="ghost" :disabled="busy" @click="confirming = null">Back</ButtonsButton>
				<ButtonsButton :variant="confirming === 'reject' ? 'danger' : 'primary'" :disabled="busy" @click="confirm">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					{{ confirming === 'accept' ? 'Yes, accept' : 'Yes, reject' }}{{ pickedItems.length > 1 ? ` (${pickedItems.length})` : '' }}
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="ghost" class="!text-red-600" :disabled="busy || !pickedItems.length" @click="confirming = 'reject'">
					Reject{{ pickedItems.length ? ` (${pickedItems.length})` : '' }}
				</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy || !pickedItems.length || !!blockedPicked.length" :title="blockedPicked.length ? 'Untick the ones that can\'t be accepted yet.' : undefined"
					@click="confirming = 'accept'">
					Accept{{ pickedItems.length ? ` (${pickedItems.length})` : '' }}
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { ReservationRecord } from '~/services/circulationService'

const props = defineProps<{
	open: boolean
	/** One student's reservations that are still open (waiting or accepted), live from the page. */
	items: ReservationRecord[]
	queuePositions: Record<number, number>
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'accept' | 'reject', reservations: ReservationRecord[]): void
	(e: 'checkout', reservation: ReservationRecord): void
}>()

const waiting = computed(() => props.items.filter((r) => r.status === 'Waiting'))
const ready = computed(() => props.items.filter((r) => r.status === 'Accepted'))
const student = computed(() => props.items[0]?.student ?? null)
const studentName = computed(() => (student.value ? personName(student.value.user) : 'this student'))

const picked = ref(new Set<number>())
// null = choosing; 'accept' / 'reject' = the confirmation step, in this same window.
const confirming = ref<'accept' | 'reject' | null>(null)

const pickedItems = computed(() => waiting.value.filter((r) => picked.value.has(r.reservationID)))
const blockedPicked = computed(() => pickedItems.value.filter((r) => !!r.acceptBlock))
const allPicked = computed(() => waiting.value.length > 0 && pickedItems.value.length === waiting.value.length)
// Step 1 lists every waiting reservation; step 2 lists the same rows, only the ones being decided on.
const shownWaiting = computed(() => (confirming.value ? pickedItems.value : waiting.value))

// The same title and subtitle in both steps.
const title = computed(() => (student.value ? personName(student.value.user) : 'Reservations'))
const subtitle = computed(() => {
	const id = student.value?.studentIDNumber
	const open = props.items.length
	return `${id ? `${id} · ` : ''}${open} open ${open === 1 ? 'reservation' : 'reservations'}`
})

function toggle(id: number) {
	const next = new Set(picked.value)
	if (next.has(id)) next.delete(id)
	else next.add(id)
	picked.value = next
}

function toggleAll() {
	picked.value = allPicked.value ? new Set() : new Set(waiting.value.map((r) => r.reservationID))
}

// The "Yes" of step 2: the page does the work, one reservation at a time.
function confirm() {
	if (confirming.value === 'accept') emit('accept', pickedItems.value)
	else if (confirming.value === 'reject') emit('reject', pickedItems.value)
}

// Opening starts with every reservation that can be accepted already ticked, so the common case is one tap.
watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	confirming.value = null
	picked.value = new Set(waiting.value.filter((r) => !r.acceptBlock).map((r) => r.reservationID))
}, { immediate: true })

// After accepting or rejecting some, the page reloads the list: drop ticks for rows that are no longer waiting
// and go back to step 1 so what is left (or what is now ready for pickup) is in view.
watch(waiting, (rows) => {
	const still = new Set(rows.map((r) => r.reservationID))
	picked.value = new Set([...picked.value].filter((id) => still.has(id)))
	confirming.value = null
})
</script>
