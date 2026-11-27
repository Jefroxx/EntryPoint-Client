<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Library</h1>
            <p class="dashboard-heading mt-1 text-crimson">Manage and organize all library books.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" wrap class="mb-5" :tabs="[
            { label: 'Accession Record', short: 'Accession', value: 'accession' },
            { label: 'Book Catalog', short: 'Catalog', value: 'catalog' },
            { label: 'Book Requests', short: 'Requests', value: 'requests' },
            { label: 'Areas & Funds', short: 'Areas', value: 'setup' },
        ]" />

        <!-- Accession Record (a row per book, its copies' accession numbers listed) and Book Catalog
             (a row per copy with the fuller record) share the shelf numbers. -->
        <div v-if="activeTab === 'accession' || activeTab === 'catalog'"
            class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <LibrarianCatalogStatTile label="Book Titles" :value="stats?.totalBooks ?? '—'" icon="i-tabler-book-2"
                tone="accent" />
            <LibrarianCatalogStatTile label="Copies on the Shelf" :value="stats?.availableBooks ?? '—'"
                icon="i-tabler-circle-check" tone="success" />
            <LibrarianCatalogStatTile label="Copies Borrowed" :value="stats?.borrowedBooks ?? '—'" icon="i-tabler-book"
                tone="warning" />
            <LibrarianCatalogStatTile label="Overdue Loans" :value="stats?.overdueBooks ?? '—'"
                icon="i-tabler-alert-circle" tone="danger" />
        </div>

        <template v-if="activeTab === 'accession'">

            <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                <div
                    class="toolbar-search flex h-[42px] min-w-[120px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
                    <Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
                    <input id="library-search" v-model="search" type="text" placeholder="Search book, author, or ISBN" aria-label="Search book, author, or ISBN"
                        class="w-full border-none bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400" />
                </div>

                <LibrarianFilterMenu class="toolbar-full" v-model="bookFilters" :groups="bookFilterGroups" />
                <div class="flex-1"></div>

                <!-- Only while some books haven't been checked against the online catalogues (books from the import). -->
                <ButtonsButton v-if="detailsRemaining > 0" variant="ghost" title="Fill in missing details from the online catalogues" @click="isCheckDetailsOpen = true">
                    <Icon name="i-tabler-world-search" class="h-3.5 w-3.5" />Check Details
                    <span class="rounded-full bg-amber-100 px-1.5 text-[11.5px] font-bold text-amber-800">{{ detailsRemaining.toLocaleString('en-US') }}</span>
                </ButtonsButton>
                <!-- The library's accession record (Excel), brought in many books at a time. -->
                <ButtonsButton variant="ghost" title="Import from Excel" @click="isImportOpen = true">
                    <Icon name="i-tabler-file-import" class="h-3.5 w-3.5" /><span class="sm:max-xl:sr-only">Import</span>
                </ButtonsButton>
                <ButtonsButton variant="primary" @click="openAddBook">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add New Book
                </ButtonsButton>
            </div>

            <LibrarianAccessionRecordTable :books="books?.data ?? []" :loading="booksPending" :filtered="hasBookFilters"
                @view="openBookDetail" @edit="openEditBook" @remove="askRemoveBook"
                @print-labels="(book) => openLabels({ book: book.uuid })" @scan-isbn="(book) => scanningBook = book" />

            <LibrarianPagination v-if="books" :shown="books.data.length" :total="books.total" noun="books"
                :page="books.current_page" :last-page="books.last_page" @change="goToPage" />
        </template>

        <template v-else-if="activeTab === 'catalog'">
            <!-- Copies: one row each, with add / remove buttons. Stock log: when copies were added or removed. -->
            <LibrarianSegmentedTabs v-model="catalogView" wrap class="mb-4" :tabs="[
                { label: 'Copies', value: 'copies' },
                { label: 'Stock Log', value: 'log' },
            ]" />

            <template v-if="catalogView === 'copies'">
                <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                    <div
                        class="toolbar-search flex h-[42px] min-w-[120px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
                        <Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
                        <input id="copy-search" v-model="copySearch" type="text" aria-label="Search title, author, ISBN or accession number"
                            placeholder="Title, author, ISBN or acc. no."
                            class="w-full border-none bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400" />
                    </div>

                    <LibrarianFilterMenu class="toolbar-full" v-model="copyFilters" :groups="copyFilterGroups" />
                    <div class="flex-1"></div>

                    <ButtonsButton variant="ghost" :disabled="exportingCopies" title="Export to Excel" @click="exportCopies">
                        <Icon :name="exportingCopies ? 'i-tabler-loader-2' : 'i-tabler-file-spreadsheet'" class="h-3.5 w-3.5" :class="{ 'animate-spin': exportingCopies }" /><span class="sm:max-xl:sr-only">Export to Excel</span>
                    </ButtonsButton>
                    <!-- Prints the ticked copies; with none ticked, every copy the search and filters match. -->
                    <ButtonsButton variant="ghost" title="Print labels" @click="printCatalogLabels">
                        <Icon name="i-tabler-printer" class="h-3.5 w-3.5" /><span class="sm:max-xl:sr-only">Print labels</span><span v-if="selectedCopies.length">({{ selectedCopies.length }})</span>
                    </ButtonsButton>
                    <ButtonsButton v-if="selectedCopies.length" variant="ghost" title="Clear selection" @click="selectedCopies = []">
                        <Icon name="i-tabler-x" class="hidden h-3.5 w-3.5 sm:max-xl:block" /><span class="sm:max-xl:sr-only">Clear selection</span>
                    </ButtonsButton>
                    <ButtonsButton variant="primary" class="toolbar-full" @click="openAddCopies()">
                        <Icon name="i-tabler-copy-plus" class="h-3.5 w-3.5" />Add Book Copy
                    </ButtonsButton>
                </div>

                <LibrarianBookCatalogTable :copies="copies?.data ?? []" :loading="copiesPending"
                    :filtered="hasCopyFilters" :selected="selectedCopies" @view="(copy) => openBookDetail(copy.book)"
                    @edit-book="(copy) => openEditBook(copy.book)" @edit-copy="openEditCopy" @add-copy="openAddCopies"
                    @remove-copy="openRemoveCopy" @report-penalty="reportLostOrDamaged" @toggle="toggleCopy" @toggle-page="toggleCopyPage"
                    @print-label="(copy) => openLabels({ copies: [copy.uuid] })" />

                <LibrarianPagination v-if="copies" :shown="copies.data.length" :total="copies.total" noun="copies"
                    :page="copies.current_page" :last-page="copies.last_page" @change="goToCopyPage" />
            </template>

            <template v-else>
                <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                    <LibrarianSearchInput id="stock-search" v-model="stockSearch" class="!min-w-[210px]"
                        placeholder="Search title, accession no., reason or librarian" />

                    <LibrarianFilterMenu class="toolbar-full" v-model="stockFilters" :groups="stockFilterGroups" />

                    <div class="flex-1"></div>

                    <ButtonsButton variant="primary" class="toolbar-full" @click="openAddCopies()">
                        <Icon name="i-tabler-copy-plus" class="h-3.5 w-3.5" />Add Book Copy
                    </ButtonsButton>
                </div>

                <LibrarianStockLogTable :logs="stockLogs?.data ?? []" :loading="stockPending"
                    :filtered="hasStockFilters" />

                <LibrarianPagination v-if="stockLogs" :shown="stockLogs.data.length" :total="stockLogs.total" noun="entries"
                    :page="stockLogs.current_page" :last-page="stockLogs.last_page" @change="goToStockPage" />
            </template>
        </template>

        <template v-else-if="activeTab === 'requests'">
            <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                <LibrarianCatalogStatTile label="Total Requests" :value="requestStats.total"
                    icon="i-tabler-clipboard-list" tone="accent" />
                <LibrarianCatalogStatTile label="Pending Requests" :value="requestStats.pending" icon="i-tabler-clock"
                    tone="warning" />
                <LibrarianCatalogStatTile label="Approved Requests" :value="requestStats.approved"
                    icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="Arrived in Library" :value="requestStats.arrived"
                    icon="i-tabler-books" tone="accent" />
                <LibrarianCatalogStatTile class="col-span-2 sm:col-span-1" label="Rejected Requests" :value="requestStats.rejected"
                    icon="i-tabler-circle-x" tone="danger" />
            </div>

            <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                <div
                    class="toolbar-search flex h-[42px] min-w-[120px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
                    <Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
                    <input id="request-search" v-model="requestSearch" type="text" aria-label="Search title, author, or requester"
                        placeholder="Search title, author, or requester"
                        class="w-full border-none bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400" />
                </div>

                <LibrarianFilterMenu class="toolbar-full" v-model="requestFilters" :groups="requestFilterGroups" />

                <div class="flex-1"></div>

            </div>

            <LibrarianBookRequestsTable :suggestions="pagedRequests" :loading="requestsPending"
                @review="openReviewDrawer" @approve="handleApprove" @reject="handleReject" @arrived="handleArrived" />

            <LibrarianPagination v-if="suggestions" :shown="pagedRequests.length" :total="filteredRequests.length" noun="requests"
                :page="requestsPage" :last-page="requestsTotalPages" @change="requestsPage = $event" />
        </template>

        <!-- Areas & Funds: two lists the librarian manages, the areas of the library and the sources of funds. -->
        <LibrarianLibraryListsPanel v-else />


        <LibrarianRequestReviewDrawer :open="isDrawerOpen" :suggestion="activeRequest" @close="isDrawerOpen = false"
            @approve="handleApprove" @reject="handleReject" @arrived="handleArrived" />

        <LibrarianAddBookModal :open="isAddModalOpen" :book="editingBook" :prefill="arrivalPrefill"
            @close="isAddModalOpen = false" @created="handleBookCreated" @updated="handleBookUpdated" @exists="addCopiesToExisting"
            @print-labels="printNewBookLabels" />

        <LibrarianAddCopiesModal :open="isAddCopiesOpen" :book="addCopiesBook" :busy="stockBusy" :added="addedCopies"
            @close="isAddCopiesOpen = false" @submit="saveAddCopies" @print="printNewCopyLabels" />

        <LibrarianRemoveCopyModal :open="isRemoveCopyOpen" :copy="removingCopy" :busy="stockBusy"
            @close="isRemoveCopyOpen = false" @submit="saveRemoveCopy" />

        <!-- After an import, "Check Details" swaps this window for the Check Details one (never one on top of the other). -->
        <LibrarianImportBooksModal :open="isImportOpen" @close="isImportOpen = false" @imported="afterImport"
            @check-details="isImportOpen = false; isCheckDetailsOpen = true" />

        <LibrarianScanBookIsbnModal :open="!!scanningBook" :book="scanningBook" @close="scanningBook = null"
            @saved="refetchDeweyCount(); refetchDetailsCount(); refetchBooks(); refetchCopies()" />

        <LibrarianCheckDetailsModal :open="isCheckDetailsOpen" @close="isCheckDetailsOpen = false"
            @changed="refetchDeweyCount(); refetchBooks(); refetchCopies()" />

        <LibrarianEditCopyModal :open="isEditCopyOpen" :copy="editingCopy" :busy="copyBusy"
            @close="isEditCopyOpen = false" @submit="saveCopy" @report="reportLostOrDamaged" />

        <!-- Barcode labels for the copies chosen (one, a book's, ticked ones, or everything the filters match). -->
        <LibrarianPrintLabelsModal :open="isLabelsOpen" :labels="labelData.labels" :loading="labelsLoading" :error="labelsError"
            :truncated="labelData.truncated" @close="isLabelsOpen = false" @refine="refineLabels" />

        <LibrarianBookDetailDrawer :open="isDetailOpen" :book="detailBook" :loading="detailLoading" :error="detailError"
            @close="isDetailOpen = false" @edit="openEditBook" @remove="askRemoveBook" @view-copy="openCopyFromBook" />

        <!-- A copy pressed in a book's details: that copy's own details (never two panels at once, so the book's panel gives way). -->
        <LibrarianCopyDetailDrawer :copy="viewedCopy" @close="viewedCopy = null" @view-book="backToBookFromCopy" @edit-copy="editViewedCopy" />

        <LibrarianConfirmModal :open="isRequestDecisionOpen" :title="requestDecisionText.title"
            :message="requestDecisionText.message" :confirm-label="requestDecisionText.confirm"
            :danger="requestDecision?.action === 'reject'" :loading="requestDecisionBusy"
            @close="isRequestDecisionOpen = false" @confirm="confirmRequestDecision">
            <!-- A rejection is explained: the student is told why, and the reason stays on the request. -->
            <div v-if="requestDecision?.action === 'reject'" class="mt-4">
                <label for="reject-reason" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Why is it being rejected?<FieldRequired /></label>
                <textarea id="reject-reason" v-model="rejectReason" rows="3" maxlength="500" placeholder="e.g. We already have a newer edition on order"
                    class="w-full resize-none rounded-[10px] border bg-white px-3 py-2.5 text-[14.5px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
                    :class="rejectReasonError ? 'border-red-400 bg-red-50' : 'border-stone-200'" @input="rejectReasonError = ''" />
                <p v-if="rejectReasonError" class="mt-1 text-[12.5px] text-red-500">{{ rejectReasonError }}</p>
            </div>
        </LibrarianConfirmModal>

        <!-- Shows everything tied to the book, page by page, before it goes. -->
        <LibrarianRemoveBookModal :open="isRemoveBookOpen" :book="removingBook" :busy="removingBusy"
            @close="isRemoveBookOpen = false" @confirm="handleRemoveBook" />

        <AlertToast />

    </div>
</template>

<script setup lang="ts">
import { LIBRARY_AREAS, librarianService, type BookAvailabilityFilter, type BookDeweyFilter, type BookDetail, type BookSuggestion, type CatalogBook, type CopyCatalogRow, type CopyLabelsResponse, type CopyStatus, type LibraryArea, type RemoveReason } from '~/services/librarianService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Library' })


const route = useRoute()
const activeTab = ref(['accession', 'catalog', 'requests', 'setup'].includes(String(route.query.tab)) ? String(route.query.tab) : 'accession')

// How many books still haven't been checked against the online catalogues (the Check Details button shows while any).
const isCheckDetailsOpen = ref(false)
// The book whose ISBN is being scanned from its card's ⋮ menu (Scan ISBN); null when that window is closed.
const scanningBook = ref<CatalogBook | null>(null)
const { data: detailsQueue, execute: refetchDetailsCount } =
    useLiveAsyncData('details-check-count', () => librarianService.fetchDetailsQueue({ perPage: 1 }), { lazy: true, pollMs: 60_000 })
const detailsRemaining = computed(() => detailsQueue.value?.remaining ?? 0)
const refetchDeweyCount = () => quietRefresherFor(refetchDetailsCount)?.()

const search = ref('')
const page = ref(1)

const { data: stats, execute: refetchStats } = useLiveAsyncData('library-stats', () => librarianService.fetchLibraryStats(), { lazy: true })

const areaFilter = ref<LibraryArea | ''>('')
const availabilityFilter = ref<BookAvailabilityFilter>('')
const deweyFilter = ref<BookDeweyFilter>('')
const hasBookFilters = computed(() => !!(search.value.trim() || areaFilter.value || availabilityFilter.value || deweyFilter.value))

const { data: books, pending: booksPending, execute: refetchBooks } =
    useLiveAsyncData('library-books', () => librarianService.fetchBooks({
        search: search.value || undefined,
        area: areaFilter.value || undefined,
        availability: availabilityFilter.value || undefined,
        dewey: deweyFilter.value || undefined,
        page: page.value,
        // 12 divides into whole rows of 1, 2, 3 and 4 columns, so a full page never ends on a lone card.
        perPage: 12,
    }), { lazy: true })

let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        page.value = 1
        refetchBooks()
    }, 300)
})

// Dropdowns apply straight away (no typing to wait out), always from the first page.
watch([areaFilter, availabilityFilter, deweyFilter], () => {
    page.value = 1
    refetchBooks()
})

// ---- The Filter button (the same window as on the admin pages) ----
// The window deals in strings with 'all' meaning "no filter"; each tab keeps its own typed refs, so these translate.
const ALL = 'all'
// The areas of the library, in the librarian's order (Areas & Funds tab).
const areaOptions = computed(() => [
    { value: ALL, label: 'All areas' },
    ...Object.entries(LIBRARY_AREAS).map(([value, label]) => ({ value, label: String(label) })),
])

const bookFilterGroups = computed(() => [
    { key: 'area', title: 'Area of the library', options: areaOptions.value },
    { key: 'availability', title: 'Availability', options: [{ value: ALL, label: 'Any availability' }, { value: 'available', label: 'On the shelf' }, { value: 'unavailable', label: 'None on the shelf' }] },
    { key: 'dewey', title: 'Verification', options: [{ value: ALL, label: 'Any verification' }, { value: 'verified', label: 'Verified' }, { value: 'unverified', label: 'Unverified' }] },
])
const bookFilters = computed({
    get: () => ({ area: areaFilter.value || ALL, availability: availabilityFilter.value || ALL, dewey: deweyFilter.value || ALL }),
    set: (v) => {
        areaFilter.value = (v.area === ALL ? '' : v.area) as LibraryArea | ''
        availabilityFilter.value = (v.availability === ALL ? '' : v.availability) as BookAvailabilityFilter
        deweyFilter.value = (v.dewey === ALL ? '' : v.dewey) as BookDeweyFilter
    },
})

function goToPage(next: number) {
    if (next < 1 || (books.value && next > books.value.last_page)) return
    page.value = next
    refetchBooks()
}

// ---- Book Catalog: every copy on its own row ----
const copySearch = ref('')
const copyAreaFilter = ref<LibraryArea | ''>('')
const copyStatusFilter = ref<CopyStatus | ''>('')
const copyPage = ref(1)
const hasCopyFilters = computed(() => !!(copySearch.value.trim() || copyAreaFilter.value || copyStatusFilter.value))

const { data: copies, pending: copiesPending, execute: refetchCopies } =
    useLiveAsyncData('library-copies', () => librarianService.fetchCopies({
        search: copySearch.value.trim() || undefined,
        area: copyAreaFilter.value || undefined,
        status: copyStatusFilter.value || undefined,
        page: copyPage.value,
        perPage: 12,
    }), { lazy: true })

let copySearchTimeout: ReturnType<typeof setTimeout>
watch(copySearch, () => {
    clearTimeout(copySearchTimeout)
    copySearchTimeout = setTimeout(() => {
        copyPage.value = 1
        refetchCopies()
    }, 300)
})

// Exports every copy the current search and filters match, not just the page on screen.
const exportingCopies = ref(false)
async function exportCopies() {
    exportingCopies.value = true
    await perform(() => exportCopiesToExcel({
        search: copySearch.value.trim() || undefined,
        area: copyAreaFilter.value || undefined,
        status: copyStatusFilter.value || undefined,
    }), 'Catalog exported', 'Could not export the catalog')
    exportingCopies.value = false
}

watch([copyAreaFilter, copyStatusFilter], () => {
    copyPage.value = 1
    refetchCopies()
})

// ---- Barcode labels ----
// Copies ticked in the Book Catalog (kept across pages; cleared when the search or filters change, so nothing
// ticked is ever hidden from view).
const selectedCopies = ref<string[]>([])
watch([copySearch, copyAreaFilter, copyStatusFilter], () => { selectedCopies.value = [] })

function toggleCopy(copy: CopyCatalogRow) {
    selectedCopies.value = selectedCopies.value.includes(copy.uuid)
        ? selectedCopies.value.filter((id) => id !== copy.uuid)
        : [...selectedCopies.value, copy.uuid]
}

// The page's checkbox: ticks every copy on the page, or, when they all are already, unticks them.
function toggleCopyPage() {
    const onPage = (copies.value?.data ?? []).map((c) => c.uuid)
    const allTicked = onPage.length > 0 && onPage.every((id) => selectedCopies.value.includes(id))
    selectedCopies.value = allTicked
        ? selectedCopies.value.filter((id) => !onPage.includes(id))
        : [...new Set([...selectedCopies.value, ...onPage])]
}

const isLabelsOpen = ref(false)
const labelsLoading = ref(false)
const labelsError = ref('')
const labelData = ref<CopyLabelsResponse>({ labels: [], total: 0, truncated: false })

type LabelSelection = Parameters<typeof librarianService.fetchCopyLabels>[0]
// What the window was opened for (a copy, a book, the ticked copies, the filters); typed accession numbers narrow it.
let labelBase: LabelSelection = {}

async function loadLabels(selection: LabelSelection) {
    labelsLoading.value = true
    labelsError.value = ''
    labelData.value = { labels: [], total: 0, truncated: false }
    try {
        labelData.value = await librarianService.fetchCopyLabels(selection)
    } catch (error: any) {
        labelsError.value = error?.data?.errors?.accessions?.[0] ?? error?.data?.message ?? "Couldn't gather the labels. Close this and try again."
    } finally {
        labelsLoading.value = false
    }
}

async function openLabels(selection: LabelSelection) {
    labelBase = selection
    isLabelsOpen.value = true
    await loadLabels(selection)
}

// Accession numbers typed in the window: the same labels, narrowed to those numbers (none typed means all of them).
function refineLabels(ranges: { from: number; to: number }[]) {
    return loadLabels({
        ...labelBase,
        ...(ranges.length ? { accessions: ranges } : {}),
    })
}

// From the toolbar: the ticked copies, or, with none ticked, everything the search and filters match.
function printCatalogLabels() {
    if (selectedCopies.value.length) return openLabels({ copies: selectedCopies.value })
    return openLabels({
        search: copySearch.value.trim() || undefined,
        area: copyAreaFilter.value || undefined,
        status: copyStatusFilter.value || undefined,
    })
}

const copyFilterGroups = computed(() => [
    { key: 'area', title: 'Area of the library', options: areaOptions.value },
    { key: 'status', title: 'Status', options: [{ value: ALL, label: 'Any status' }, { value: 'available', label: 'On the shelf' }, { value: 'borrowed', label: 'Borrowed' }, { value: 'damaged', label: 'Damaged' }, { value: 'lost', label: 'Lost' }] },
])
const copyFilters = computed({
    get: () => ({ area: copyAreaFilter.value || ALL, status: copyStatusFilter.value || ALL }),
    set: (v) => {
        copyAreaFilter.value = (v.area === ALL ? '' : v.area) as LibraryArea | ''
        copyStatusFilter.value = (v.status === ALL ? '' : v.status) as CopyStatus | ''
    },
})

function goToCopyPage(next: number) {
    if (next < 1 || (copies.value && next > copies.value.last_page)) return
    copyPage.value = next
    refetchCopies()
}

// One copy's status (Book Catalog pencil). Shelf counts and both tables follow.
const isEditCopyOpen = ref(false)
const editingCopy = ref<CopyCatalogRow | null>(null)
const copyBusy = ref(false)

function openEditCopy(copy: CopyCatalogRow) {
    editingCopy.value = copy
    isEditCopyOpen.value = true
}

// A copy lost or damaged by a student: Circulation's Lost & Damaged tab, with its "Issue a Penalty" window already on this copy.
function reportLostOrDamaged(copy: CopyCatalogRow) {
    isEditCopyOpen.value = false
    return navigateTo({ path: '/librarian/circulation', query: { tab: 'penalties', view: 'lost', issueBook: copy.book.uuid, issueCopy: copy.uuid } })
}

async function saveCopy(payload: Parameters<typeof librarianService.updateCopy>[1]) {
    const copy = editingCopy.value
    if (!copy) return
    copyBusy.value = true
    const ok = await perform(() => librarianService.updateCopy(copy.uuid, payload),
        payload.status === 'retired' ? `Accession no. ${copy.accessionNumber} removed` : `Accession no. ${copy.accessionNumber} updated`,
        'Could not update this copy', [refetchCopies, refetchBooks, refetchStats, refetchStockLogs])
    copyBusy.value = false
    if (ok) isEditCopyOpen.value = false
}

const { perform } = useAction()

// ---- Stock management: add / remove copies, and the stock log ----
const catalogView = ref<'copies' | 'log'>('copies')
const stockSearch = ref('')
const stockAction = ref<'' | 'added' | 'removed' | 'edited'>('')
const stockPage = ref(1)
const hasStockFilters = computed(() => !!(stockSearch.value.trim() || stockAction.value))

const { data: stockLogs, pending: stockPending, execute: refetchStockLogs } =
    useLiveAsyncData('library-stock-logs', () => librarianService.fetchStockLogs({
        search: stockSearch.value.trim() || undefined,
        action: stockAction.value || undefined,
        page: stockPage.value,
        perPage: 12,
    }), { lazy: true })

let stockSearchTimeout: ReturnType<typeof setTimeout>
watch(stockSearch, () => {
    clearTimeout(stockSearchTimeout)
    stockSearchTimeout = setTimeout(() => {
        stockPage.value = 1
        refetchStockLogs()
    }, 300)
})
watch(stockAction, () => {
    stockPage.value = 1
    refetchStockLogs()
})

const stockFilterGroups = [
    { key: 'action', title: 'Action', options: [{ value: ALL, label: 'All actions' }, { value: 'added', label: 'Added only' }, { value: 'removed', label: 'Removed only' }, { value: 'edited', label: 'Edited only' }] },
]
const stockFilters = computed({
    get: () => ({ action: stockAction.value || ALL }),
    set: (v) => { stockAction.value = (v.action === ALL ? '' : v.action) as typeof stockAction.value },
})

function goToStockPage(next: number) {
    if (next < 1 || (stockLogs.value && next > stockLogs.value.last_page)) return
    stockPage.value = next
    refetchStockLogs()
}

const stockBusy = ref(false)
const refreshStock = [refetchCopies, refetchBooks, refetchStats, refetchStockLogs]

// Import from Excel: the window does the work; afterwards every list here shows the new books (and the count of
// Dewey numbers still to check, since books without one wait for it).
const isImportOpen = ref(false)
function afterImport() {
    for (const fn of refreshStock) void quietRefresherFor(fn)?.()
    void refetchDeweyCount()
}

// "Add Book Copy": from a catalog row the book is known; from the header button the librarian searches for it.
const isAddCopiesOpen = ref(false)
const addCopiesBook = ref<{ bookUuid: string; title: string; authors?: string[]; coverImageURL?: string | null; callNumber?: string | null } | null>(null)

// Set once the copies are in: the window stays open on a "copies added" page with a button to print their labels.
const addedCopies = ref<{ title: string; accessions: number[] } | null>(null)

function openAddCopies(copy?: CopyCatalogRow) {
    addCopiesBook.value = copy
        ? { bookUuid: copy.book.uuid, title: copy.book.title, authors: copy.book.authors, coverImageURL: copy.book.coverImageURL, callNumber: copy.book.callNumber }
        : null
    addedCopies.value = null
    isAddCopiesOpen.value = true
}

// An ISBN scanned in Add Book that the library already has: this window gives way to adding a copy of that book.
function addCopiesToExisting(book: { bookUuid: string; title: string; authors: string[]; coverImageURL: string | null; callNumber: string | null; copies: number }) {
    isAddModalOpen.value = false
    addCopiesBook.value = { bookUuid: book.bookUuid, title: book.title, authors: book.authors, coverImageURL: book.coverImageURL, callNumber: book.callNumber }
    addedCopies.value = null
    isAddCopiesOpen.value = true
    alert.success('Already in the catalog', `"${book.title}" has ${book.copies} ${book.copies === 1 ? 'copy' : 'copies'}. Add another copy of it here.`)
}

async function saveAddCopies(payload: { bookUuid: string; title: string; quantity: number; sourceOfFund: string; cost: number; remarks: string | undefined }) {
    stockBusy.value = true
    let accessions: number[] = []
    const ok = await perform(async () => {
        const result = await librarianService.addCopies(payload.bookUuid, { quantity: payload.quantity, sourceOfFund: payload.sourceOfFund, cost: payload.cost, remarks: payload.remarks })
        accessions = result.copies.map((c) => c.accessionNumber)
        return result
    }, payload.quantity === 1 ? 'Copy added' : `${payload.quantity} copies added`, 'Could not add copies', refreshStock)
    stockBusy.value = false
    if (ok) addedCopies.value = { title: payload.title, accessions }
}

// "Print labels" on the copies-added page: this window gives way to the print window (never two at once).
function printNewCopyLabels(accessions: number[]) {
    isAddCopiesOpen.value = false
    return openLabels({ accessions: toRanges(accessions) })
}

const isRemoveCopyOpen = ref(false)
const removingCopy = ref<CopyCatalogRow | null>(null)

function openRemoveCopy(copy: CopyCatalogRow) {
    removingCopy.value = copy
    isRemoveCopyOpen.value = true
}

async function saveRemoveCopy(payload: { reason: RemoveReason; note: string | undefined }) {
    const copy = removingCopy.value
    if (!copy) return
    stockBusy.value = true
    const ok = await perform(() => librarianService.removeCopy(copy.uuid, payload),
        `Accession no. ${copy.accessionNumber} removed`, 'Could not remove this copy', refreshStock)
    stockBusy.value = false
    if (ok) isRemoveCopyOpen.value = false
}

// ---- Add book ----
const isAddModalOpen = ref(false)
// "Print labels" on the book-added page: the Add Book window gives way to the print window (never two at once).
function printNewBookLabels(bookUuid: string) {
    isAddModalOpen.value = false
    return openLabels({ book: bookUuid })
}

async function handleBookCreated() {
    await Promise.all([refetchBooks(), refetchCopies(), refetchStats(), refetchStockLogs()])

    // The book that was missing is in the catalog now: the request it came from is marked as arrived (the student is told).
    const waiting = pendingArrival
    if (waiting) {
        pendingArrival = null
        await perform(() => librarianService.markBookSuggestionArrived(waiting.uuid), 'Marked as arrived', 'The book was added, but the request could not be marked as arrived', [refetchRequests])
    }
}

// ---- View / edit / remove a book ----
// The table only carries what its columns show; details and the edit form need the full record.
const detailBook = ref<BookDetail | null>(null)
const isDetailOpen = ref(false)
const detailLoading = ref(false)
const detailError = ref('')

async function loadBookDetail(bookUuid: string): Promise<BookDetail | null> {
    detailLoading.value = true
    detailError.value = ''
    try {
        const { book } = await librarianService.fetchBook(bookUuid)
        detailBook.value = book
        return book
    } catch (error) {
        detailError.value = apiErrorMessage(error, 'Please try again.')
        return null
    } finally {
        detailLoading.value = false
    }
}

async function openBookDetail(book: Pick<CatalogBook, 'uuid'>) {
    if (detailBook.value?.uuid !== book.uuid) detailBook.value = null
    isDetailOpen.value = true
    await loadBookDetail(book.uuid)
}

// ---- A copy pressed in a book's details ----
const viewedCopy = ref<CopyCatalogRow | null>(null)

/** The copy as the Book Catalog would list it, built from the book already on screen (its own fund and remarks come next). */
function copyRowFromBook(book: BookDetail, copy: BookDetail['copies'][number]): CopyCatalogRow {
    return {
        copyID: copy.copyID, uuid: copy.uuid, accessionNumber: copy.accessionNumber, barcodeValue: copy.barcodeValue || null,
        status: copy.status as CopyStatus, cost: copy.cost ?? null,
        book: {
            bookID: book.bookID, uuid: book.uuid, title: book.title, isbn: book.isbn, callNumber: book.callNumber,
            areaOfLibrary: book.areaOfLibrary, publicationYear: book.publicationYear, volume: book.volume, edition: book.edition,
            pageCount: book.pageCount, publisher: book.publisher, sourceOfFund: book.sourceOfFund, cost: book.cost, remarks: book.remarks,
            deweyStatus: book.deweyStatus, shelfLocation: book.shelfLocation, coverImageURL: book.coverImageURL,
            subject: book.subject, authors: book.authors.map((a) => a.name),
        },
    }
}


async function openCopyFromBook(copy: BookDetail['copies'][number]) {
    const book = detailBook.value
    if (!book) return
    // The copy's own record (its fund, cost and remarks) comes from the catalog list; the book's details stand in if that fails.
    let row = copyRowFromBook(book, copy)
    try {
        const page = await librarianService.fetchCopies({ search: book.title, perPage: 100 })
        row = page.data.find((c) => c.uuid === copy.uuid) ?? row
    } catch {
        // keep the one built from the book
    }
    viewedCopy.value = row
    isDetailOpen.value = false
}

// From the copy back to its book.
function backToBookFromCopy(copy: CopyCatalogRow) {
    viewedCopy.value = null
    void openBookDetail({ uuid: copy.book.uuid })
}

function editViewedCopy(copy: CopyCatalogRow) {
    viewedCopy.value = null
    openEditCopy(copy)
}

const editingBook = ref<BookDetail | null>(null)
const alert = useAlert()

function openAddBook() {
    editingBook.value = null
    isAddModalOpen.value = true
}

// Dashboard quick action: /librarian/library?new=book opens the Add Book form straight away.
// The flag is dropped from the address so a refresh doesn't reopen it.
onMounted(() => {
    if (route.query.new !== 'book') return
    openAddBook()
    // Done on the address bar alone, not through the router: a router navigation here interrupts the page change
    // that is still finishing (the loading cover stayed up), and a query-only one rewrote the path to /Librarian/….
    const url = new URL(window.location.href)
    url.searchParams.delete('new')
    window.history.replaceState(window.history.state, '', url)
})

/** From the table (a list row, so fetch the full record) or from the details drawer (already full). */
async function openEditBook(book: Pick<CatalogBook, 'uuid'> | BookDetail) {
    const full = 'loans' in book ? book : await loadBookDetail(book.uuid)
    if (!full) {
        alert.error('Could not open this book', detailError.value)
        return
    }
    editingBook.value = full
    isDetailOpen.value = false
    isAddModalOpen.value = true
}

async function handleBookUpdated() {
    const bookUuid = editingBook.value?.uuid
    await Promise.all([refetchBooks(), refetchCopies(), refetchStats(), refetchStockLogs(), bookUuid ? loadBookDetail(bookUuid) : null])
}

const removingBook = ref<{ uuid: string; title: string } | null>(null)
const isRemoveBookOpen = ref(false)
const removingBusy = ref(false)

function askRemoveBook(book: CatalogBook | BookDetail) {
    // Asked from the book's drawer: the drawer closes first, so the removal window never opens on top of it.
    isDetailOpen.value = false
    removingBook.value = { uuid: book.uuid, title: book.title }
    isRemoveBookOpen.value = true
}

async function handleRemoveBook() {
    if (!removingBook.value) return
    const { uuid } = removingBook.value
    removingBusy.value = true
    const ok = await perform(() => librarianService.deleteBook(uuid), 'Book removed', 'Could not remove book',
        [refetchBooks, refetchCopies, refetchStats, refetchStockLogs])
    removingBusy.value = false
    if (ok) {
        isRemoveBookOpen.value = false
        if (detailBook.value?.uuid === uuid) isDetailOpen.value = false
    }
}

// ---- Book Requests (backed by the BookSuggestion feature) ----
const { data: suggestionsResponse, pending: requestsPending, execute: refetchRequests } =
    useLiveAsyncData('book-suggestions', () => librarianService.fetchBookSuggestions(), { lazy: true })

const suggestions = computed(() => suggestionsResponse.value?.suggestions ?? [])

const requestSearch = ref('')
const requestStatusFilter = ref<'' | 'Pending' | 'Approved' | 'Arrived' | 'Rejected'>('')
const requestPeriodFilter = ref<'' | '7' | '30' | 'older'>('')
const requestProgramFilter = ref('')
// The programs of the students who have asked for a book (a list that follows the requests themselves).
const requestProgramOptions = computed(() => {
    const programs = [...new Set(suggestions.value.map((s) => s.student?.academicProgram).filter((p): p is string => !!p))].sort()
    return [{ value: ALL, label: 'All programs' }, ...programs.map((p) => ({ value: p, label: p }))]
})
const requestFilterGroups = computed(() => [
    { key: 'status', title: 'Status', options: [{ value: ALL, label: 'All status' }, { value: 'Pending', label: 'Pending' }, { value: 'Approved', label: 'Approved' }, { value: 'Arrived', label: 'Arrived' }, { value: 'Rejected', label: 'Rejected' }] },
    { key: 'period', title: 'Submitted', options: [{ value: ALL, label: 'Any time' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: 'older', label: 'Older than 30 days' }] },
    { key: 'program', title: 'Program', options: requestProgramOptions.value },
])
const requestFilters = computed({
    get: () => ({ status: requestStatusFilter.value || ALL, period: requestPeriodFilter.value || ALL, program: requestProgramFilter.value || ALL }),
    set: (v) => {
        requestStatusFilter.value = (v.status === ALL ? '' : v.status) as typeof requestStatusFilter.value
        requestPeriodFilter.value = (v.period === ALL ? '' : v.period) as typeof requestPeriodFilter.value
        requestProgramFilter.value = v.program === ALL ? '' : v.program
    },
})

const requestStats = computed(() => ({
    total: suggestions.value.length,
    pending: suggestions.value.filter((s) => s.status === 'Pending').length,
    approved: suggestions.value.filter((s) => s.status === 'Approved').length,
    arrived: suggestions.value.filter((s) => s.status === 'Arrived').length,
    rejected: suggestions.value.filter((s) => s.status === 'Rejected').length,
}))

const filteredRequests = computed(() => {
    const term = requestSearch.value.trim().toLowerCase()
    return suggestions.value.filter((s) => {
        if (requestStatusFilter.value && s.status !== requestStatusFilter.value) return false
        if (requestProgramFilter.value && s.student?.academicProgram !== requestProgramFilter.value) return false
        if (requestPeriodFilter.value) {
            const days = (Date.now() - new Date(s.submittedAt).getTime()) / 86_400_000
            if (requestPeriodFilter.value === 'older' ? days <= 30 : days > Number(requestPeriodFilter.value)) return false
        }
        if (!term) return true
        const requester = s.student?.user ? `${s.student.user.firstName} ${s.student.user.lastName}` : ''
        return (
            s.title.toLowerCase().includes(term) ||
            (s.author ?? '').toLowerCase().includes(term) ||
            requester.toLowerCase().includes(term)
        )
    })
})

// 12 fills whole rows in the card grids' 1, 2 and 3 columns.
const REQUESTS_PER_PAGE = 12
const requestsPage = ref(1)

const requestsTotalPages = computed(() => Math.max(1, Math.ceil(filteredRequests.value.length / REQUESTS_PER_PAGE)))

const pagedRequests = computed(() => {
    const start = (requestsPage.value - 1) * REQUESTS_PER_PAGE
    return filteredRequests.value.slice(start, start + REQUESTS_PER_PAGE)
})

watch([requestSearch, requestStatusFilter, requestPeriodFilter, requestProgramFilter], () => {
    requestsPage.value = 1
})

const isDrawerOpen = ref(false)
const activeRequest = ref<BookSuggestion | null>(null)

function openReviewDrawer(suggestion: BookSuggestion) {
    activeRequest.value = suggestion
    isDrawerOpen.value = true
}

// Approving or rejecting a book request asks first: the student is told either way, and an approved request also
// counts toward their achievements, so neither can be taken back.
const requestDecision = ref<{ suggestion: BookSuggestion; action: 'approve' | 'reject' | 'arrived'; found?: { title: string; copies: number } } | null>(null)
const rejectReason = ref('')
const rejectReasonError = ref('')
const isRequestDecisionOpen = ref(false)
const requestDecisionBusy = ref(false)

const requestDecisionText = computed(() => {
    const d = requestDecision.value
    if (!d) return { title: '', message: '', confirm: '' }
    const requester = d.suggestion.student?.user ? `${d.suggestion.student.user.firstName} ${d.suggestion.student.user.lastName}` : 'the student'
    if (d.action === 'arrived') {
        return {
            title: 'Mark as arrived?',
            message: `${d.found ? `“${d.found.title}” is in the catalog (${d.found.copies} ${d.found.copies === 1 ? 'copy' : 'copies'}). ` : ''}Has it arrived in the library? ${requester} is told it is here and can be borrowed.`,
            confirm: 'Yes, it has arrived',
        }
    }
    return d.action === 'approve'
        ? {
            title: 'Approve this request?',
            message: `Approve ${requester}'s request for “${d.suggestion.title}”? They are told it will be added to the collection, and it counts toward their achievements.`,
            confirm: 'Yes, approve',
        }
        : {
            title: 'Reject this request?',
            message: `Reject ${requester}'s request for “${d.suggestion.title}”? They are told it was not approved. This can't be undone.`,
            confirm: 'Yes, reject',
        }
})

function handleApprove(suggestion: BookSuggestion) {
    requestDecision.value = { suggestion, action: 'approve' }
    isRequestDecisionOpen.value = true
}

// Marking a request as arrived first looks for the book in the catalog. Found: the usual question. Not there yet: the Add Book
// window opens with its title and author filled in, and the request is marked as arrived once the book is added.
const arrivalPrefill = ref<{ title: string; author: string | null } | null>(null)
let pendingArrival: BookSuggestion | null = null
const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

async function handleArrived(suggestion: BookSuggestion) {
    let found: CatalogBook | undefined
    try {
        const result = await librarianService.fetchBooks({ search: suggestion.title, perPage: 10 })
        const want = normTitle(suggestion.title)
        found = result.data.find((b) => normTitle(b.title) === want)
            ?? result.data.find((b) => normTitle(b.title).includes(want) || want.includes(normTitle(b.title)))
    } catch {
        // Could not look: fall through to asking for the book to be added, which never marks it by mistake.
    }

    if (found) {
        requestDecision.value = { suggestion, action: 'arrived', found: { title: found.title, copies: found.copies?.length ?? 0 } }
        isRequestDecisionOpen.value = true
        return
    }

    isDrawerOpen.value = false
    pendingArrival = suggestion
    arrivalPrefill.value = { title: suggestion.title, author: suggestion.author }
    editingBook.value = null
    isAddModalOpen.value = true
}

// Closing the Add Book window ends the wait: the request stays approved.
watch(isAddModalOpen, (open) => { if (!open) { pendingArrival = null; arrivalPrefill.value = null } })

function handleReject(suggestion: BookSuggestion) {
    rejectReason.value = ''
    rejectReasonError.value = ''
    requestDecision.value = { suggestion, action: 'reject' }
    isRequestDecisionOpen.value = true
}

async function confirmRequestDecision() {
    const decision = requestDecision.value
    if (!decision) return
    const { suggestion, action } = decision
    if (action === 'reject' && rejectReason.value.trim().length < 3) {
        rejectReasonError.value = 'Say why, so the student knows.'
        return
    }
    requestDecisionBusy.value = true
    const ok = action === 'approve'
        ? await perform(() => librarianService.approveBookSuggestion(suggestion.uuid), 'Request approved', 'Could not approve this request', [refetchRequests])
        : action === 'arrived'
        ? await perform(() => librarianService.markBookSuggestionArrived(suggestion.uuid), 'Marked as arrived', 'Could not mark this request as arrived', [refetchRequests])
        : await perform(() => librarianService.rejectBookSuggestion(suggestion.uuid, rejectReason.value.trim()), 'Request rejected', 'Could not reject this request', [refetchRequests])
    requestDecisionBusy.value = false
    if (ok) {
        isRequestDecisionOpen.value = false
        isDrawerOpen.value = false
        // The row shows its new status at once; the quiet refresh perform() started fills in the rest.
        const status = action === 'approve' ? 'Approved' : action === 'arrived' ? 'Arrived' : 'Rejected'
        const current = suggestionsResponse.value
        if (current) suggestionsResponse.value = { ...current, suggestions: current.suggestions.map((s) => (s.uuid === suggestion.uuid ? { ...s, status } : s)) }
    }
}

// ---- Leaving a tab clears its search and filters ----
// Nothing typed or picked should be waiting, forgotten, when you come back (and hiding a list that "isn't all there").
// It is the tab being LEFT that is cleared, so a filter set on the way in survives.
function clearTab(tab: string) {
    if (tab === 'accession') {
        search.value = ''
        areaFilter.value = ''
        availabilityFilter.value = ''
        deweyFilter.value = ''
    } else if (tab === 'catalog') {
        clearCatalogView('copies')
        clearCatalogView('log')
        catalogView.value = 'copies'
    } else if (tab === 'requests') {
        requestSearch.value = ''
        requestStatusFilter.value = ''
        requestPeriodFilter.value = ''
        requestProgramFilter.value = ''
    }
}

function clearCatalogView(view: string) {
    if (view === 'copies') {
        copySearch.value = ''
        copyAreaFilter.value = ''
        copyStatusFilter.value = ''
        selectedCopies.value = []
    } else {
        stockSearch.value = ''
        stockAction.value = ''
    }
}

watch(activeTab, (_now, before) => clearTab(before))
// Copies <-> Stock Log inside the Book Catalog: the same, for the one you leave.
watch(catalogView, (_now, before) => clearCatalogView(before))
</script>
