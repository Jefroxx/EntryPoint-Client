<template>
	<div>
		<div class="st-in mb-5 flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="dashboard-heading text-3xl font-bold text-amber-900">My books</h1>
				<p class="dashboard-heading mt-1 text-amber-900">What you've reserved, what you hold, and what you owe.</p>
			</div>
			<LibrarianSegmentedTabs v-model="tab" :tabs="tabs" />
		</div>

		<div class="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
			<div :key="tab" class="st-swap">
				<div v-if="pending && !data" class="space-y-3" aria-busy="true">
					<div v-for="n in 3" :key="n" class="h-[112px] animate-pulse rounded-2xl bg-stone-200/70" />
				</div>

				<!-- LOANS -->
				<template v-else-if="data && tab === 'loans'">
					<StudentEmptyState v-if="!openLoans.length" icon="i-tabler-book" title="Nothing borrowed"
						text="Books you borrow at the desk show up here.">
						<NuxtLink to="/student/discover"><ButtonsButton>Browse books</ButtonsButton></NuxtLink>
					</StudentEmptyState>

					<div v-else class="md:overflow-hidden md:rounded-2xl md:border md:border-stone-200 md:bg-white">
						<div class="hidden grid-cols-[minmax(0,2.4fr)_1fr_1.1fr_150px] gap-4 bg-stone-50 px-[18px] py-3 text-[11px] font-semibold uppercase tracking-[.06em] text-stone-400 md:grid">
							<span>Book</span><span>Borrowed</span><span>Status</span><span />
						</div>
						<div v-for="loan in openLoans" :key="loan.loanID"
							class="mb-2.5 rounded-2xl border border-stone-200 bg-white p-3.5 md:mb-0 md:grid md:grid-cols-[minmax(0,2.4fr)_1fr_1.1fr_150px] md:items-center md:gap-4 md:rounded-none md:border-0 md:border-t md:border-stone-100 md:px-[18px] md:py-3">
							<div class="flex min-w-0 items-center gap-3.5">
								<StudentCover :book="loan.book" :width="44" />
								<div class="min-w-0">
									<p class="text-[14.5px] font-semibold leading-tight text-stone-900">{{ loan.book.title }}</p>
									<p class="mt-0.5 truncate text-[12.5px] text-stone-400">{{ authorLine(loan.book) }}</p>
									<p class="mt-0.5 text-[12.5px] text-stone-400 md:hidden">Borrowed {{ formatDate(loan.checkoutDate) }} · Due {{ formatDate(loan.dueDate) }}</p>
									<div class="mt-2 md:hidden"><StudentPill :tone="loanTone(loan)">{{ loanLabel(loan) }}</StudentPill></div>
								</div>
							</div>
							<span class="hidden text-[12.5px] text-stone-400 md:block">{{ formatDate(loan.checkoutDate) }}</span>
							<div class="hidden md:block">
								<StudentPill :tone="loanTone(loan)">{{ loanLabel(loan) }}</StudentPill>
								<p class="mt-1 text-[12.5px] text-stone-400">Due {{ formatDate(loan.dueDate) }}</p>
							</div>
							<div class="mt-3 md:mt-0 md:flex md:justify-end">
								<p v-if="loan.status === 'Reported'" class="text-[12.5px] text-stone-400 md:max-w-[150px] md:text-right">Reported. A librarian will verify it.</p>
								<ButtonsButton v-else variant="ghost" size="sm" class="!h-10 w-full !border-accent-100 !bg-accent-100 !text-[14px] !text-accent-600 md:!h-8 md:w-auto md:!text-[13px]"
									@click="returning = loan">
									<Icon name="i-tabler-arrow-back-up" class="h-3.5 w-3.5" />I returned this
								</ButtonsButton>
							</div>
						</div>
					</div>

					<template v-if="returnedLoans.length">
						<h2 class="mb-2.5 mt-7 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">Returned</h2>
						<div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
							<div v-for="loan in returnedLoans" :key="loan.loanID" class="flex items-center gap-3.5 border-b border-stone-100 px-4 py-3 last:border-0">
								<StudentCover :book="loan.book" :width="36" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-[14px] font-semibold text-stone-900">{{ loan.book.title }}</p>
									<p class="text-[12.5px] text-stone-400">Returned {{ loan.returnDate ? formatDate(loan.returnDate) : '' }}</p>
								</div>
								<Icon name="i-tabler-check" class="h-4 w-4 text-emerald-600" />
							</div>
						</div>
					</template>
				</template>

				<!-- RESERVATIONS -->
				<template v-else-if="data && tab === 'reservations'">
					<div class="mb-3.5 flex items-start gap-2.5 rounded-2xl bg-accent-100 px-3.5 py-3 text-[13px] leading-snug text-accent-600">
						<Icon name="i-tabler-id" class="mt-px h-4 w-4 shrink-0" />
						<span>{{ slotsLeft }} of 3 reservation slots free. Books are handed over at the desk once accepted.</span>
					</div>

					<StudentEmptyState v-if="!activeReservations.length" icon="i-tabler-clock" title="No active reservations"
						text="Add books to your cart, then reserve them.">
						<NuxtLink to="/student/discover"><ButtonsButton>Find a book</ButtonsButton></NuxtLink>
					</StudentEmptyState>

					<TransitionGroup v-else tag="div" class="relative md:overflow-hidden md:rounded-2xl md:border md:border-stone-200 md:bg-white"
						leave-active-class="absolute inset-x-0 transition-[opacity,transform] duration-200 ease-out" leave-to-class="-translate-x-3 opacity-0"
						move-class="transition-transform duration-200 ease-out">
						<div v-for="r in activeReservations" :key="r.reservationID"
							class="mb-2.5 rounded-2xl border border-stone-200 bg-white p-3.5 md:mb-0 md:flex md:items-center md:gap-4 md:rounded-none md:border-0 md:border-b md:border-stone-100 md:px-[18px] md:py-3 md:last:border-0">
							<div class="flex min-w-0 flex-1 items-center gap-3.5">
								<StudentCover :book="briefOf(r.book)" :width="44" />
								<div class="min-w-0">
									<p class="text-[14.5px] font-semibold leading-tight text-stone-900">{{ r.book.title }}</p>
									<p class="mt-0.5 truncate text-[12.5px] text-stone-400">{{ authorLine(briefOf(r.book)) }} · Reserved {{ formatDate(r.reservedAt) }}</p>
									<div class="mt-2">
										<StudentPill v-if="r.status === 'Waiting'" tone="warn"><Icon name="i-tabler-clock" class="h-3 w-3" />#{{ r.queuePosition }} in line</StudentPill>
										<StudentPill v-else tone="good"><Icon name="i-tabler-check" class="h-3 w-3" />Ready for pickup</StudentPill>
									</div>
								</div>
							</div>
							<p class="mt-3 text-[12.5px] text-stone-400 md:mt-0 md:w-[210px]">
								{{ r.status === 'Waiting'
									? ((r.queuePosition ?? 1) > 1 ? `${(r.queuePosition ?? 1) - 1} ahead of you` : "You're next")
									: 'Bring your ID to the desk to collect it.' }}
							</p>
							<ButtonsButton v-if="r.status === 'Waiting'" variant="danger" size="sm" class="mt-3 !h-10 w-full !text-[14px] md:mt-0 md:!h-8 md:w-auto md:!text-[13px]"
								@click="cancelling = r">Cancel</ButtonsButton>
						</div>
					</TransitionGroup>

					<template v-if="pastReservations.length">
						<h2 class="mb-2.5 mt-7 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">Past</h2>
						<div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
							<div v-for="r in pastReservations" :key="r.reservationID" class="flex items-center gap-3.5 border-b border-stone-100 px-4 py-3 last:border-0">
								<StudentCover :book="briefOf(r.book)" :width="36" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-[14px] font-semibold text-stone-900">{{ r.book.title }}</p>
									<p class="text-[12.5px] text-stone-400">{{ formatDate(r.reservedAt) }}</p>
								</div>
								<StudentPill :tone="r.status === 'Fulfilled' ? 'good' : 'bad'">{{ r.status }}</StudentPill>
							</div>
						</div>
					</template>
				</template>

				<!-- FINES -->
				<template v-else-if="data && tab === 'fines'">
					<div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-[18px] text-center md:text-left">
						<div class="w-full md:w-auto">
							<p class="text-[12.5px] text-stone-400">Unpaid fines</p>
							<p class="dashboard-heading text-[36px] font-extrabold tabular-nums" :class="data.unpaidTotal ? 'text-red-600' : 'text-emerald-600'">{{ formatPeso(data.unpaidTotal) }}</p>
						</div>
						<p class="mx-auto max-w-[36ch] text-[12.5px] text-stone-400 md:mx-0">
							{{ data.unpaidTotal ? 'Fines are settled with a librarian at the desk, once the book is back.' : "You're all clear." }}
						</p>
					</div>

					<template v-if="data.penalties.length">
						<h2 class="mb-2.5 mt-7 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">History</h2>
						<div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
							<div v-for="f in data.penalties" :key="f.penaltyID" class="flex items-center gap-3.5 border-b border-stone-100 px-4 py-3.5 last:border-0">
								<span class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]" :class="f.paymentStatus === 'Paid' ? TONE_SOFT.good : TONE_SOFT.bad">
									<Icon :name="f.paymentStatus === 'Paid' ? 'i-tabler-check' : 'i-tabler-alert-circle'" class="h-[17px] w-[17px]" />
								</span>
								<div class="min-w-0 flex-1">
									<p class="truncate text-[14px] font-semibold text-stone-900">{{ f.book.title }}</p>
									<p class="text-[12.5px] text-stone-400">
										{{ f.unitsLate }} {{ f.rateUnit }}{{ f.unitsLate === 1 ? '' : 's' }} late{{ f.rate ? ` × ${formatPeso(f.rate)}` : '' }}{{ f.paymentStatus === 'Paid' && f.settledAt ? ` · paid ${formatDate(f.settledAt)}` : '' }}
									</p>
									<p v-if="f.paymentStatus !== 'Paid' && !f.loanReturned" class="mt-0.5 text-[12px] text-amber-700">Still counting until the book is returned.</p>
								</div>
								<div class="text-right">
									<p class="text-[14px] font-bold tabular-nums">{{ formatPeso(f.amount) }}</p>
									<StudentPill :tone="f.paymentStatus === 'Paid' ? 'good' : 'bad'" class="mt-1">{{ f.paymentStatus }}</StudentPill>
								</div>
							</div>
						</div>
					</template>
				</template>
			</div>

			<!-- At a glance (wide screens) -->
			<aside class="st-in hidden rounded-2xl border border-stone-200 bg-white p-[18px] lg:sticky lg:top-24 lg:block" style="animation-delay: 70ms">
				<b class="text-[14px]">At a glance</b>
				<dl class="mt-2 text-[13.5px]">
					<div v-for="row in glance" :key="row.label" class="flex justify-between gap-3 border-b border-stone-100 py-2.5 last:border-0">
						<dt class="text-stone-400">{{ row.label }}</dt>
						<dd class="font-semibold tabular-nums" :class="row.bad ? 'text-red-600' : ''">{{ row.value }}</dd>
					</div>
				</dl>
				<div class="mt-3 flex items-start gap-2.5 rounded-2xl bg-accent-100 px-3.5 py-3 text-[13px] leading-snug text-accent-600">
					<Icon name="i-tabler-id" class="mt-px h-4 w-4 shrink-0" />
					<span>Books are handed over at the desk. Bring your school ID.</span>
				</div>
			</aside>
		</div>

		<StudentReturnSheet :loan="returning" @close="returning = null" />

		<StudentSheet :open="!!cancelling" title="Cancel this reservation?" @close="cancelling = null">
			You'll lose your place in line for <b class="text-stone-900">{{ (cancelling ?? lastCancelled)?.book.title }}</b>. You can reserve it again, but you'd join the back of the queue.
			<template #actions>
				<ButtonsButton variant="danger" class="!h-[46px] !text-[15px]" :disabled="cancelBusy" @click="confirmCancel">Cancel reservation</ButtonsButton>
				<ButtonsButton variant="ghost" class="!h-[46px] !text-[15px]" @click="cancelling = null">Keep it</ButtonsButton>
			</template>
		</StudentSheet>
	</div>
</template>

<script setup lang="ts">
import { studentService, briefOf, type LoanRow, type ReservationRow } from '~/services/studentService'
import { TONE_SOFT, type StudentTone } from '~/utils/studentNotifications'

definePageMeta({ layout: 'student', middleware: 'student', title: 'My books', nav: 'books', tab: 'books' })
useHead({ title: 'My books' })

const route = useRoute()
const router = useRouter()
const { perform } = useAction()
const { stats, slotsLeft, refreshProfile, bumpData } = useStudent()

// In the order a borrow happens: reserve it, borrow it, settle any fine. Reservations opens by default.
const TABS = ['reservations', 'loans', 'fines']
const tab = computed<string>({
	get: () => (TABS.includes(String(route.query.tab)) ? String(route.query.tab) : TABS[0]!),
	set: (value) => { void router.replace({ query: { ...route.query, tab: value } }) },
})

const { data, pending } = useStudentData('student-books', async () => {
	const [loans, reservations, penalties] = await Promise.all([studentService.loans(), studentService.reservations(), studentService.penalties()])
	return { loans: loans.loans, reservations: reservations.reservations, penalties: penalties.penalties, unpaidTotal: penalties.unpaidTotal }
})

const openLoans = computed(() => (data.value?.loans ?? []).filter((l) => l.status !== 'Returned'))
const returnedLoans = computed(() => (data.value?.loans ?? []).filter((l) => l.status === 'Returned').slice(0, 5))
const activeReservations = computed(() => (data.value?.reservations ?? []).filter((r) => r.status === 'Waiting' || r.status === 'Accepted'))
const pastReservations = computed(() => (data.value?.reservations ?? []).filter((r) => r.status === 'Rejected' || r.status === 'Fulfilled').slice(0, 8))

const tabs = computed(() => [
	{ label: 'Reservations', value: 'reservations', badge: activeReservations.value.filter((r) => r.status === 'Accepted').length || undefined },
	{ label: 'Loans', value: 'loans', badge: openLoans.value.filter((l) => l.status === 'Active' && l.daysLeft < 0).length || undefined },
	{ label: 'Fines', value: 'fines', badge: (data.value?.penalties ?? []).filter((p) => p.paymentStatus !== 'Paid').length || undefined },
])

function loanTone(loan: LoanRow): StudentTone {
	return loan.status === 'Reported' ? 'accent' : dueTone(loan.daysLeft)
}

function loanLabel(loan: LoanRow): string {
	return loan.status === 'Reported' ? 'Awaiting librarian' : dueLabel(loan.daysLeft)
}

const glance = computed(() => [
	{ label: 'Active loans', value: String(stats.value?.activeLoans ?? '—') },
	{ label: 'Overdue', value: String(stats.value?.overdueLoans ?? '—'), bad: (stats.value?.overdueLoans ?? 0) > 0 },
	{ label: 'Ready for pickup', value: String(stats.value?.readyReservations ?? '—') },
	{ label: 'Reservation slots', value: `${slotsLeft.value} of 3 free` },
	{ label: 'Unpaid fines', value: formatPeso(stats.value?.unpaidFines ?? 0) },
])

/* ---- return + cancel ---- */
const returning = ref<LoanRow | null>(null)
const cancelling = ref<ReservationRow | null>(null)
const lastCancelled = ref<ReservationRow | null>(null)
const cancelBusy = ref(false)
watch(cancelling, (r) => { if (r) lastCancelled.value = r })

async function confirmCancel() {
	if (!cancelling.value || cancelBusy.value) return
	const target = cancelling.value
	cancelBusy.value = true

	const ok = await perform(() => studentService.cancelReservation(target.reservationID), 'Reservation cancelled', 'Could not cancel it', [refreshProfile])
	cancelBusy.value = false

	if (ok) {
		cancelling.value = null
		bumpData()
	}
}
</script>
