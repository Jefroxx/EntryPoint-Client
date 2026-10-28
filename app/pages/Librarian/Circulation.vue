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
            <div class="phone-stats mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <LibrarianCatalogStatTile label="Active Loans" :value="loanStats?.active ?? '—'"
                    icon="i-tabler-book" tone="accent" />
                <LibrarianCatalogStatTile label="Due Soon" :value="loanStats?.dueSoon ?? '—'"
                    icon="i-tabler-clock" tone="warning" />
                <LibrarianCatalogStatTile label="Overdue" :value="loanStats?.overdue ?? '—'"
                    icon="i-tabler-alert-circle" tone="danger" />
                <LibrarianCatalogStatTile label="To Check" :value="loanStats?.received ?? '—'"
                    icon="i-tabler-checklist" tone="success" />
            </div>

            <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
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
                <ButtonsButton variant="primary" class="toolbar-full" @click="checkoutCode = undefined; checkoutAuto = false; isCheckoutOpen = true">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Checkout Book
                </ButtonsButton>
            </div>

            <LibrarianLoansTable :loans="loans?.data ?? []" :loading="loansPending" @return="handleReturn" @finish="openFinishReturn" />

            <LibrarianPagination v-if="loans" :shown="loans.data.length" :total="loans.total" noun="loans"
                :page="loans.current_page" :last-page="loans.last_page" @change="goToLoanPage" />
        </template>

        <!-- Reservations -->
        <template v-else-if="activeTab === 'reservations'">
            <div class="phone-stats mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <LibrarianCatalogStatTile label="Waiting" :value="reservationStats.waiting"
                    icon="i-tabler-clock" tone="warning" />
                <LibrarianCatalogStatTile label="Accepted" :value="reservationStats.accepted"
                    icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="Fulfilled" :value="reservationStats.fulfilled"
                    icon="i-tabler-book" tone="accent" />
            </div>

            <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
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

                <select v-model="reservationBook" aria-label="Filter by book"
                    class="h-[42px] max-w-[260px] rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="">All books</option>
                    <option v-for="b in reservationBookOptions" :key="b.bookID" :value="b.bookID">{{ b.title }} ({{ b.count }})</option>
                </select>

                <div class="flex-1"></div>

                <LibrarianResetFiltersButton @click="reservationSearch = ''; reservationStatus = 'open'; reservationBook = ''" />
            </div>

            <p v-if="reservationBookTitle" class="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-stone-600">
                Showing {{ filteredReservations.length }} reservations for
                <button type="button" class="inline-flex items-center gap-1.5 rounded-full bg-accent-50 py-1 pl-3 pr-1.5 text-[13px] font-semibold text-crimson"
                    aria-label="Clear the book filter" @click="reservationBook = ''">
                    {{ reservationBookTitle }}<Icon name="i-tabler-x" class="h-3.5 w-3.5" />
                </button>
            </p>

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

            <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="self-return-search" v-model="selfReturnSearch" placeholder="Search student or book" />

                <select v-model="selfReturnBook" aria-label="Filter by book"
                    class="h-[42px] max-w-[260px] rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="">All books</option>
                    <option v-for="b in selfReturnBookOptions" :key="b.bookID" :value="b.bookID">{{ b.title }} ({{ b.count }})</option>
                </select>

                <div class="flex-1"></div>

                <LibrarianResetFiltersButton @click="selfReturnSearch = ''; selfReturnBook = ''" />
            </div>

            <p v-if="selfReturnBookTitle" class="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-stone-600">
                Showing {{ filteredSelfReturns.length }} of {{ selfReturns.length }} reports for
                <button type="button" class="inline-flex items-center gap-1.5 rounded-full bg-accent-50 py-1 pl-3 pr-1.5 text-[13px] font-semibold text-crimson"
                    aria-label="Clear the book filter" @click="selfReturnBook = ''">
                    {{ selfReturnBookTitle }}<Icon name="i-tabler-x" class="h-3.5 w-3.5" />
                </button>
            </p>

            <LibrarianSelfReturnTable :reports="filteredSelfReturns" :loading="selfReturnsPending"
                @verify="handleVerifySelfReturn" @reject="handleRejectSelfReturn" />
        </template>

        <!-- Lost and damaged books: penalties for a student who lost or damaged one. They pay it, or replace the book. -->
        <template v-else-if="activeTab === 'lostdamaged'">
            <div class="phone-stats mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <LibrarianCatalogStatTile label="Unpaid" :value="copyStats?.unpaidCount ?? '—'"
                    icon="i-tabler-alert-circle" tone="danger" />
                <LibrarianCatalogStatTile label="Unpaid Total"
                    :value="copyStats ? formatPeso(copyStats.unpaidTotal) : '—'"
                    icon="i-tabler-coin" tone="warning" />
                <LibrarianCatalogStatTile label="Paid" :value="copyStats?.paidCount ?? '—'"
                    icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="Replaced" :value="copyStats?.replacedCount ?? '—'"
                    icon="i-tabler-books" tone="accent" />
            </div>

            <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="copy-penalty-search" v-model="copyPenaltySearch" placeholder="Search student or book" />

                <select v-model="copyPenaltyStatus" aria-label="Filter by status"
                    class="h-[42px] rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="">All penalties</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Replaced">Replaced</option>
                    <option value="longUnpaid">Unpaid {{ copyStats?.longUnpaidDays ?? 30 }}+ days</option>
                </select>

                <div class="flex-1"></div>

                <LibrarianResetFiltersButton @click="copyPenaltySearch = ''; copyPenaltyStatus = ''" />
                <ButtonsButton variant="primary" class="toolbar-full" @click="openIssuePenalty">
                    <Icon name="i-tabler-gavel" class="h-3.5 w-3.5" />Issue Penalty
                </ButtonsButton>
            </div>

            <LibrarianPenaltiesTable :penalties="copyPenalties?.data ?? []" :loading="copyPenaltiesPending"
                :long-unpaid-days="copyStats?.longUnpaidDays ?? 30"
                empty-text="No lost or damaged books on record. Use Issue Penalty when a student loses or damages one."
                @settle="handleSettle" @replace="handleReplace" @cancel="handleCancel" />

            <LibrarianPagination v-if="copyPenalties" :shown="copyPenalties.data.length" :total="copyPenalties.total"
                noun="penalties" :page="copyPenalties.current_page" :last-page="copyPenalties.last_page"
                @change="goToCopyPenaltyPage" />
        </template>

        <!-- Penalties -->
        <template v-else>
            <div class="phone-stats mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <LibrarianCatalogStatTile label="Unpaid Fines" :value="penaltyStats?.unpaidCount ?? '—'"
                    icon="i-tabler-alert-circle" tone="danger" />
                <LibrarianCatalogStatTile label="Unpaid Total"
                    :value="penaltyStats ? formatPeso(penaltyStats.unpaidTotal) : '—'"
                    icon="i-tabler-coin" tone="warning" />
                <LibrarianCatalogStatTile label="Settled" :value="penaltyStats?.paidCount ?? '—'"
                    icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile :label="`Unpaid ${longUnpaidDays}+ Days`" :value="penaltyStats?.longUnpaidCount ?? '—'"
                    icon="i-tabler-hourglass-high" tone="danger" />
            </div>

            <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="penalty-search" v-model="penaltySearch" placeholder="Search student" />

                <select v-model="penaltyStatus"
                    class="h-[42px] rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="">All fines</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="longUnpaid">Unpaid {{ longUnpaidDays }}+ days</option>
                </select>

                <div class="flex-1"></div>

                <LibrarianResetFiltersButton @click="penaltySearch = ''; penaltyStatus = ''" />
            </div>

            <LibrarianPenaltiesTable :penalties="penalties?.data ?? []" :loading="penaltiesPending"
                :long-unpaid-days="longUnpaidDays" @settle="handleSettle" />

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

        <LibrarianIssuePenaltyModal :open="isIssueOpen" :busy="issueBusy"
            @close="isIssueOpen = false" @submit="saveIssuePenalty" />

        <LibrarianConfirmModal :open="isReservationDecisionOpen" :title="reservationDecisionText.title"
            :message="reservationDecisionText.message" :confirm-label="reservationDecisionText.confirm"
            :danger="reservationDecision?.action === 'reject'" :loading="reservationDecisionBusy"
            @close="isReservationDecisionOpen = false" @confirm="confirmReservationDecision" />

        <LibrarianConfirmModal :open="isReplaceOpen" title="Replacement received?" confirm-label="Yes, replacement received"
            :danger="false" :loading="replaceBusy" :message="replaceMessage"
            @close="isReplaceOpen = false" @confirm="confirmReplace" />

        <LibrarianConfirmModal :open="isCancelOpen"
            :title="cancellingPenalty?.penalty_type?.category === 'lost' ? 'Was the book found?' : 'Was the book repaired?'"
            :confirm-label="cancellingPenalty?.penalty_type?.category === 'lost' ? 'Yes, it was found' : 'Yes, it was repaired'"
            :danger="false" :loading="cancelBusy" :message="cancelMessage"
            @close="isCancelOpen = false" @confirm="confirmCancel" />

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
    type PenaltyFilter,
    type IssuePenaltyPayload,
    penaltyCopy,
    penaltyStudent,
} from '~/services/circulationService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Circulation' })


const route = useRoute()
const activeTab = ref(['loans', 'reservations', 'selfreturn', 'lostdamaged', 'penalties'].includes(String(route.query.tab)) ? String(route.query.tab) : 'loans')
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
// Filter by one book ('' = every book).
const reservationBook = ref<number | ''>('')
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

// The reservations the status filter lets through; the book list is built from these, so each count matches the table.
const reservationsInStatus = computed(() => reservations.value.filter((r) => {
    if (reservationStatus.value === 'open') return r.status === 'Waiting' || r.status === 'Accepted'
    return !reservationStatus.value || r.status === reservationStatus.value
}))

const reservationBookOptions = computed(() => bookOptions(reservationsInStatus.value.map((r) => r.book)))
const reservationBookTitle = computed(() => reservationBookOptions.value.find((b) => b.bookID === reservationBook.value)?.title ?? '')

const filteredReservations = computed(() => {
    const term = reservationSearch.value.trim().toLowerCase()
    return reservationsInStatus.value.filter((r) => {
        if (reservationBook.value !== '' && r.book?.bookID !== reservationBook.value) return false
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

watch([reservationSearch, reservationStatus, reservationBook], () => {
    reservationPage.value = 1
})
// A book that has no reservations left in this view (handled, or another status picked) can't stay selected.
watch(reservationBookOptions, (options) => {
    if (reservationBook.value !== '' && !options.some((b) => b.bookID === reservationBook.value)) reservationBook.value = ''
})

// ---- Self-return reports (always the pending queue) ----
const { data: selfReturnResponse, pending: selfReturnsPending, execute: refetchSelfReturns } =
    useLiveAsyncData('circ-self-returns', () => circulationService.fetchSelfReturnReports(), { lazy: true })

const selfReturns = computed(() => selfReturnResponse.value?.reports ?? [])

// Filter the pending reports by student or book (all in the browser, like the reservations).
const selfReturnSearch = ref('')
const selfReturnBook = ref<number | ''>('')

const selfReturnBookOptions = computed(() => bookOptions(selfReturns.value.map((r) => r.loan?.copy?.book)))
const selfReturnBookTitle = computed(() => selfReturnBookOptions.value.find((b) => b.bookID === selfReturnBook.value)?.title ?? '')

const filteredSelfReturns = computed(() => {
    const term = selfReturnSearch.value.trim().toLowerCase()
    return selfReturns.value.filter((r) => {
        if (selfReturnBook.value !== '' && r.loan?.copy?.book?.bookID !== selfReturnBook.value) return false
        if (!term) return true
        return (
            personName(r.loan?.student?.user).toLowerCase().includes(term) ||
            (r.loan?.copy?.book?.title ?? '').toLowerCase().includes(term)
        )
    })
})

// Same for a book whose last pending report was just handled.
watch(selfReturnBookOptions, (options) => {
    if (selfReturnBook.value !== '' && !options.some((b) => b.bookID === selfReturnBook.value)) selfReturnBook.value = ''
})

// The distinct books in a list, with how many rows each has, A to Z: the options of a per-book filter.
function bookOptions(books: Array<{ bookID: number; title: string } | null | undefined>) {
    const counts = new Map<number, { bookID: number; title: string; count: number }>()
    for (const book of books) {
        if (!book) continue
        const entry = counts.get(book.bookID) ?? { bookID: book.bookID, title: book.title, count: 0 }
        entry.count += 1
        counts.set(book.bookID, entry)
    }
    return [...counts.values()].sort((a, b) => a.title.localeCompare(b.title))
}

// ---- Penalties (late fees) ----
const penaltySearch = ref('')
const penaltyStatus = ref<'' | PenaltyFilter>('')
const penaltyPage = ref(1)

const { data: penaltyStats, execute: refetchPenaltyStats } =
    useLiveAsyncData('circ-penalty-stats', () => circulationService.fetchPenaltyStats('late'), { lazy: true })

// The server decides how long is "long unpaid"; 30 until the stats arrive.
const longUnpaidDays = computed(() => penaltyStats.value?.longUnpaidDays ?? 30)

const { data: penalties, pending: penaltiesPending, execute: refetchPenalties } = useLiveAsyncData(
    'circ-penalties',
    () => circulationService.fetchPenalties({
        search: penaltySearch.value || undefined,
        status: penaltyStatus.value || undefined,
        kind: 'late',
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

// ---- Lost and damaged books ----
// The same kind of list as the late fees, for penalties over a book that is lost or damaged.
const copyPenaltySearch = ref('')
const copyPenaltyStatus = ref<'' | PenaltyFilter>('')
const copyPenaltyPage = ref(1)

const { data: copyStats, execute: refetchCopyStats } =
    useLiveAsyncData('circ-copy-penalty-stats', () => circulationService.fetchPenaltyStats('copy'), { lazy: true })

const { data: copyPenalties, pending: copyPenaltiesPending, execute: refetchCopyPenalties } = useLiveAsyncData(
    'circ-copy-penalties',
    () => circulationService.fetchPenalties({
        search: copyPenaltySearch.value || undefined,
        status: copyPenaltyStatus.value || undefined,
        kind: 'copy',
        page: copyPenaltyPage.value,
        perPage: 10,
    }),
    { lazy: true },
)

watch(copyPenaltySearch, debounced(() => {
    copyPenaltyPage.value = 1
    refetchCopyPenalties()
}))
watch(copyPenaltyStatus, () => {
    copyPenaltyPage.value = 1
    refetchCopyPenalties()
})

function goToCopyPenaltyPage(next: number) {
    copyPenaltyPage.value = next
    refetchCopyPenalties()
}

// Whatever changes a penalty can change either list and either set of numbers.
const refetchPenaltyData = () => [refetchPenalties, refetchPenaltyStats, refetchCopyPenalties, refetchCopyStats]

// Issuing: the librarian picks Lost or Damaged, then a loan or a student and a book. The copy is marked, a loan that was
// still out is closed, and the student is charged. They then pay it (Mark paid) or replace the book (Replaced).
const isIssueOpen = ref(false)
const issueBusy = ref(false)

function openIssuePenalty() {
    isIssueOpen.value = true
}

async function saveIssuePenalty(payload: IssuePenaltyPayload) {
    issueBusy.value = true
    const ok = await perform(() => circulationService.issueCopyPenalty(payload),
        `Penalty of ${formatPeso(payload.amount)} issued`, 'Could not issue the penalty',
        [...refetchPenaltyData(), refetchLoans, refetchLoanStats])
    issueBusy.value = false
    if (ok) isIssueOpen.value = false
}

// "Replaced": the student brought a new copy instead of paying. The penalty closes with no payment, the new copy is
// added to the catalog (with its own accession number) and the lost or damaged one is removed.
const isReplaceOpen = ref(false)
const replacingPenalty = ref<PenaltyRecord | null>(null)
const replaceBusy = ref(false)

const replaceMessage = computed(() => {
    const p = replacingPenalty.value
    if (!p) return ''
    const title = penaltyCopy(p)?.book?.title ?? 'this book'
    return `${personName(penaltyStudent(p)?.user)} brought a replacement for "${title}". The ${formatPeso(p.amount)} penalty is closed with no payment, a new copy is added to the catalog and the ${p.penalty_type?.category} copy is removed.`
})

function handleReplace(penalty: PenaltyRecord) {
    replacingPenalty.value = penalty
    isReplaceOpen.value = true
}

async function confirmReplace() {
    const penalty = replacingPenalty.value
    if (!penalty) return
    replaceBusy.value = true
    const ok = await perform(() => circulationService.replacePenalty(penalty.uuid),
        'Replacement received. The new copy is in the catalog', 'Could not record the replacement', refetchPenaltyData())
    replaceBusy.value = false
    if (ok) isReplaceOpen.value = false
}

// The book turned up (lost) or was repaired (damaged): cancel the unpaid penalty and put the copy back on the shelf.
const isCancelOpen = ref(false)
const cancellingPenalty = ref<PenaltyRecord | null>(null)
const cancelBusy = ref(false)

const cancelMessage = computed(() => {
    const p = cancellingPenalty.value
    if (!p) return ''
    const copy = penaltyCopy(p)
    return `"${copy?.book?.title ?? 'This book'}" (accession no. ${copy?.accessionNumber}) goes back on the shelf as available, and the unpaid ${formatPeso(p.amount)} penalty for ${personName(penaltyStudent(p)?.user)} is cancelled, because they no longer owe for it.`
})

function handleCancel(penalty: PenaltyRecord) {
    cancellingPenalty.value = penalty
    isCancelOpen.value = true
}

async function confirmCancel() {
    const penalty = cancellingPenalty.value
    if (!penalty) return
    cancelBusy.value = true
    const ok = await perform(() => circulationService.cancelCopyPenalty(penalty.uuid),
        'Penalty cancelled. The copy is back on the shelf', 'Could not cancel the penalty', refetchPenaltyData())
    cancelBusy.value = false
    if (ok) isCancelOpen.value = false
}

// ---- Tabs ----
const tabs = computed(() => [
    { label: 'Active Loans', short: 'Loans', value: 'loans', badge: loanStats.value?.received || undefined },
    { label: 'Reservations', short: 'Reserved', value: 'reservations', badge: reservationStats.value.waiting },
    { label: 'Self-Return Reports', short: 'Self-returns', value: 'selfreturn', badge: selfReturns.value.length },
    { label: 'Lost & Damaged', short: 'Lost', value: 'lostdamaged', badge: copyStats.value?.unpaidCount || undefined },
    { label: 'Penalties', short: 'Fines', value: 'penalties' },
])

// ---- Actions ----
const { perform } = useAction()

// A return can leave a copy marked damaged, so the Lost and damaged tab refreshes with the loans.
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

async function confirmReturn(payload: { finePaid: boolean | undefined; receiptNumber?: string }) {
    const loan = returningLoan.value
    if (!loan) return
    returnBusy.value = true
    const ok = await perform(
        () => circulationService.returnLoan(loan.uuid, payload.finePaid === undefined ? {} : { finePaid: payload.finePaid, receiptNumber: payload.receiptNumber }),
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

// Accepting or rejecting a reservation asks first: the student is told either way, and neither can be taken back.
const reservationDecision = ref<{ reservation: ReservationRecord; action: 'accept' | 'reject' } | null>(null)
const isReservationDecisionOpen = ref(false)
const reservationDecisionBusy = ref(false)

const reservationDecisionText = computed(() => {
    const d = reservationDecision.value
    if (!d) return { title: '', message: '', confirm: '' }
    const who = personName(d.reservation.student?.user)
    const book = d.reservation.book?.title ?? 'this book'
    return d.action === 'accept'
        ? {
            title: 'Accept this reservation?',
            message: `Accept ${who}'s reservation for "${book}"? A copy is held for them and they are told it is ready for pickup.`,
            confirm: 'Yes, accept',
        }
        : {
            title: 'Reject this reservation?',
            message: `Reject ${who}'s reservation for "${book}"? They are told it was declined and no copy is held for them. This can't be undone.`,
            confirm: 'Yes, reject',
        }
})

function handleAcceptReservation(reservation: ReservationRecord) {
    reservationDecision.value = { reservation, action: 'accept' }
    isReservationDecisionOpen.value = true
}

async function confirmReservationDecision() {
    const decision = reservationDecision.value
    if (!decision) return
    const { reservation, action } = decision
    reservationDecisionBusy.value = true
    const ok = action === 'accept'
        ? await perform(() => circulationService.acceptReservation(reservation.uuid), 'Reservation accepted', 'Could not accept reservation', [refetchReservations])
        : await perform(() => circulationService.rejectReservation(reservation.uuid), 'Reservation rejected', 'Could not reject reservation', [refetchReservations])
    reservationDecisionBusy.value = false
    if (ok) isReservationDecisionOpen.value = false
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
    reservationDecision.value = { reservation, action: 'reject' }
    isReservationDecisionOpen.value = true
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

async function confirmReport(payload: { finePaid: boolean | undefined; receiptNumber?: string; reason?: string }) {
    const report = reportTarget.value
    if (!report) return
    reportBusy.value = true
    const ok = reportMode.value === 'verify'
        ? await perform(
            () => circulationService.verifySelfReturn(report.uuid, payload.finePaid === undefined ? {} : { finePaid: payload.finePaid, receiptNumber: payload.receiptNumber }),
            'Return verified', 'Could not verify return', [refetchSelfReturns, ...refreshLoanData()])
        : await perform(() => circulationService.rejectSelfReturn(report.uuid, { reason: payload.reason ?? '' }), 'Report rejected', 'Could not reject report', [refetchSelfReturns])
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

async function confirmSettle(payload: { receiptNumber: string }) {
    const penalty = settlingPenalty.value
    if (!penalty) return
    settleBusy.value = true
    const ok = await perform(() => circulationService.settlePenalty(penalty.uuid, { receiptNumber: payload.receiptNumber }), 'Fine settled', 'Could not settle fine', refetchPenaltyData())
    settleBusy.value = false
    if (ok) isSettleOpen.value = false
}

async function handleCheckoutCreated() {
    await Promise.all([refetchLoans(), refetchLoanStats(), refetchReservations()])
}
</script>
