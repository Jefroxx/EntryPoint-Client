<template>
	<div>
		<div class="st-in mb-5 flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="dashboard-heading text-3xl font-bold text-crimson md:text-4xl">My books</h1>
				<p class="dashboard-heading mt-1 text-crimson md:text-[17px]">What you've reserved, what you hold, and what you owe.</p>
			</div>
			<LibrarianSegmentedTabs v-model="tab" :tabs="tabs" />
		</div>

		<div class="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
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
						<div class="hidden grid-cols-[minmax(0,2.4fr)_1.1fr_180px] gap-4 bg-stone-50 px-[18px] py-3 text-[11px] md:px-6 md:py-3.5 md:text-[12px] font-semibold uppercase tracking-[.06em] text-stone-500 md:grid">
							<span>Book</span><span>Status</span><span />
						</div>
						<div v-for="loan in openLoans" :key="loan.loanID"
							class="mb-2.5 rounded-2xl border border-stone-200 bg-white p-3.5 md:mb-0 md:grid md:grid-cols-[minmax(0,2.4fr)_1.1fr_180px] md:items-center md:gap-4 md:rounded-none md:border-0 md:border-t md:border-stone-100 md:px-6 md:py-5">
							<div class="flex min-w-0 items-center gap-3.5">
								<StudentCover :book="loan.book" :width="wide ? 64 : 44" />
								<div class="min-w-0">
									<p class="text-[14.5px] md:text-[17px] font-semibold leading-tight text-stone-900">{{ loan.book.title }}</p>
									<p class="mt-0.5 truncate text-[12.5px] md:text-[14.5px] text-stone-500">{{ authorLine(loan.book) }}</p>
									<p class="mt-0.5 text-[12.5px] text-stone-500 md:hidden">Borrowed {{ formatDate(loan.checkoutDate) }} · Due {{ formatDate(loan.dueDate) }}</p>
									<p class="mt-0.5 hidden text-[14.5px] text-stone-500 md:block">Borrowed {{ formatDate(loan.checkoutDate) }}</p>
									<div class="mt-2 md:hidden"><StudentPill class="md:!h-7 md:!px-3 md:!text-[13px]" :tone="loanTone(loan)">{{ loanLabel(loan) }}</StudentPill></div>
								</div>
							</div>
							<div class="hidden md:block">
								<StudentPill class="md:!h-7 md:!px-3 md:!text-[13px]" :tone="loanTone(loan)">{{ loanLabel(loan) }}</StudentPill>
								<p class="mt-1 text-[12.5px] md:text-[14.5px] text-stone-500">Due {{ formatDate(loan.dueDate) }}</p>
							</div>
							<div class="mt-3 flex gap-2 md:mt-0 md:flex-col md:items-end md:gap-1.5">
								<p v-if="loan.status === 'Reported'" class="flex-1 text-[12.5px] md:text-[14.5px] text-stone-500 md:max-w-[180px] md:flex-none md:text-right">Returned. A librarian will verify it.</p>
								<p v-else-if="loan.status === 'Received'" class="flex-1 text-[12.5px] md:text-[14.5px] text-stone-500 md:max-w-[180px] md:flex-none md:text-right">Handed in. A librarian is checking the book.</p>
								<ButtonsButton v-else-if="waiting(loan)" variant="ghost" size="sm" disabled class="!h-10 flex-1 !text-[14px] md:!h-10 md:w-[180px] md:flex-none md:!text-[14.5px]">
									<Icon name="i-tabler-clock" class="h-3.5 w-3.5 md:h-4 md:w-4" />Report again later
								</ButtonsButton>
								<ButtonsButton v-else variant="ghost" size="sm" class="!h-10 flex-1 !border-accent-100 !bg-accent-100 !text-[14px] !text-accent-600 md:!h-10 md:w-[180px] md:flex-none md:!text-[14.5px]"
									@click="returning = loan">
									<Icon name="i-tabler-arrow-back-up" class="h-3.5 w-3.5 md:h-4 md:w-4" />I returned this
								</ButtonsButton>
								<ButtonsButton variant="ghost" size="sm" class="!h-10 shrink-0 !text-[14px] md:!h-10 md:w-[180px] md:!text-[14.5px]"
									@click="openReceipt(loan)">
									<Icon name="i-tabler-receipt" class="h-3.5 w-3.5 md:h-4 md:w-4" />Receipt
								</ButtonsButton>
							</div>
							<div v-if="loan.rejectionReason" class="mt-3 rounded-xl border px-3.5 py-2.5 text-[13px] md:col-span-3 md:mt-0 md:text-[14px]"
								:class="waiting(loan) ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'">
								<template v-if="waiting(loan)">
									<b class="font-semibold">Return not accepted.</b> Reason: {{ loan.rejectionReason }}
									<br>Bring the book to the desk, or report again at {{ formatDateTime(loan.canReportAgainAt!) }} (in {{ countdown(loan) }}).
								</template>
								<template v-else>
									<b class="font-semibold">You can report this return again.</b> Last time: {{ loan.rejectionReason }} Make sure the book is at the desk first.
								</template>
							</div>
						</div>
					</div>

					<template v-if="returnedLoans.length">
						<h2 class="mb-2.5 mt-7 px-0.5 text-[11px] md:mb-3 md:text-[12.5px] font-semibold uppercase tracking-[.08em] text-stone-500">Returned</h2>
						<div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
							<div v-for="loan in returnedLoans" :key="loan.loanID" class="flex items-center gap-3.5 border-b border-stone-100 px-4 py-3 md:px-6 md:py-4 last:border-0">
								<StudentCover :book="loan.book" :width="wide ? 48 : 36" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-[14px] md:text-[16px] font-semibold text-stone-900">{{ loan.book.title }}</p>
									<p class="text-[12.5px] md:text-[14.5px] text-stone-500">Returned {{ loan.returnDate ? formatDate(loan.returnDate) : '' }}</p>
								</div>
								<Icon name="i-tabler-check" class="h-4 w-4 text-emerald-600 md:h-5 md:w-5" />
								<button type="button" :aria-label="`Receipt for ${loan.book.title}`" title="Receipt"
									class="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-[background-color,transform] duration-150 hover:bg-stone-100 hover:text-stone-800 active:scale-[0.96]"
									@click="openReceipt(loan)">
									<Icon name="i-tabler-receipt" class="h-[18px] w-[18px] md:h-5 md:w-5" />
								</button>
							</div>
						</div>
					</template>
				</template>

				<!-- RESERVATIONS -->
				<template v-else-if="data && tab === 'reservations'">
					<div class="mb-3.5 flex items-start gap-2.5 rounded-2xl bg-accent-100 px-3.5 py-3 text-[13px] md:px-5 md:py-4 md:text-[15px] leading-snug text-accent-600">
						<Icon name="i-tabler-id" class="mt-px h-4 w-4 shrink-0 md:h-5 md:w-5" />
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
							class="mb-2.5 rounded-2xl border border-stone-200 bg-white p-3.5 md:mb-0 md:flex md:items-center md:gap-4 md:rounded-none md:border-0 md:border-b md:border-stone-100 md:px-6 md:py-5 md:last:border-0">
							<div class="flex min-w-0 flex-1 items-center gap-3.5">
								<StudentCover :book="briefOf(r.book)" :width="wide ? 64 : 44" />
								<div class="min-w-0">
									<p class="text-[14.5px] md:text-[17px] font-semibold leading-tight text-stone-900">{{ r.book.title }}</p>
									<p class="mt-0.5 truncate text-[12.5px] md:text-[14.5px] text-stone-500">{{ authorLine(briefOf(r.book)) }} · Reserved {{ formatDate(r.reservedAt) }}</p>
									<div class="mt-2">
										<StudentPill class="md:!h-7 md:!px-3 md:!text-[13px]" v-if="r.status === 'Waiting'" tone="warn"><Icon name="i-tabler-clock" class="h-3 w-3" />#{{ r.queuePosition }} in line</StudentPill>
										<StudentPill class="md:!h-7 md:!px-3 md:!text-[13px]" v-else tone="good"><Icon name="i-tabler-check" class="h-3 w-3" />Ready for pickup</StudentPill>
									</div>
								</div>
							</div>
							<p class="mt-3 text-[12.5px] md:text-[14.5px] text-stone-500 md:mt-0 md:w-[210px]">
								{{ r.status === 'Waiting'
									? ((r.queuePosition ?? 1) > 1 ? `${(r.queuePosition ?? 1) - 1} ahead of you` : "You're next")
									: 'Bring your ID to the desk to collect it.' }}
							</p>
							<ButtonsButton v-if="r.status === 'Waiting'" variant="danger" size="sm" class="mt-3 !h-10 w-full !text-[14px] md:mt-0 md:!h-10 md:w-auto md:!px-5 md:!text-[14.5px]"
								@click="cancelling = r">Cancel</ButtonsButton>
							<ButtonsButton v-else variant="primary" size="sm" class="mt-3 !h-10 w-full !text-[14px] md:mt-0 md:!h-10 md:w-auto md:!px-5 md:!text-[14.5px]"
								@click="slipFor = r">
								<Icon name="i-tabler-barcode" class="h-4 w-4 md:h-[18px] md:w-[18px]" />Pickup slip
							</ButtonsButton>
						</div>
					</TransitionGroup>

					<template v-if="pastReservations.length">
						<h2 class="mb-2.5 mt-7 px-0.5 text-[11px] md:mb-3 md:text-[12.5px] font-semibold uppercase tracking-[.08em] text-stone-500">Past</h2>
						<div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
							<div v-for="r in pastReservations" :key="r.reservationID" class="flex items-center gap-3.5 border-b border-stone-100 px-4 py-3 md:px-6 md:py-4 last:border-0">
								<StudentCover :book="briefOf(r.book)" :width="wide ? 48 : 36" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-[14px] md:text-[16px] font-semibold text-stone-900">{{ r.book.title }}</p>
									<p class="text-[12.5px] md:text-[14.5px] text-stone-500">{{ formatDate(r.reservedAt) }}</p>
								</div>
								<StudentPill class="md:!h-7 md:!px-3 md:!text-[13px]" :tone="r.status === 'Fulfilled' ? 'good' : 'bad'">{{ r.status }}</StudentPill>
							</div>
						</div>
					</template>
				</template>

				<!-- FINES -->
				<template v-else-if="data && tab === 'fines'">
					<div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-[18px] md:p-6 text-center md:text-left">
						<div class="w-full md:w-auto">
							<p class="text-[12.5px] md:text-[14.5px] text-stone-500">Unpaid fines</p>
							<p class="dashboard-heading text-[36px] md:text-[46px] font-extrabold tabular-nums" :class="data.unpaidTotal ? 'text-red-600' : 'text-emerald-600'">{{ formatPeso(data.unpaidTotal) }}</p>
						</div>
						<p class="mx-auto max-w-[36ch] text-[12.5px] md:text-[14.5px] text-stone-500 md:mx-0">
							{{ data.unpaidTotal ? 'Fines are settled with a librarian at the desk, once the book is back.' : "You're all clear." }}
						</p>
					</div>

					<template v-if="data.penalties.length">
						<h2 class="mb-2.5 mt-7 px-0.5 text-[11px] md:mb-3 md:text-[12.5px] font-semibold uppercase tracking-[.08em] text-stone-500">History</h2>
						<div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
							<div v-for="f in data.penalties" :key="f.penaltyID" class="flex items-center gap-3.5 border-b border-stone-100 px-4 py-3.5 md:px-6 md:py-4 last:border-0">
								<span class="flex h-[34px] w-[34px] md:h-10 md:w-10 shrink-0 items-center justify-center rounded-[10px]" :class="f.paymentStatus !== 'Unpaid' ? TONE_SOFT.good : TONE_SOFT.bad">
									<Icon :name="f.paymentStatus !== 'Unpaid' ? 'i-tabler-check' : 'i-tabler-alert-circle'" class="h-[17px] w-[17px] md:h-5 md:w-5" />
								</span>
								<div class="min-w-0 flex-1">
									<p class="truncate text-[14px] md:text-[16px] font-semibold text-stone-900">{{ f.book.title }}</p>
									<!-- Lost or damaged book: the student pays its price at the desk or brings a replacement copy. -->
									<p v-if="f.kind !== 'overdue'" class="text-[12.5px] md:text-[14.5px] text-stone-500">
										<template v-if="f.paymentStatus === 'Replaced'">{{ f.kind === 'lost' ? 'Lost' : 'Damaged' }} book · replaced{{ f.settledAt ? ` ${formatDate(f.settledAt)}` : '' }}</template>
										<template v-else-if="f.paymentStatus === 'Paid'">{{ f.kind === 'lost' ? 'Lost' : 'Damaged' }} book · paid{{ f.settledAt ? ` ${formatDate(f.settledAt)}` : '' }}</template>
										<template v-else>{{ f.kind === 'lost' ? 'Lost' : 'Damaged' }} book · pay it at the desk, or bring a replacement copy</template>
									</p>
									<p v-else class="text-[12.5px] md:text-[14.5px] text-stone-500">
										{{ f.unitsLate }} {{ f.rateUnit }}{{ f.unitsLate === 1 ? '' : 's' }} late{{ f.rate ? ` × ${formatPeso(f.rate)}` : '' }}{{ f.paymentStatus === 'Paid' && f.settledAt ? ` · paid ${formatDate(f.settledAt)}` : '' }}
									</p>
									<p v-if="f.kind === 'overdue' && f.paymentStatus === 'Unpaid' && !f.loanReturned" class="mt-0.5 text-[12px] md:text-[13.5px] text-amber-700">Still counting until the book is returned.</p>
								</div>
								<div class="text-right">
									<p class="text-[14px] md:text-[16px] font-bold tabular-nums">{{ formatPeso(f.amount) }}</p>
									<StudentPill :tone="f.paymentStatus !== 'Unpaid' ? 'good' : 'bad'" class="mt-1 md:!h-7 md:!px-3 md:!text-[13px]">{{ f.paymentStatus }}</StudentPill>
								</div>
							</div>
						</div>
					</template>
				</template>
			</div>

			<!-- At a glance (wide screens) -->
			<aside class="st-in hidden rounded-2xl border border-stone-200 bg-white p-[18px] lg:p-6 lg:sticky lg:top-24 lg:block" style="animation-delay: 70ms">
				<b class="text-[14px] lg:text-[16px]">At a glance</b>
				<dl class="mt-2 text-[13.5px] lg:mt-3 lg:text-[15px]">
					<div v-for="row in glance" :key="row.label" class="flex justify-between gap-3 border-b border-stone-100 py-2.5 lg:py-3 last:border-0">
						<dt class="text-stone-500">{{ row.label }}</dt>
						<dd class="font-semibold tabular-nums" :class="row.bad ? 'text-red-600' : ''">{{ row.value }}</dd>
					</div>
				</dl>
				<div class="mt-3 flex items-start gap-2.5 rounded-2xl bg-accent-100 px-3.5 py-3 text-[13px] md:px-5 md:py-4 md:text-[15px] leading-snug text-accent-600">
					<Icon name="i-tabler-id" class="mt-px h-4 w-4 shrink-0 md:h-5 md:w-5" />
					<span>Books are handed over at the desk. Bring your school ID.</span>
				</div>
			</aside>
		</div>

		<StudentReturnSheet :loan="returning" @close="returning = null" />

		<!-- A digital copy of the checkout receipt, the same slip the desk printed. -->
		<StudentDrawer :open="!!receiptFor" title="Borrowing receipt" @close="receiptFor = null">
			<div v-if="receiptLoading" class="mx-auto h-[520px] max-w-[80mm] animate-pulse rounded-2xl bg-stone-100" aria-busy="true" />
			<p v-else-if="receiptError" class="rounded-2xl bg-red-50 px-4 py-6 text-center text-[13.5px] text-red-600">{{ receiptError }}</p>
			<LoanReceipt v-else-if="receipt" ref="receiptView" :receipt="receipt" />

			<template #footer>
				<p class="flex-1 text-[12.5px] leading-snug text-stone-500">Show this at the desk if you lose the paper one.</p>
				<ButtonsButton :disabled="!receipt" @click="receiptView?.print()">
					<Icon name="i-tabler-printer" class="h-4 w-4" />Save or print
				</ButtonsButton>
			</template>
		</StudentDrawer>

		<!-- A digital copy of the reservation pickup slip: the barcode the desk scans to hand the book over. -->
		<StudentDrawer :open="!!slipFor" title="Pickup slip" @close="slipFor = null">
			<StudentPickupSlip v-if="slipShown" ref="slipView" :code="slipShown.pickupCode" :title="slipShown.book.title"
				:author="authorLine(briefOf(slipShown.book))" :reserved-at="slipShown.reservedAt" />

			<template #footer>
				<p class="flex-1 text-[12.5px] leading-snug text-stone-500">Show this at the desk to collect your book.</p>
				<ButtonsButton @click="slipView?.print()">
					<Icon name="i-tabler-printer" class="h-4 w-4" />Save or print
				</ButtonsButton>
			</template>
		</StudentDrawer>

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
import type { LoanReceipt as LoanReceiptData } from '~/services/circulationService'
import { TONE_SOFT, type StudentTone } from '~/utils/studentNotifications'

definePageMeta({ layout: 'student', middleware: 'student', title: 'My books', nav: 'books', tab: 'books' })
useHead({ title: 'My books' })

const route = useRoute()

// The wide (tablet and up) layout gets bigger covers. A cover's width is a number, so it needs to know.
const wide = ref(import.meta.client && window.matchMedia('(min-width: 768px)').matches)
onMounted(() => {
	const query = window.matchMedia('(min-width: 768px)')
	const update = () => { wide.value = query.matches }
	update()
	query.addEventListener('change', update)
	onBeforeUnmount(() => query.removeEventListener('change', update))
})
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
	{ label: 'Fines', value: 'fines', badge: (data.value?.penalties ?? []).filter((p) => p.paymentStatus === 'Unpaid').length || undefined },
])

function loanTone(loan: LoanRow): StudentTone {
	return loan.status === 'Reported' || loan.status === 'Received' ? 'accent' : dueTone(loan.daysLeft)
}

function loanLabel(loan: LoanRow): string {
	return loan.status === 'Reported' ? 'Awaiting librarian' : loan.status === 'Received' ? 'Being checked' : dueLabel(loan.daysLeft)
}

const glance = computed(() => [
	{ label: 'Active loans', value: String(stats.value?.activeLoans ?? '—') },
	{ label: 'Overdue', value: String(stats.value?.overdueLoans ?? '—'), bad: (stats.value?.overdueLoans ?? 0) > 0 },
	{ label: 'Ready for pickup', value: String(stats.value?.readyReservations ?? '—') },
	{ label: 'Reservation slots', value: `${slotsLeft.value} of 3 free` },
	{ label: 'Unpaid fines', value: formatPeso(stats.value?.unpaidFines ?? 0) },
])

/* ---- receipt (digital copy) ---- */
const receiptFor = ref<LoanRow | null>(null)
const receipt = ref<LoanReceiptData | null>(null)
const receiptLoading = ref(false)
const receiptError = ref('')
const receiptView = ref<{ print: () => void } | null>(null)

async function openReceipt(loan: LoanRow) {
	receiptFor.value = loan
	receipt.value = null
	receiptError.value = ''
	receiptLoading.value = true
	try {
		const response = await studentService.loanReceipt(loan.uuid)
		if (receiptFor.value?.loanID === loan.loanID) receipt.value = response.receipt
	} catch (error) {
		receiptError.value = apiErrorMessage(error, "Couldn't load this receipt. Please try again.")
	} finally {
		receiptLoading.value = false
	}
}

/* ---- return + cancel ---- */
/* ---- reservation pickup slip ---- */
const slipFor = ref<ReservationRow | null>(null)
// Kept after the drawer closes so the slip doesn't blank out mid-transition.
const lastSlip = ref<ReservationRow | null>(null)
watch(slipFor, (r) => { if (r) lastSlip.value = r })
const slipShown = computed(() => slipFor.value ?? lastSlip.value)
const slipView = ref<{ print: () => void } | null>(null)

const returning = ref<LoanRow | null>(null)

// A rejected return can be reported again after a wait. `now` ticks so the countdown stays current.
const now = ref(Date.now())
onMounted(() => {
	const timer = window.setInterval(() => { now.value = Date.now() }, 30_000)
	onBeforeUnmount(() => window.clearInterval(timer))
})

function waitMs(loan: LoanRow): number {
	return loan.canReportAgainAt ? new Date(loan.canReportAgainAt).getTime() - now.value : 0
}

function waiting(loan: LoanRow): boolean {
	return waitMs(loan) > 0
}

function countdown(loan: LoanRow): string {
	const minutes = Math.max(Math.ceil(waitMs(loan) / 60_000), 1)
	const hours = Math.floor(minutes / 60)
	return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}
const cancelling = ref<ReservationRow | null>(null)
const lastCancelled = ref<ReservationRow | null>(null)
const cancelBusy = ref(false)
watch(cancelling, (r) => { if (r) lastCancelled.value = r })

async function confirmCancel() {
	if (!cancelling.value || cancelBusy.value) return
	const target = cancelling.value
	cancelBusy.value = true

	const ok = await perform(() => studentService.cancelReservation(target.uuid), 'Reservation cancelled', 'Could not cancel it', [refreshProfile])
	cancelBusy.value = false

	if (ok) {
		cancelling.value = null
		bumpData()
	}
}
</script>
