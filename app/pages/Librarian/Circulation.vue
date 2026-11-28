<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Circulation</h1>
            <p class="dashboard-heading mt-1 text-crimson">Manage reservations, borrowing, returns and
                penalties.</p>
        </div>

        <!-- Four tabs. On a phone or tablet they wrap onto a second row and fill the width, so none is hidden off the edge. -->
        <LibrarianSegmentedTabs v-model="activeTab" wrap class="mb-5" :tabs="tabs" />

        <!-- Active loans -->
        <template v-if="activeTab === 'loans'">
            <!-- Four counts, and each one is the filter for its list. -->
            <div class="phone-stats mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <LibrarianStatTileButton v-for="tile in loanTiles" :key="tile.status" :label="tile.label" :value="tile.value" :icon="tile.icon" :tone="tile.tone"
                    :active="loanStatus === tile.status" @click="loanStatus = loanStatus === tile.status ? '' : tile.status" />
            </div>

            <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="loan-search" v-model="loanSearch" class="!min-w-[210px]" placeholder="Search student or book" />
                <LibrarianFilterMenu class="toolbar-full" v-model="loanFilters" :groups="loanFilterGroups" />
                <div class="flex-1"></div>
                <ButtonsButton variant="primary" class="toolbar-full" @click="isCheckoutOpen = true">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Checkout Book
                </ButtonsButton>
            </div>

            <LibrarianLoansTable :loans="loans?.data ?? []" :loading="loansPending" @return="handleReturn" @finish="openFinishReturn" />

            <LibrarianPagination v-if="loans" :shown="loans.data.length" :total="loans.total" noun="loans"
                :page="loans.current_page" :last-page="loans.last_page" @change="goToLoanPage" />
        </template>

        <!-- Reservations -->
        <template v-else-if="activeTab === 'reservations'">
            <!-- One count per status, and each is also the filter: tap one to show only those, tap it again to go back to what is open. -->
            <div class="mb-5 grid grid-cols-6 gap-2 sm:gap-3 xl:grid-cols-5">
                <button v-for="(tile, i) in reservationTiles" :key="tile.status" type="button"
                    class="rounded-2xl text-left xl:col-span-1 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-accent-200 sm:rounded-[18px]"
                    :class="i < 3 ? 'col-span-2' : 'col-span-3'"
                    :aria-pressed="reservationStatus === tile.status"
                    @click="reservationStatus = reservationStatus === tile.status ? 'open' : tile.status">
                    <LibrarianCatalogStatTile :label="tile.label" :value="tile.value" :icon="tile.icon" :tone="tile.tone" :active="reservationStatus === tile.status" interactive />
                </button>
            </div>

            <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="reservation-search" v-model="reservationSearch" class="!min-w-[210px]" placeholder="Search student or book" />
                <LibrarianFilterMenu class="toolbar-full" v-model="reservationFilters" :groups="reservationFilterGroups" />
                <div class="flex-1"></div>
            </div>

            <LibrarianReservationsTable :reservations="pagedReservations" :queue-positions="queuePositions" :loading="reservationsPending" :max-books="reservationsResponse?.maxBooks" @review="openReview" />

            <LibrarianPagination :shown="pagedStudentKeys.length" :total="reservationStudentKeys.length"
                noun="students" :page="reservationPage" :last-page="reservationTotalPages"
                @change="reservationPage = $event" />
        </template>

        <!-- Self-return reports -->
        <template v-else-if="activeTab === 'selfreturn'">
            <div class="mb-5 grid grid-cols-1 gap-3 sm:max-w-[280px]">
                <LibrarianCatalogStatTile label="Pending Verification" :value="selfReturns.length"
                    icon="i-tabler-clock" tone="warning" />
            </div>

            <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="self-return-search" v-model="selfReturnSearch" class="!min-w-[210px]" placeholder="Search student or book" />
                <LibrarianFilterMenu class="toolbar-full" v-model="selfReturnFilters" :groups="selfReturnFilterGroups" />
                <div class="flex-1"></div>
            </div>

            <LibrarianSelfReturnTable :reports="filteredSelfReturns" :loading="selfReturnsPending"
                @verify="handleVerifySelfReturn" @reject="handleRejectSelfReturn" />
        </template>

        <!-- Penalties: late fees, and lost or damaged books (technically penalties too) -->
        <template v-else>
            <LibrarianSegmentedTabs v-model="penaltyView" wrap class="mb-5" :tabs="penaltyViews" />

            <!-- Late fees -->
            <template v-if="penaltyView === 'late'">
                <div class="phone-stats mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <LibrarianStatTileButton v-for="tile in lateTiles" :key="tile.label" :label="tile.label" :value="tile.value" :icon="tile.icon" :tone="tile.tone"
                        :active="penaltyStatus === tile.status" @click="penaltyStatus = penaltyStatus === tile.status ? '' : tile.status" />
                </div>

                <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                    <LibrarianSearchInput id="penalty-search" v-model="penaltySearch" class="!min-w-[210px]" placeholder="Search student or book" />
                    <LibrarianFilterMenu class="toolbar-full" v-model="penaltyFilters" :groups="penaltyFilterGroups" />
                    <div class="flex-1"></div>
                </div>

                <LibrarianPenaltiesTable :penalties="penalties?.data ?? []" :loading="penaltiesPending"
                    :long-unpaid-days="longUnpaidDays" empty-text="No late fees match your filters." @settle="handleSettle" @edit="handleEdit" @waive="handleWaive" />

                <LibrarianPagination v-if="penalties" :shown="penalties.data.length" :total="penalties.total"
                    noun="late fees" :page="penalties.current_page" :last-page="penalties.last_page"
                    @change="goToPenaltyPage" />
            </template>

            <!-- Lost and damaged books: the student pays it, or replaces the book. -->
            <template v-else>
                <div class="phone-stats mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <LibrarianStatTileButton v-for="tile in lostTiles" :key="tile.label" :label="tile.label" :value="tile.value" :icon="tile.icon" :tone="tile.tone"
                        :active="copyPenaltyStatus === tile.status" @click="copyPenaltyStatus = copyPenaltyStatus === tile.status ? '' : tile.status" />
                </div>

                <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                    <LibrarianSearchInput id="copy-penalty-search" v-model="copyPenaltySearch" class="!min-w-[210px]" placeholder="Search student or book" />
                    <LibrarianFilterMenu class="toolbar-full" v-model="copyPenaltyFilters" :groups="copyPenaltyFilterGroups" />
                    <div class="flex-1"></div>
                    <ButtonsButton variant="primary" class="toolbar-full" @click="openIssuePenalty">
                        <Icon name="i-tabler-gavel" class="h-3.5 w-3.5" />Issue Penalty
                    </ButtonsButton>
                </div>

                <LibrarianPenaltiesTable :penalties="copyPenalties?.data ?? []" :loading="copyPenaltiesPending"
                    :long-unpaid-days="copyStats?.longUnpaidDays ?? 30"
                    empty-text="No lost or damaged books on record. Use Issue Penalty when a student loses or damages one."
                    @settle="handleSettle" @replace="handleReplace" @cancel="handleCancel" @edit="handleEdit" />

                <LibrarianPagination v-if="copyPenalties" :shown="copyPenalties.data.length" :total="copyPenalties.total"
                    noun="penalties" :page="copyPenalties.current_page" :last-page="copyPenalties.last_page"
                    @change="goToCopyPenaltyPage" />
            </template>
        </template>


        <LibrarianReservationReviewModal :open="isReviewOpen" :items="reviewItems" :queue-positions="queuePositions" :busy="reviewBusy"
            @close="isReviewOpen = false" @accept="acceptMany" @reject="rejectMany" @cancel="cancelAccepted" @checkout="checkoutFromReview" />

        <LibrarianReservationPickupModal :open="isPickupOpen" :reservation="pickupReservation" :code="pickupCode"
            @close="isPickupOpen = false" @created="handleCheckoutCreated" @manual="handleCheckoutManually" />

        <LibrarianCheckoutModal :open="isCheckoutOpen" @close="isCheckoutOpen = false" @created="handleCheckoutCreated"
            @pickup="(code: string) => void openPickupFromCode(code)" @return="(loan: { uuid: string; handedIn: boolean }) => void openReturnFor(loan.uuid, loan.handedIn)" />

        <LibrarianReturnLoanModal :open="isReportOpen" :mode="reportMode" :preview="reportPreview" :loading="reportLoading" :error="reportError"
            :busy="reportBusy" @close="isReportOpen = false" @submit="confirmReport" />

        <LibrarianSettleFineModal :open="isSettleOpen" :penalty="settlingPenalty" :busy="settleBusy"
            @close="isSettleOpen = false" @submit="confirmSettle" />

        <LibrarianReturnLoanModal :open="isReturnOpen" :preview="returnPreview" :loading="returnLoading" :error="returnError"
            :busy="returnBusy" @close="isReturnOpen = false" @submit="confirmReturn" />

        <LibrarianIssuePenaltyModal :open="isIssueOpen" :busy="issueBusy" :prefill="issuePrefill"
            @close="isIssueOpen = false" @submit="saveIssuePenalty" />

        <LibrarianConfirmModal :open="isReplaceOpen" title="Replacement Received?" confirm-label="Yes, replacement received"
            :danger="false" :loading="replaceBusy" :message="replaceMessage"
            @close="isReplaceOpen = false" @confirm="confirmReplace" />

        <LibrarianConfirmModal :open="isCancelOpen"
            :title="cancellingPenalty?.penalty_type?.kind === 'lost' ? 'Was the book found?' : 'Was the book repaired?'"
            :confirm-label="cancellingPenalty?.penalty_type?.kind === 'lost' ? 'Yes, it was found' : 'Yes, it was repaired'"
            :danger="false" :loading="cancelBusy" :message="cancelMessage"
            @close="isCancelOpen = false" @confirm="confirmCancel" />

        <LibrarianEditPenaltyModal :open="isEditOpen" :penalty="editingPenalty" :busy="editBusy" @close="isEditOpen = false" @submit="saveEdit" />

        <LibrarianConfirmModal :open="isWaiveOpen" title="Waive This Fine?" confirm-label="Yes, waive it" :danger="false" :loading="waiveBusy" :confirm-disabled="waiveReason.trim().length < 3"
            :message="waiveMessage" @close="isWaiveOpen = false" @confirm="confirmWaive">
            <label for="waive-reason" class="mb-1.5 mt-4 block text-[13.5px] font-semibold text-stone-800">Reason the student will see<FieldRequired /></label>
            <textarea id="waive-reason" v-model="waiveReason" rows="3" maxlength="500" placeholder="e.g. The library was closed on the due date"
                class="w-full resize-none rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-[14.5px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
            <p v-if="waiveError" class="mt-1 text-[12.5px] text-red-500">{{ waiveError }}</p>
        </LibrarianConfirmModal>

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
import { LIBRARY_AREAS, librarianService, type CatalogBook } from '~/services/librarianService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Circulation' })


const route = useRoute()
// Lost & Damaged is a view inside Penalties now; the old address (?tab=lostdamaged) still lands there.
const requestedTab = String(route.query.tab)
const activeTab = ref(['loans', 'reservations', 'selfreturn', 'penalties'].includes(requestedTab) ? requestedTab : requestedTab === 'lostdamaged' ? 'penalties' : 'loans')
const penaltyView = ref<'late' | 'lost'>(requestedTab === 'lostdamaged' || route.query.view === 'lost' ? 'lost' : 'late')

// The Filter window deals in strings with 'all' meaning "no filter"; each list keeps its own typed refs, so these translate.
const ALL = 'all'
const areaOptions = computed(() => [
    { value: ALL, label: 'All collections' },
    ...Object.entries(LIBRARY_AREAS).map(([value, label]) => ({ value, label: String(label) })),
])
const isCheckoutOpen = ref(false)
// A reserved book being collected: one window (slip, the book in hand, confirm), whichever way it was started.
const isPickupOpen = ref(false)
// Picked from the Reservations tab: the slip still has to be shown.
const pickupReservation = ref<ReservationRecord | null>(null)
// A slip already scanned (the Station, or the Pickup code in Checkout): the window starts at the book.
const pickupCode = ref<string | null>(null)

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
const loanStatus = ref<'' | 'later' | 'dueSoon' | 'overdue' | 'received' | 'returned'>(route.query.status === 'overdue' ? 'overdue' : '')
const loanArea = ref('')
const loanPage = ref(1)

const { data: loanStats, execute: refetchLoanStats } =
    useLiveAsyncData('circ-loan-stats', () => circulationService.fetchLoanStats(), { lazy: true })

const { data: loans, pending: loansPending, execute: refetchLoans } = useLiveAsyncData(
    'circ-loans',
    () => circulationService.fetchLoans({
        search: loanSearch.value || undefined,
        status: loanStatus.value || undefined,
        area: loanArea.value || undefined,
        page: loanPage.value,
        perPage: 12,
    }),
    { lazy: true },
)

watch(loanSearch, debounced(() => {
    loanPage.value = 1
    refetchLoans()
}))
const loanFilterGroups = computed(() => [
    { key: 'status', title: 'Status', options: [{ value: ALL, label: 'Any status' }, { value: 'later', label: 'Due later' }, { value: 'dueSoon', label: 'Due within a day' }, { value: 'overdue', label: 'Overdue' }, { value: 'received', label: 'To check' }, { value: 'returned', label: 'Returned' }] },
    { key: 'area', title: 'Collection', options: areaOptions.value },
])
const loanFilters = computed({
    get: () => ({ status: loanStatus.value || ALL, area: loanArea.value || ALL }),
    set: (v) => {
        loanStatus.value = (v.status === ALL ? '' : v.status) as typeof loanStatus.value
        loanArea.value = v.area === ALL ? '' : v.area
    },
})
watch([loanStatus, loanArea], () => {
    loanPage.value = 1
    refetchLoans()
})

function goToLoanPage(next: number) {
    loanPage.value = next
    refetchLoans()
}

// The counts above the list: due later, due within a day, overdue, and books handed in at the desk that still need checking.
const loanTiles = computed(() => [
    { status: 'later' as const, label: 'Due Later', value: loanStats.value?.later ?? '—', icon: 'i-tabler-book', tone: 'accent' as const },
    { status: 'dueSoon' as const, label: 'Due Within a Day', value: loanStats.value?.dueSoon ?? '—', icon: 'i-tabler-clock', tone: 'warning' as const },
    { status: 'overdue' as const, label: 'Overdue', value: loanStats.value?.overdue ?? '—', icon: 'i-tabler-alert-circle', tone: 'danger' as const },
    { status: 'received' as const, label: 'To Check', value: loanStats.value?.received ?? '—', icon: 'i-tabler-checklist', tone: 'success' as const },
])

// ---- Reservations (fetched once, filtered + paged in the browser) ----
const { data: reservationsResponse, pending: reservationsPending, execute: refetchReservations, quietRefresh: quietRefreshReservations } =
    useLiveAsyncData('circ-reservations', () => circulationService.fetchReservations(), { lazy: true })

const reservations = computed(() => reservationsResponse.value?.reservations ?? [])

/** Change one row on screen right away (the data is a shallow ref, so the list is replaced, not edited). */
function setReservationStatus(uuid: string, status: ReservationStatus) {
    const current = reservationsResponse.value
    if (!current) return
    reservationsResponse.value = { ...current, reservations: current.reservations.map((r) => (r.uuid === uuid ? { ...r, status } : r)) }
}
const reservationSearch = ref('')
// 'open' = still to be dealt with: waiting for a decision, or accepted and waiting for pickup.
const reservationStatus = ref<'' | 'open' | ReservationStatus>('open')
const reservationPage = ref(1)
// Filter by one book ('' = every book).
const reservationBook = ref<number | ''>('')
const RESERVATIONS_PER_PAGE = 12 // students per page: whole rows of the 1, 2 and 3 column card grid

const reservationStats = computed(() => ({
    waiting: reservations.value.filter((r) => r.status === 'Waiting').length,
    accepted: reservations.value.filter((r) => r.status === 'Accepted').length,
    fulfilled: reservations.value.filter((r) => r.status === 'Fulfilled').length,
    rejected: reservations.value.filter((r) => r.status === 'Rejected').length,
    expired: reservations.value.filter((r) => r.status === 'Expired').length,
}))

// One count for every status, at the top, and each doubles as its filter. With none picked the list shows what is open (waiting for review + ready for pickup).
const reservationTiles = computed(() => [
    { status: 'Waiting' as const, label: 'Waiting for Review', value: reservationStats.value.waiting, icon: 'i-tabler-clock', tone: 'warning' as const },
    { status: 'Accepted' as const, label: 'Ready for Pickup', value: reservationStats.value.accepted, icon: 'i-tabler-circle-check', tone: 'success' as const },
    { status: 'Fulfilled' as const, label: 'Checked Out', value: reservationStats.value.fulfilled, icon: 'i-tabler-book', tone: 'accent' as const },
    { status: 'Rejected' as const, label: 'Rejected', value: reservationStats.value.rejected, icon: 'i-tabler-circle-x', tone: 'danger' as const },
    { status: 'Expired' as const, label: 'Expired', value: reservationStats.value.expired, icon: 'i-tabler-clock-off', tone: 'accent' as const },
])

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

// A card is one student, so pages hold whole students: a student's books are never split across two pages.
const studentKeyOfReservation = (r: ReservationRecord) => r.student?.memberIDNumber ?? `reservation-${r.reservationID}`
const reservationStudentKeys = computed(() => [...new Set(filteredReservations.value.map(studentKeyOfReservation))])

const reservationTotalPages = computed(() =>
    Math.max(1, Math.ceil(reservationStudentKeys.value.length / RESERVATIONS_PER_PAGE)))

const pagedStudentKeys = computed(() => {
    const start = (reservationPage.value - 1) * RESERVATIONS_PER_PAGE
    return reservationStudentKeys.value.slice(start, start + RESERVATIONS_PER_PAGE)
})

const pagedReservations = computed(() => {
    const keys = new Set(pagedStudentKeys.value)
    return filteredReservations.value.filter((r) => keys.has(studentKeyOfReservation(r)))
})

watch([reservationSearch, reservationStatus, reservationBook], () => {
    reservationPage.value = 1
})

// 'open' (waiting for review, or ready for pickup) is what the list shows when nothing is picked.
const reservationFilterGroups = computed(() => [
    { key: 'status', title: 'Status', allValue: 'open', options: [{ value: 'open', label: 'Open (waiting or ready)' }, { value: 'Waiting', label: 'Waiting for review' }, { value: 'Accepted', label: 'Ready for pickup' }, { value: 'Fulfilled', label: 'Checked out' }, { value: 'Rejected', label: 'Rejected' }, { value: 'Expired', label: 'Expired' }, { value: 'every', label: 'All statuses' }] },
    { key: 'book', title: 'Book', options: [{ value: ALL, label: 'All books' }, ...reservationBookOptions.value.map((b) => ({ value: String(b.bookID), label: `${b.title} (${b.count})`, badge: b.title }))] },
])
const reservationFilters = computed({
    get: () => ({ status: reservationStatus.value === '' ? 'every' : reservationStatus.value, book: reservationBook.value === '' ? ALL : String(reservationBook.value) }),
    set: (v) => {
        reservationStatus.value = (v.status === 'every' ? '' : v.status) as typeof reservationStatus.value
        reservationBook.value = v.book === ALL ? '' : Number(v.book)
    },
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
// When it was reported: today, in the last 7 days, or longer ago.
const selfReturnWhen = ref<'' | 'today' | '7' | 'older'>('')

const selfReturnBookOptions = computed(() => bookOptions(selfReturns.value.map((r) => r.loan?.copy?.book)))
const selfReturnBookTitle = computed(() => selfReturnBookOptions.value.find((b) => b.bookID === selfReturnBook.value)?.title ?? '')

const filteredSelfReturns = computed(() => {
    const term = selfReturnSearch.value.trim().toLowerCase()
    return selfReturns.value.filter((r) => {
        if (selfReturnBook.value !== '' && r.loan?.copy?.book?.bookID !== selfReturnBook.value) return false
        if (selfReturnWhen.value) {
            const days = (Date.now() - new Date(r.reportedAt).getTime()) / 86_400_000
            if (selfReturnWhen.value === 'today' ? days >= 1 : selfReturnWhen.value === '7' ? days >= 7 : days < 7) return false
        }
        if (!term) return true
        return (
            personName(r.loan?.student?.user).toLowerCase().includes(term) ||
            (r.loan?.copy?.book?.title ?? '').toLowerCase().includes(term)
        )
    })
})

const selfReturnFilterGroups = computed(() => [
    { key: 'book', title: 'Book', options: [{ value: ALL, label: 'All books' }, ...selfReturnBookOptions.value.map((b) => ({ value: String(b.bookID), label: `${b.title} (${b.count})`, badge: b.title }))] },
    { key: 'when', title: 'Reported', options: [{ value: ALL, label: 'Any time' }, { value: 'today', label: 'Today' }, { value: '7', label: 'In the last 7 days' }, { value: 'older', label: 'Longer ago' }] },
])
const selfReturnFilters = computed({
    get: () => ({ book: selfReturnBook.value === '' ? ALL : String(selfReturnBook.value), when: selfReturnWhen.value || ALL }),
    set: (v) => {
        selfReturnBook.value = v.book === ALL ? '' : Number(v.book)
        selfReturnWhen.value = (v.when === ALL ? '' : v.when) as typeof selfReturnWhen.value
    },
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
const penaltyArea = ref('')
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
        area: penaltyArea.value || undefined,
        kind: 'late',
        page: penaltyPage.value,
        perPage: 12,
    }),
    { lazy: true },
)

watch(penaltySearch, debounced(() => {
    penaltyPage.value = 1
    refetchPenalties()
}))
const lateTiles = computed(() => [
    { status: 'Unpaid' as const, label: 'Unpaid', value: penaltyStats.value?.unpaidCount ?? '—', icon: 'i-tabler-alert-circle', tone: 'danger' as const },
    { status: 'Unpaid' as const, label: 'Unpaid Total', value: penaltyStats.value ? formatPeso(penaltyStats.value.unpaidTotal) : '—', icon: 'i-tabler-coin', tone: 'warning' as const },
    { status: 'Paid' as const, label: 'Paid', value: penaltyStats.value?.paidCount ?? '—', icon: 'i-tabler-circle-check', tone: 'success' as const },
    { status: 'longUnpaid' as const, label: `Unpaid ${longUnpaidDays.value}+ Days`, value: penaltyStats.value?.longUnpaidCount ?? '—', icon: 'i-tabler-hourglass-high', tone: 'danger' as const },
])

const penaltyFilterGroups = computed(() => [
    { key: 'status', title: 'Status', options: [{ value: ALL, label: 'Any status' }, { value: 'Unpaid', label: 'Unpaid' }, { value: 'Paid', label: 'Paid' }, { value: 'Waived', label: 'Waived' }, { value: 'longUnpaid', label: `Unpaid ${longUnpaidDays.value}+ days` }] },
    { key: 'area', title: 'Collection', options: areaOptions.value },
])
const penaltyFilters = computed({
    get: () => ({ status: penaltyStatus.value || ALL, area: penaltyArea.value || ALL }),
    set: (v) => {
        penaltyStatus.value = (v.status === ALL ? '' : v.status) as typeof penaltyStatus.value
        penaltyArea.value = v.area === ALL ? '' : v.area
    },
})
watch([penaltyStatus, penaltyArea], () => {
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
const copyPenaltyType = ref<'' | 'lost' | 'damaged'>('')
const copyPenaltyPage = ref(1)

const { data: copyStats, execute: refetchCopyStats } =
    useLiveAsyncData('circ-copy-penalty-stats', () => circulationService.fetchPenaltyStats('copy'), { lazy: true })

const { data: copyPenalties, pending: copyPenaltiesPending, execute: refetchCopyPenalties } = useLiveAsyncData(
    'circ-copy-penalties',
    () => circulationService.fetchPenalties({
        search: copyPenaltySearch.value || undefined,
        status: copyPenaltyStatus.value || undefined,
        type: copyPenaltyType.value || undefined,
        kind: 'copy',
        page: copyPenaltyPage.value,
        perPage: 12,
    }),
    { lazy: true },
)

watch(copyPenaltySearch, debounced(() => {
    copyPenaltyPage.value = 1
    refetchCopyPenalties()
}))
const lostTiles = computed(() => [
    { status: 'Unpaid' as const, label: 'Unpaid', value: copyStats.value?.unpaidCount ?? '—', icon: 'i-tabler-alert-circle', tone: 'danger' as const },
    { status: 'Unpaid' as const, label: 'Unpaid Total', value: copyStats.value ? formatPeso(copyStats.value.unpaidTotal) : '—', icon: 'i-tabler-coin', tone: 'warning' as const },
    { status: 'Paid' as const, label: 'Paid', value: copyStats.value?.paidCount ?? '—', icon: 'i-tabler-circle-check', tone: 'success' as const },
    { status: 'Replaced' as const, label: 'Replaced', value: copyStats.value?.replacedCount ?? '—', icon: 'i-tabler-books', tone: 'accent' as const },
])

const copyPenaltyFilterGroups = computed(() => [
    { key: 'status', title: 'Status', options: [{ value: ALL, label: 'Any status' }, { value: 'Unpaid', label: 'Unpaid' }, { value: 'Paid', label: 'Paid' }, { value: 'Waived', label: 'Waived' }, { value: 'Replaced', label: 'Replaced' }, { value: 'longUnpaid', label: `Unpaid ${copyStats.value?.longUnpaidDays ?? 30}+ days` }] },
    { key: 'type', title: 'What happened', options: [{ value: ALL, label: 'Lost or damaged' }, { value: 'lost', label: 'Lost' }, { value: 'damaged', label: 'Damaged' }] },
])
const copyPenaltyFilters = computed({
    get: () => ({ status: copyPenaltyStatus.value || ALL, type: copyPenaltyType.value || ALL }),
    set: (v) => {
        copyPenaltyStatus.value = (v.status === ALL ? '' : v.status) as typeof copyPenaltyStatus.value
        copyPenaltyType.value = (v.type === ALL ? '' : v.type) as typeof copyPenaltyType.value
    },
})
watch([copyPenaltyStatus, copyPenaltyType], () => {
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
// Sent here from a copy in the Library page (Edit copy > Go to Lost & Damaged): the book and copy come along.
const issuePrefill = ref<{ type: 'lost' | 'damaged'; book: CatalogBook; copyID: number } | null>(null)

function openIssuePenalty() {
    issuePrefill.value = null
    isIssueOpen.value = true
}

onMounted(async () => {
    const bookUuid = String(route.query.issueBook ?? '')
    const copyUuid = String(route.query.issueCopy ?? '')
    if (!bookUuid || !copyUuid) return

    // Drop the flags from the address so a refresh doesn't reopen the window (address bar only, as for the checkout flag above).
    const url = new URL(window.location.href)
    url.searchParams.delete('issueBook')
    url.searchParams.delete('issueCopy')
    window.history.replaceState(window.history.state, '', url)

    try {
        const { book } = await librarianService.fetchBook(bookUuid)
        const copy = book.copies.find((c) => c.uuid === copyUuid)
        if (!copy) return
        issuePrefill.value = { type: copy.status === 'damaged' ? 'damaged' : 'lost', book: book as unknown as CatalogBook, copyID: copy.copyID }
        isIssueOpen.value = true
    } catch {
        // Could not load the book: the window can still be opened by hand with "Issue a Penalty".
    }
})

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
    return `${personName(penaltyStudent(p)?.user)} brought a replacement for "${title}". The ${formatPeso(p.amount)} penalty is closed with no payment, a new copy is added to the catalog and the ${p.penalty_type?.kind} copy is removed.`
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

// Edit an unpaid penalty (its note, and its amount once settled), or waive a late fee.
const isEditOpen = ref(false)
const editingPenalty = ref<PenaltyRecord | null>(null)
const editBusy = ref(false)

function handleEdit(penalty: PenaltyRecord) {
    editingPenalty.value = penalty
    isEditOpen.value = true
}

async function saveEdit(payload: { amount?: number; reason: string }) {
    const penalty = editingPenalty.value
    if (!penalty) return
    editBusy.value = true
    const ok = await perform(() => circulationService.updatePenalty(penalty.uuid, payload),
        'Penalty updated', 'Could not update the penalty', refetchPenaltyData())
    editBusy.value = false
    if (ok) isEditOpen.value = false
}

const isWaiveOpen = ref(false)
const waivingPenalty = ref<PenaltyRecord | null>(null)
const waiveBusy = ref(false)
const waiveReason = ref('')
const waiveError = ref('')

const waiveMessage = computed(() => {
    const p = waivingPenalty.value
    if (!p) return ''
    return `${personName(penaltyStudent(p)?.user)} no longer owes the ${formatPeso(p.amount)} late fee, and is told. This can't be undone.`
})

function handleWaive(penalty: PenaltyRecord) {
    waivingPenalty.value = penalty
    waiveReason.value = ''
    waiveError.value = ''
    isWaiveOpen.value = true
}

async function confirmWaive() {
    const penalty = waivingPenalty.value
    if (!penalty) return
    if (waiveReason.value.trim().length < 3) { waiveError.value = 'Write a short reason.'; return }
    waiveBusy.value = true
    const ok = await perform(() => circulationService.waivePenalty(penalty.uuid, { reason: waiveReason.value.trim() }),
        'Fine waived', 'Could not waive the fine', refetchPenaltyData())
    waiveBusy.value = false
    if (ok) isWaiveOpen.value = false
}

// ---- Tabs ----
const tabs = computed(() => [
    { label: 'Active Loans', short: 'Loans', value: 'loans' },
    { label: 'Reservations', short: 'Reservations', value: 'reservations', badge: reservationStats.value.waiting },
    { label: 'Self-Return Reports', short: 'Self-Returns', value: 'selfreturn', badge: selfReturns.value.length },
    { label: 'Penalties', short: 'Penalties', value: 'penalties', badge: copyStats.value?.unpaidCount || undefined },
])

// Penalties: late fees, and lost or damaged books (which are penalties too).
const penaltyViews = computed(() => [
    { label: 'Late Fees', value: 'late' },
    { label: 'Lost & Damaged', short: 'Lost', value: 'lost', badge: copyStats.value?.unpaidCount || undefined },
])

// ---- Leaving a tab clears its search and filters ----
// Nothing typed or picked should be waiting, forgotten, when you come back.
function clearLoans() { loanSearch.value = ''; loanStatus.value = ''; loanArea.value = '' }
function clearReservations() { reservationSearch.value = ''; reservationStatus.value = 'open'; reservationBook.value = '' }
function clearSelfReturns() { selfReturnSearch.value = ''; selfReturnBook.value = ''; selfReturnWhen.value = '' }
function clearLate() { penaltySearch.value = ''; penaltyStatus.value = ''; penaltyArea.value = '' }
function clearLost() { copyPenaltySearch.value = ''; copyPenaltyStatus.value = ''; copyPenaltyType.value = '' }

watch(activeTab, (_, left) => {
    if (left === 'loans') clearLoans()
    else if (left === 'reservations') clearReservations()
    else if (left === 'selfreturn') clearSelfReturns()
    else if (left === 'penalties') { clearLate(); clearLost() }
})
watch(penaltyView, (_, left) => { if (left === 'late') clearLate(); else clearLost() })

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
// Opened from the scan station by the loan's id alone: the summary comes from the loan's return preview instead.
const finishSummaryFromScan = ref<{ bookTitle: string; accessionNumber: number; studentName: string } | null>(null)
const finishSummary = computed(() => {
    if (finishSummaryFromScan.value) return finishSummaryFromScan.value
    const loan = finishingLoan.value
    if (!loan) return null
    return {
        bookTitle: loan.copy?.book?.title ?? 'Book',
        accessionNumber: loan.copy?.accessionNumber ?? 0,
        studentName: loan.student?.user ? `${loan.student.user.firstName} ${loan.student.user.lastName}` : 'The student',
    }
})

function openFinishReturn(loan: LoanRecord) {
    finishSummaryFromScan.value = null
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

// ---- One student's pop-up: accept or reject several of their reservations in one go ----
const isReviewOpen = ref(false)
const reviewKey = ref('')
const reviewBusy = ref(false)
const popupAlert = useAlert()

const studentKeyOf = (r: ReservationRecord) => r.student?.memberIDNumber ?? `reservation-${r.reservationID}`

// Every reservation of that student, read from the live list, so the pop-up shows the new state as soon as the list reloads.
const reviewItems = computed(() => reservations.value.filter((r) =>
    studentKeyOf(r) === reviewKey.value))

function openReview(key: string) {
    reviewKey.value = key
    isReviewOpen.value = true
}

/** Runs one request per reservation, one after the other (each accept changes how many copies are free for the next). */
async function decideMany(list: ReservationRecord[], action: 'accept' | 'reject') {
    reviewBusy.value = true
    const failed: string[] = []
    let done = 0
    for (const r of list) {
        try {
            if (action === 'accept') await circulationService.acceptReservation(r.uuid)
            else await circulationService.rejectReservation(r.uuid)
            done++
            // Show the decision at once; the quiet refresh below brings the held copy and pickup code a moment later.
            setReservationStatus(r.uuid, action === 'accept' ? 'Accepted' : 'Rejected')
        } catch (error: any) {
            failed.push(`${r.book?.title ?? 'A book'}: ${apiErrorMessage(error)}`)
        }
    }
    void quietRefreshReservations()
    reviewBusy.value = false

    const verb = action === 'accept' ? 'accepted' : 'rejected'
    if (done) popupAlert.success(`${done} ${done === 1 ? 'reservation' : 'reservations'} ${verb}`, 'The student has been told.')
    if (failed.length) popupAlert.error(`Could not ${action} ${failed.length === 1 ? 'one reservation' : `${failed.length} reservations`}`, failed.join('\n'))
    // Nothing open left for this student (the finished ones stay listed): the pop-up has done its job.
    if (!reviewItems.value.some((r) => r.status === 'Waiting' || r.status === 'Accepted')) isReviewOpen.value = false
}

// The pop-up asks for the confirmation itself (as a second step inside the same window), so these just do the work.
const acceptMany = (list: ReservationRecord[]) => decideMany(list, 'accept')
const rejectMany = (list: ReservationRecord[]) => decideMany(list, 'reject')

// An accepted reservation can only be cancelled by the librarian: the held copy goes back and the student is told.
async function cancelAccepted(r: ReservationRecord) {
    reviewBusy.value = true
    try {
        await circulationService.cancelReservation(r.uuid)
        setReservationStatus(r.uuid, 'Rejected')
        popupAlert.success('Reservation cancelled', 'The copy is back on the shelf and the student has been told.')
    } catch (error: any) {
        popupAlert.error('Could not cancel the reservation', apiErrorMessage(error))
    } finally {
        reviewBusy.value = false
        void quietRefreshReservations()
    }
    if (!reviewItems.value.some((s) => s.status === 'Waiting' || s.status === 'Accepted')) isReviewOpen.value = false
}

// Checking out a reservation opens the pickup window, so the review pop-up steps aside first.
function checkoutFromReview(reservation: ReservationRecord) {
    isReviewOpen.value = false
    pickupReservation.value = reservation
    pickupCode.value = null
    isPickupOpen.value = true
}

// A slip already read (the Station, or the Pickup code typed in Checkout): the pickup window starts at the book.
async function openPickupFromCode(code: string) {
    isCheckoutOpen.value = false
    // Already open (another slip scanned at the Station): close it first, so it starts over with the new slip.
    if (isPickupOpen.value) {
        isPickupOpen.value = false
        await nextTick()
    }
    pickupReservation.value = null
    pickupCode.value = code
    isPickupOpen.value = true
}

// No slip or ID to show, or the reservation can't be collected: a normal checkout. When it lends this title to the
// student, the server still links their accepted reservation and marks it collected.
function handleCheckoutManually() {
    isPickupOpen.value = false
    isCheckoutOpen.value = true
}

/*
 * The scan station (its own tab) sends this tab here with what it read, and the window opens on this page:
 *   ?return=<loan uuid>  a borrowing receipt or a book's label: the usual Return window, with the late fee
 *   ?finish=<loan uuid>  a book already handed in: the check for damage that finishes the return
 *   ?pickup=<code>       a reservation slip: the pickup window, at the step of scanning the book
 * The station may send another one while this page is open, so it reacts to each change of the address.
 */
async function openFromStation() {
    const one = (v: unknown) => (typeof v === 'string' ? v : '')
    const ret = one(route.query.return)
    const finish = one(route.query.finish)
    const pickup = one(route.query.pickup)
    if (!ret && !finish && !pickup) return

    // Out of the address, so a refresh doesn't open it again (on the address bar alone, as ?new=checkout does above).
    const url = new URL(window.location.href)
    for (const key of ['return', 'finish', 'pickup']) url.searchParams.delete(key)
    window.history.replaceState(window.history.state, '', url)

    // Whatever was open gives way to what was just scanned.
    isCheckoutOpen.value = false
    isFinishOpen.value = false
    isReturnOpen.value = false

    if (pickup) {
        activeTab.value = 'reservations'
        void openPickupFromCode(pickup)
    } else if (ret || finish) {
        await openReturnFor(ret || finish, !!finish)
    }
}

/**
 * The return of one loan, found by a scan (here at the Station, or a receipt / an on-loan book scanned in Checkout).
 * Handed in already (Received): the check for damage that finishes it. Otherwise the usual Return window.
 */
async function openReturnFor(loanUuid: string, handedIn: boolean) {
    isCheckoutOpen.value = false
    activeTab.value = 'loans'
    if (!handedIn) {
        // The window only needs the loan's id: it loads the rest (book, student, fee) itself.
        void handleReturn({ uuid: loanUuid } as LoanRecord)
        return
    }
    finishingLoan.value = { uuid: loanUuid } as LoanRecord
    finishSummaryFromScan.value = null
    try {
        const { preview } = await circulationService.fetchReturnPreview(loanUuid)
        finishSummaryFromScan.value = { bookTitle: preview.book.title, accessionNumber: preview.book.accessionNumber, studentName: preview.student.name }
        isFinishOpen.value = true
    } catch (error) {
        popupAlert.error('Could not open that return', apiErrorMessage(error))
    }
}
onMounted(() => { void openFromStation() })
watch(() => route.fullPath, () => { void openFromStation() })

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
    if (ok) {
        isReportOpen.value = false
        // Verified or rejected, the report leaves the queue: take it off the screen now rather than after the refresh.
        const current = selfReturnResponse.value
        if (current) selfReturnResponse.value = { ...current, reports: current.reports.filter((r) => r.uuid !== report.uuid) }
    }
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

// The checkout window shows its receipt by itself, so the lists behind it update quietly, without the loading overlay.
function handleCheckoutCreated() {
    for (const fn of [refetchLoans, refetchLoanStats, refetchReservations]) void quietRefresherFor(fn)?.()
}
</script>
