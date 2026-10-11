<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Circulation</h1>
            <p class="dashboard-heading mt-1 text-crimson">Manage reservations, borrowing, returns and
                penalties.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" class="mb-5" :tabs="tabs" />

        <!-- Active loans -->
        <template v-if="activeTab === 'loans'">
            <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
                <LibrarianCatalogStatTile label="Active Loans" :value="loanStats?.active ?? '—'"
                    icon="i-tabler-book" tone="accent" />
                <LibrarianCatalogStatTile label="Due Soon" :value="loanStats?.dueSoon ?? '—'"
                    icon="i-tabler-clock" tone="warning" />
                <LibrarianCatalogStatTile label="Overdue" :value="loanStats?.overdue ?? '—'"
                    icon="i-tabler-alert-circle" tone="danger" />
                <LibrarianCatalogStatTile label="To Check" :value="loanStats?.received ?? '—'"
                    icon="i-tabler-checklist" tone="success" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="loan-search" v-model="loanSearch" placeholder="Search student or book" />

                <select v-model="loanStatus"
                    class="h-[42px] rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="">All loans</option>
                    <option value="active">Active loans</option>
                    <option value="overdue">Overdue only</option>
                    <option value="received">Handed in, to check</option>
                    <option value="returned">Returned</option>
                </select>

                <div class="flex-1"></div>

                <LibrarianResetFiltersButton @click="loanSearch = ''; loanStatus = ''" />
                <ButtonsButton variant="primary" @click="checkoutCode = undefined; checkoutAuto = false; isCheckoutOpen = true">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Checkout Book
                </ButtonsButton>
            </div>

            <LibrarianLoansTable :loans="loans?.data ?? []" :loading="loansPending" @return="handleReturn" @finish="openFinishReturn" />

            <LibrarianPagination v-if="loans" :shown="loans.data.length" :total="loans.total" noun="loans"
                :page="loans.current_page" :last-page="loans.last_page" @change="goToLoanPage" />
        </template>

        <!-- Reservations -->
        <template v-else-if="activeTab === 'reservations'">
            <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LibrarianCatalogStatTile label="Waiting" :value="reservationStats.waiting"
                    icon="i-tabler-clock" tone="warning" />
                <LibrarianCatalogStatTile label="Accepted" :value="reservationStats.accepted"
                    icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="Fulfilled" :value="reservationStats.fulfilled"
                    icon="i-tabler-book" tone="accent" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="reservation-search" v-model="reservationSearch" placeholder="Search student or book" />

                <select v-model="reservationStatus"
                    class="h-[42px] rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="">All statuses</option>
                    <option value="open">Waiting &amp; accepted</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Fulfilled">Fulfilled</option>
                </select>

                <div class="flex-1"></div>

                <LibrarianResetFiltersButton @click="reservationSearch = ''; reservationStatus = 'open'" />
            </div>

            <LibrarianReservationsTable :reservations="pagedReservations" :queue-positions="queuePositions"
                :loading="reservationsPending" @accept="handleAcceptReservation"
                @reject="handleRejectReservation" @checkout="handleCheckoutReservation" />

            <LibrarianPagination :shown="pagedReservations.length" :total="filteredReservations.length"
                noun="reservations" :page="reservationPage" :last-page="reservationTotalPages"
                @change="reservationPage = $event" />
        </template>

        <!-- Self-return reports -->
        <template v-else-if="activeTab === 'selfreturn'">
            <div class="mb-5 grid grid-cols-1 gap-3 sm:max-w-[280px]">
                <LibrarianCatalogStatTile label="Pending Verification" :value="selfReturns.length"
                    icon="i-tabler-clock" tone="warning" />
            </div>

            <LibrarianSelfReturnTable :reports="selfReturns" :loading="selfReturnsPending"
                @verify="handleVerifySelfReturn" @reject="handleRejectSelfReturn" />
        </template>

        <!-- Penalties -->
        <template v-else>
            <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LibrarianCatalogStatTile label="Unpaid Fines" :value="penaltyStats?.unpaidCount ?? '—'"
                    icon="i-tabler-alert-circle" tone="danger" />
                <LibrarianCatalogStatTile label="Unpaid Total"
                    :value="penaltyStats ? formatPeso(penaltyStats.unpaidTotal) : '—'"
                    icon="i-tabler-coin" tone="warning" />
                <LibrarianCatalogStatTile label="Settled" :value="penaltyStats?.paidCount ?? '—'"
                    icon="i-tabler-circle-check" tone="success" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="penalty-search" v-model="penaltySearch" placeholder="Search student" />

                <select v-model="penaltyStatus"
                    class="h-[42px] rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="">All fines</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                </select>

                <div class="flex-1"></div>

                <LibrarianResetFiltersButton @click="penaltySearch = ''; penaltyStatus = ''" />
            </div>

            <LibrarianPenaltiesTable :penalties="penalties?.data ?? []" :loading="penaltiesPending"
                @settle="handleSettle" />

            <LibrarianPagination v-if="penalties" :shown="penalties.data.length" :total="penalties.total"
                noun="fines" :page="penalties.current_page" :last-page="penalties.last_page"
                @change="goToPenaltyPage" />
        </template>
    

        <LibrarianReservationScanModal :open="isScanOpen" :reservation="scanReservation" @close="isScanOpen = false"
            @matched="handleSlipScanned" @manual="handleCheckoutManually" />

        <LibrarianCheckoutModal :open="isCheckoutOpen" :initial-code="checkoutCode" :auto-checkout="checkoutAuto"
            @close="isCheckoutOpen = false" @created="handleCheckoutCreated" />

        <LibrarianReturnLoanModal :open="isReportOpen" :mode="reportMode" :preview="reportPreview" :loading="reportLoading" :error="reportError"
            :busy="reportBusy" @close="isReportOpen = false" @submit="confirmReport" />

        <LibrarianSettleFineModal :open="isSettleOpen" :penalty="settlingPenalty" :busy="settleBusy"
            @close="isSettleOpen = false" @submit="confirmSettle" />

        <LibrarianReturnLoanModal :open="isReturnOpen" :preview="returnPreview" :loading="returnLoading" :error="returnError"
            :busy="returnBusy" @close="isReturnOpen = false" @submit="confirmReturn" />

        <LibrarianFinishReturnModal :open="isFinishOpen" :summary="finishSummary" :busy="finishBusy"
            @close="isFinishOpen = false" @submit="saveFinishReturn" />

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
    type ReturnPreview,
    type PenaltyRecord,
} from '~/services/circulationService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Circulation' })


const route = useRoute()
const activeTab = ref(['loans', 'reservations', 'selfreturn', 'penalties'].includes(String(route.query.tab)) ? String(route.query.tab) : 'loans')
const isCheckoutOpen = ref(false)
// Checking out a reservation starts with a scan of its pickup slip; the form is the manual way.
const isScanOpen = ref(false)
const scanReservation = ref<ReservationRecord | null>(null)
const checkoutAuto = ref(false)
// The pickup code of the accepted reservation being checked out; empty for a plain checkout.
const checkoutCode = ref<string | undefined>(undefined)

// Dashboard quick action: /librarian/circulation?new=checkout opens the checkout form straight away.
onMounted(() => {
    if (route.query.new !== 'checkout') return
    isCheckoutOpen.value = true
    // Drop the flag from the address so a refresh doesn't reopen the form. Done on the address bar alone, not
    // through the router: a router navigation here interrupts the page change that is still finishing, which left
    // the loading cover up, and a query-only one rewrote the path to the folder's spelling (/Librarian/…).
    const url = new URL(window.location.href)
    url.searchParams.delete('new')
    window.history.replaceState(window.history.state, '', url)
})

function debounced(fn: () => void, ms = 300) {
    let timeout: ReturnType<typeof setTimeout>
    return () => {
        clearTimeout(timeout)
        timeout = setTimeout(fn, ms)
    }
}

// ---- Active loans ----
const loanSearch = ref('')
const loanStatus = ref<'' | 'active' | 'overdue' | 'received' | 'returned'>('')
const loanPage = ref(1)

const { data: loanStats, execute: refetchLoanStats } =
    useLiveAsyncData('circ-loan-stats', () => circulationService.fetchLoanStats(), { lazy: true })

const { data: loans, pending: loansPending, execute: refetchLoans } = useLiveAsyncData(
    'circ-loans',
    () => circulationService.fetchLoans({
        search: loanSearch.value || undefined,
        status: loanStatus.value || undefined,
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
// 'open' = still to be dealt with: waiting for a decision, or accepted and waiting for pickup.
const reservationStatus = ref<'' | 'open' | ReservationStatus>('open')
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
        if (reservationStatus.value === 'open') {
            if (r.status !== 'Waiting' && r.status !== 'Accepted') return false
        } else if (reservationStatus.value && r.status !== reservationStatus.value) return false
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
    { label: 'Active Loans', value: 'loans', badge: loanStats.value?.received || undefined },
    { label: 'Reservations', value: 'reservations', badge: reservationStats.value.waiting },
    { label: 'Self-Return Reports', value: 'selfreturn', badge: selfReturns.value.length },
    { label: 'Penalties', value: 'penalties' },
])

// ---- Actions ----
const { perform } = useAction()

const refreshLoanData = () => [refetchLoans, refetchLoanStats, refetchPenalties, refetchPenaltyStats]

// Returning a book asks first: the window shows the loan, the book and the student, and for a late book it
// asks whether the fee has been paid.
const isReturnOpen = ref(false)
const returningLoan = ref<LoanRecord | null>(null)
const returnPreview = ref<ReturnPreview | null>(null)
const returnLoading = ref(false)
const returnError = ref('')
const returnBusy = ref(false)

async function handleReturn(loan: LoanRecord) {
    returningLoan.value = loan
    returnPreview.value = null
    returnError.value = ''
    isReturnOpen.value = true
    returnLoading.value = true
    try {
        const { preview } = await circulationService.fetchReturnPreview(loan.uuid)
        if (returningLoan.value?.uuid === loan.uuid) returnPreview.value = preview
    } catch (error) {
        returnError.value = apiErrorMessage(error, "Couldn't load this loan. Please try again.")
    } finally {
        returnLoading.value = false
    }
}

async function confirmReturn(payload: { finePaid: boolean | undefined }) {
    const loan = returningLoan.value
    if (!loan) return
    returnBusy.value = true
    const ok = await perform(
        () => circulationService.returnLoan(loan.uuid, payload.finePaid === undefined ? {} : { finePaid: payload.finePaid }),
        'Book returned', 'Could not return book', refreshLoanData())
    returnBusy.value = false
    if (ok) isReturnOpen.value = false
}

// A book handed in (its receipt barcode was scanned) waits here until the librarian has checked it.
const isFinishOpen = ref(false)
const finishingLoan = ref<LoanRecord | null>(null)
const finishBusy = ref(false)
const finishSummary = computed(() => {
    const loan = finishingLoan.value
    if (!loan) return null
    return {
        bookTitle: loan.copy?.book?.title ?? 'Book',
        accessionNumber: loan.copy?.accessionNumber ?? 0,
        studentName: loan.student?.user ? `${loan.student.user.firstName} ${loan.student.user.lastName}` : 'The student',
    }
})

function openFinishReturn(loan: LoanRecord) {
    finishingLoan.value = loan
    isFinishOpen.value = true
}

async function saveFinishReturn(payload: { condition: 'good' | 'damaged'; note: string | undefined }) {
    const loan = finishingLoan.value
    if (!loan) return
    finishBusy.value = true
    const ok = await perform(() => circulationService.finishReturn(loan.uuid, payload),
        payload.condition === 'damaged' ? 'Return finished, marked damaged' : 'Return finished', 'Could not finish the return', refreshLoanData())
    finishBusy.value = false
    if (ok) isFinishOpen.value = false
}

function handleAcceptReservation(reservation: ReservationRecord) {
    return perform(() => circulationService.acceptReservation(reservation.uuid), 'Reservation accepted', 'Could not accept reservation', [refetchReservations])
}

// Same path as scanning the student's slip: the checkout opens with the student and book filled in.
function handleCheckoutReservation(reservation: ReservationRecord) {
    scanReservation.value = reservation
    isScanOpen.value = true
}

// The right slip was scanned: the checkout window takes over and finishes the checkout by itself.
function handleSlipScanned(pickupCode: string) {
    isScanOpen.value = false
    checkoutCode.value = pickupCode
    checkoutAuto.value = true
    isCheckoutOpen.value = true
}

// The alternative to scanning: the same form as a plain checkout, with the reservation filled in.
function handleCheckoutManually() {
    isScanOpen.value = false
    checkoutCode.value = scanReservation.value?.pickupCode
    checkoutAuto.value = false
    isCheckoutOpen.value = true
}

function handleRejectReservation(reservation: ReservationRecord) {
    return perform(() => circulationService.rejectReservation(reservation.uuid), 'Reservation rejected', 'Could not reject reservation', [refetchReservations])
}

// Verifying or rejecting a student's self-return report asks first, in the same window as returning a book:
// the loan, the book and the student, and (when it is overdue) whether the late fee has been paid.
const isReportOpen = ref(false)
const reportMode = ref<'verify' | 'reject'>('verify')
const reportTarget = ref<SelfReturnReportRecord | null>(null)
const reportPreview = ref<ReturnPreview | null>(null)
const reportLoading = ref(false)
const reportError = ref('')
const reportBusy = ref(false)

async function openReportWindow(report: SelfReturnReportRecord, mode: 'verify' | 'reject') {
    reportMode.value = mode
    reportTarget.value = report
    reportPreview.value = null
    reportError.value = ''
    isReportOpen.value = true
    reportLoading.value = true
    try {
        const { preview } = await circulationService.fetchSelfReturnPreview(report.uuid)
        if (reportTarget.value?.uuid === report.uuid) reportPreview.value = preview
    } catch (error) {
        reportError.value = apiErrorMessage(error, "Couldn't load this report. Please try again.")
    } finally {
        reportLoading.value = false
    }
}

const handleVerifySelfReturn = (report: SelfReturnReportRecord) => openReportWindow(report, 'verify')
const handleRejectSelfReturn = (report: SelfReturnReportRecord) => openReportWindow(report, 'reject')

async function confirmReport(payload: { finePaid: boolean | undefined }) {
    const report = reportTarget.value
    if (!report) return
    reportBusy.value = true
    const ok = reportMode.value === 'verify'
        ? await perform(
            () => circulationService.verifySelfReturn(report.uuid, payload.finePaid === undefined ? {} : { finePaid: payload.finePaid }),
            'Return verified', 'Could not verify return', [refetchSelfReturns, ...refreshLoanData()])
        : await perform(() => circulationService.rejectSelfReturn(report.uuid), 'Report rejected', 'Could not reject report', [refetchSelfReturns])
    reportBusy.value = false
    if (ok) isReportOpen.value = false
}

// Marking a fine paid also asks first: it shows the fine, the loan, the book and the student, then a last confirmation.
const isSettleOpen = ref(false)
const settlingPenalty = ref<PenaltyRecord | null>(null)
const settleBusy = ref(false)

function handleSettle(penalty: PenaltyRecord) {
    settlingPenalty.value = penalty
    isSettleOpen.value = true
}

async function confirmSettle() {
    const penalty = settlingPenalty.value
    if (!penalty) return
    settleBusy.value = true
    const ok = await perform(() => circulationService.settlePenalty(penalty.uuid), 'Fine settled', 'Could not settle fine', [refetchPenalties, refetchPenaltyStats])
    settleBusy.value = false
    if (ok) isSettleOpen.value = false
}

async function handleCheckoutCreated() {
    await Promise.all([refetchLoans(), refetchLoanStats(), refetchReservations()])
}
</script>
