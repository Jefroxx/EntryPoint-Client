<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Circulation</h1>
            <p class="dashboard-heading mt-1 text-amber-900">Manage reservations, borrowing, returns and
                penalties.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" class="mb-5" :tabs="tabs" />

        <!-- Active loans -->
        <template v-if="activeTab === 'loans'">
            <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LibrarianCatalogStatTile label="Active Loans" :value="loanStats?.active ?? '—'"
                    icon="i-lucide-book-open" tone="accent" />
                <LibrarianCatalogStatTile label="Due Soon" :value="loanStats?.dueSoon ?? '—'"
                    icon="i-lucide-clock" tone="warning" />
                <LibrarianCatalogStatTile label="Overdue" :value="loanStats?.overdue ?? '—'"
                    icon="i-lucide-circle-alert" tone="danger" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="loan-search" v-model="loanSearch" placeholder="Search student or book" />

                <select v-model="loanStatus"
                    class="h-[38px] rounded-xl border border-stone-200 bg-white px-3 text-[13px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="active">Active loans</option>
                    <option value="overdue">Overdue only</option>
                    <option value="returned">Returned</option>
                </select>

                <div class="flex-1"></div>

                <ButtonsButton variant="primary" @click="isCheckoutOpen = true">
                    <Icon name="i-lucide-plus" class="h-3.5 w-3.5" />Checkout Book
                </ButtonsButton>
            </div>

            <LibrarianLoansTable :loans="loans?.data ?? []" :loading="loansPending" @return="handleReturn" />

            <LibrarianPagination v-if="loans" :shown="loans.data.length" :total="loans.total" noun="loans"
                :page="loans.current_page" :last-page="loans.last_page" @change="goToLoanPage" />
        </template>

        <!-- Reservations -->
        <template v-else-if="activeTab === 'reservations'">
            <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LibrarianCatalogStatTile label="Waiting" :value="reservationStats.waiting"
                    icon="i-lucide-clock" tone="warning" />
                <LibrarianCatalogStatTile label="Accepted" :value="reservationStats.accepted"
                    icon="i-lucide-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="Fulfilled" :value="reservationStats.fulfilled"
                    icon="i-lucide-book-open" tone="accent" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="reservation-search" v-model="reservationSearch" placeholder="Search student or book" />

                <select v-model="reservationStatus"
                    class="h-[38px] rounded-xl border border-stone-200 bg-white px-3 text-[13px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="">All statuses</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Fulfilled">Fulfilled</option>
                </select>
            </div>

            <LibrarianReservationsTable :reservations="pagedReservations" :queue-positions="queuePositions"
                :loading="reservationsPending" @accept="handleAcceptReservation"
                @reject="handleRejectReservation" />

            <LibrarianPagination :shown="pagedReservations.length" :total="filteredReservations.length"
                noun="reservations" :page="reservationPage" :last-page="reservationTotalPages"
                @change="reservationPage = $event" />
        </template>

        <!-- Self-return reports -->
        <template v-else-if="activeTab === 'selfreturn'">
            <div class="mb-5 grid grid-cols-1 gap-3 sm:max-w-[280px]">
                <LibrarianCatalogStatTile label="Pending Verification" :value="selfReturns.length"
                    icon="i-lucide-clock" tone="warning" />
            </div>

            <LibrarianSelfReturnTable :reports="selfReturns" :loading="selfReturnsPending"
                @verify="handleVerifySelfReturn" @reject="handleRejectSelfReturn" />
        </template>

        <!-- Penalties -->
        <template v-else>
            <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LibrarianCatalogStatTile label="Unpaid Fines" :value="penaltyStats?.unpaidCount ?? '—'"
                    icon="i-lucide-circle-alert" tone="danger" />
                <LibrarianCatalogStatTile label="Unpaid Total"
                    :value="penaltyStats ? formatPeso(penaltyStats.unpaidTotal) : '—'"
                    icon="i-lucide-circle-dollar-sign" tone="warning" />
                <LibrarianCatalogStatTile label="Settled" :value="penaltyStats?.paidCount ?? '—'"
                    icon="i-lucide-circle-check" tone="success" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="penalty-search" v-model="penaltySearch" placeholder="Search student" />

                <select v-model="penaltyStatus"
                    class="h-[38px] rounded-xl border border-stone-200 bg-white px-3 text-[13px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="">All fines</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                </select>
            </div>

            <LibrarianPenaltiesTable :penalties="penalties?.data ?? []" :loading="penaltiesPending"
                @settle="handleSettle" />

            <LibrarianPagination v-if="penalties" :shown="penalties.data.length" :total="penalties.total"
                noun="fines" :page="penalties.current_page" :last-page="penalties.last_page"
                @change="goToPenaltyPage" />
        </template>
    

        <LibrarianCheckoutModal :open="isCheckoutOpen" @close="isCheckoutOpen = false" @created="handleCheckoutCreated" />

        <AlertToast />
    
    </div>
</template>

<script setup lang="ts">
import {
    circulationService,
    type LoanRecord,
    type ReservationRecord,
    type ReservationStatus,
    type SelfReturnReportRecord,
    type PenaltyRecord,
} from '~/services/circulationService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})


const route = useRoute()
const activeTab = ref(['loans', 'reservations', 'selfreturn', 'penalties'].includes(String(route.query.tab)) ? String(route.query.tab) : 'loans')
const isCheckoutOpen = ref(false)

function debounced(fn: () => void, ms = 300) {
    let timeout: ReturnType<typeof setTimeout>
    return () => {
        clearTimeout(timeout)
        timeout = setTimeout(fn, ms)
    }
}

// ---- Active loans ----
const loanSearch = ref('')
const loanStatus = ref<'active' | 'overdue' | 'returned'>('active')
const loanPage = ref(1)

const { data: loanStats, execute: refetchLoanStats } =
    useLiveAsyncData('circ-loan-stats', () => circulationService.fetchLoanStats(), { lazy: true })

const { data: loans, pending: loansPending, execute: refetchLoans } = useLiveAsyncData(
    'circ-loans',
    () => circulationService.fetchLoans({
        search: loanSearch.value || undefined,
        status: loanStatus.value,
        page: loanPage.value,
        perPage: 10,
    }),
    { lazy: true },
)

watch(loanSearch, debounced(() => {
    loanPage.value = 1
    refetchLoans()
}))
watch(loanStatus, () => {
    loanPage.value = 1
    refetchLoans()
})

function goToLoanPage(next: number) {
    loanPage.value = next
    refetchLoans()
}

// ---- Reservations (fetched once, filtered + paged in the browser) ----
const { data: reservationsResponse, pending: reservationsPending, execute: refetchReservations } =
    useLiveAsyncData('circ-reservations', () => circulationService.fetchReservations(), { lazy: true })

const reservations = computed(() => reservationsResponse.value?.reservations ?? [])
const reservationSearch = ref('')
const reservationStatus = ref<'' | ReservationStatus>('Waiting')
const reservationPage = ref(1)
const RESERVATIONS_PER_PAGE = 10

const reservationStats = computed(() => ({
    waiting: reservations.value.filter((r) => r.status === 'Waiting').length,
    accepted: reservations.value.filter((r) => r.status === 'Accepted').length,
    fulfilled: reservations.value.filter((r) => r.status === 'Fulfilled').length,
}))

// The API returns reservations oldest-first, so the running count per book is its FIFO queue position.
const queuePositions = computed(() => {
    const counters: Record<number, number> = {}
    const positions: Record<number, number> = {}
    for (const reservation of reservations.value) {
        if (reservation.status !== 'Waiting') continue
        const bookID = reservation.book?.bookID ?? -1
        counters[bookID] = (counters[bookID] ?? 0) + 1
        positions[reservation.reservationID] = counters[bookID]!
    }
    return positions
})

const filteredReservations = computed(() => {
    const term = reservationSearch.value.trim().toLowerCase()
    return reservations.value.filter((r) => {
        if (reservationStatus.value && r.status !== reservationStatus.value) return false
        if (!term) return true
        return (
            personName(r.student?.user).toLowerCase().includes(term) ||
            (r.book?.title ?? '').toLowerCase().includes(term)
        )
    })
})

const reservationTotalPages = computed(() =>
    Math.max(1, Math.ceil(filteredReservations.value.length / RESERVATIONS_PER_PAGE)))

const pagedReservations = computed(() => {
    const start = (reservationPage.value - 1) * RESERVATIONS_PER_PAGE
    return filteredReservations.value.slice(start, start + RESERVATIONS_PER_PAGE)
})

watch([reservationSearch, reservationStatus], () => {
    reservationPage.value = 1
})

// ---- Self-return reports (always the pending queue) ----
const { data: selfReturnResponse, pending: selfReturnsPending, execute: refetchSelfReturns } =
    useLiveAsyncData('circ-self-returns', () => circulationService.fetchSelfReturnReports(), { lazy: true })

const selfReturns = computed(() => selfReturnResponse.value?.reports ?? [])

// ---- Penalties ----
const penaltySearch = ref('')
const penaltyStatus = ref<'' | 'Unpaid' | 'Paid'>('')
const penaltyPage = ref(1)

const { data: penaltyStats, execute: refetchPenaltyStats } =
    useLiveAsyncData('circ-penalty-stats', () => circulationService.fetchPenaltyStats(), { lazy: true })

const { data: penalties, pending: penaltiesPending, execute: refetchPenalties } = useLiveAsyncData(
    'circ-penalties',
    () => circulationService.fetchPenalties({
        search: penaltySearch.value || undefined,
        status: penaltyStatus.value || undefined,
        page: penaltyPage.value,
        perPage: 10,
    }),
    { lazy: true },
)

watch(penaltySearch, debounced(() => {
    penaltyPage.value = 1
    refetchPenalties()
}))
watch(penaltyStatus, () => {
    penaltyPage.value = 1
    refetchPenalties()
})

function goToPenaltyPage(next: number) {
    penaltyPage.value = next
    refetchPenalties()
}

// ---- Tabs ----
const tabs = computed(() => [
    { label: 'Active Loans', value: 'loans' },
    { label: 'Reservations', value: 'reservations', badge: reservationStats.value.waiting },
    { label: 'Self-Return Reports', value: 'selfreturn', badge: selfReturns.value.length },
    { label: 'Penalties', value: 'penalties' },
])

// ---- Actions ----
const { perform } = useAction()

const refreshLoanData = () => [refetchLoans, refetchLoanStats, refetchPenalties, refetchPenaltyStats]

function handleReturn(loan: LoanRecord) {
    return perform(() => circulationService.returnLoan(loan.loanID), 'Book returned', 'Could not return book', refreshLoanData())
}

function handleAcceptReservation(reservation: ReservationRecord) {
    return perform(() => circulationService.acceptReservation(reservation.reservationID), 'Reservation accepted', 'Could not accept reservation', [refetchReservations])
}

function handleRejectReservation(reservation: ReservationRecord) {
    return perform(() => circulationService.rejectReservation(reservation.reservationID), 'Reservation rejected', 'Could not reject reservation', [refetchReservations])
}

function handleVerifySelfReturn(report: SelfReturnReportRecord) {
    return perform(() => circulationService.verifySelfReturn(report.reportID), 'Return verified', 'Could not verify return', [refetchSelfReturns, ...refreshLoanData()])
}

function handleRejectSelfReturn(report: SelfReturnReportRecord) {
    return perform(() => circulationService.rejectSelfReturn(report.reportID), 'Report rejected', 'Could not reject report', [refetchSelfReturns])
}

function handleSettle(penalty: PenaltyRecord) {
    return perform(() => circulationService.settlePenalty(penalty.penaltyID), 'Fine settled', 'Could not settle fine', [refetchPenalties, refetchPenaltyStats])
}

async function handleCheckoutCreated() {
    await Promise.all([refetchLoans(), refetchLoanStats()])
}
</script>
