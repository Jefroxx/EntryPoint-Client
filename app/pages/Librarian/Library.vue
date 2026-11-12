<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Library</h1>
            <p class="dashboard-heading mt-1 text-crimson">Manage and organize all library books.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" class="mb-5" :tabs="[
            { label: 'Accession Record', short: 'Accession', value: 'accession' },
            { label: 'Book Catalog', short: 'Catalog', value: 'catalog' },
            { label: 'Book Requests', short: 'Requests', value: 'requests' },
            { label: 'Categories / Genres', short: 'Categories', value: 'categories' },
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

            <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
                <div
                    class="flex h-[42px] min-w-[200px] max-w-[320px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
                    <Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
                    <input id="library-search" v-model="search" type="text" placeholder="Search book, author, or ISBN"
                        class="w-full border-none bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400" />
                </div>

                <select v-model="subjectFilter" aria-label="Filter by category"
                    class="h-[42px] rounded-xl border bg-white px-3 text-[14px] outline-none transition-colors hover:bg-stone-50 focus:ring-2 focus:ring-accent-200"
                    :class="subjectFilter ? 'border-accent-300 text-stone-800' : 'border-stone-200 text-stone-500'">
                    <option value="">All Categories</option>
                    <option v-for="s in subjects" :key="s.subjectID" :value="s.subjectID">{{ s.name }}</option>
                </select>
                <select v-model="availabilityFilter" aria-label="Filter by availability"
                    class="h-[42px] rounded-xl border bg-white px-3 text-[14px] outline-none transition-colors hover:bg-stone-50 focus:ring-2 focus:ring-accent-200"
                    :class="availabilityFilter ? 'border-accent-300 text-stone-800' : 'border-stone-200 text-stone-500'">
                    <option value="">All Availability</option>
                    <option value="available">On the shelf</option>
                    <option value="unavailable">None on the shelf</option>
                </select>
                <select v-model="deweyFilter" aria-label="Filter by Dewey number status"
                    class="h-[42px] rounded-xl border bg-white px-3 text-[14px] outline-none transition-colors hover:bg-stone-50 focus:ring-2 focus:ring-accent-200"
                    :class="deweyFilter ? 'border-accent-300 text-stone-800' : 'border-stone-200 text-stone-500'">
                    <option value="">All Verification</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                </select>
                <div class="flex-1"></div>

                <LibrarianResetFiltersButton @click="clearBookFilters" />
                <!-- Only while some books still lack a confirmed number: one go at looking them all up. -->
                <ButtonsButton v-if="deweyUnchecked > 0" variant="ghost" @click="isFindDeweyOpen = true">
                    <Icon name="i-tabler-checks" class="h-3.5 w-3.5" />Accept Dewey numbers
                    <span class="rounded-full bg-amber-100 px-1.5 text-[11.5px] font-bold text-amber-800">{{ deweyUnchecked }}</span>
                </ButtonsButton>
                <ButtonsButton variant="primary" @click="openAddBook">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add New Book
                </ButtonsButton>
            </div>

            <LibrarianAccessionRecordTable :books="books?.data ?? []" :loading="booksPending" :filtered="hasBookFilters"
                @view="openBookDetail" @edit="openEditBook" @remove="askRemoveBook"
                @print-labels="(book) => openLabels({ book: book.uuid })" />

            <LibrarianPagination v-if="books" :shown="books.data.length" :total="books.total" noun="books"
                :page="books.current_page" :last-page="books.last_page" @change="goToPage" />
        </template>

        <template v-else-if="activeTab === 'catalog'">
            <!-- Copies: one row each, with add / remove buttons. Stock log: when copies were added or removed. -->
            <LibrarianSegmentedTabs v-model="catalogView" class="mb-4" :tabs="[
                { label: 'Copies', value: 'copies' },
                { label: 'Stock Log', value: 'log' },
            ]" />

            <template v-if="catalogView === 'copies'">
                <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
                    <div
                        class="flex h-[42px] min-w-[200px] max-w-[320px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
                        <Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
                        <input id="copy-search" v-model="copySearch" type="text"
                            placeholder="Title, author, ISBN or acc. no."
                            class="w-full border-none bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400" />
                    </div>

                    <select v-model="copySubjectFilter" aria-label="Filter by category"
                        class="h-[42px] rounded-xl border bg-white px-3 text-[14px] outline-none transition-colors hover:bg-stone-50 focus:ring-2 focus:ring-accent-200"
                        :class="copySubjectFilter ? 'border-accent-300 text-stone-800' : 'border-stone-200 text-stone-500'">
                        <option value="">All Categories</option>
                        <option v-for="s in subjects" :key="s.subjectID" :value="s.subjectID">{{ s.name }}</option>
                    </select>
                    <select v-model="copyAreaFilter" aria-label="Filter by area of the library"
                        class="h-[42px] rounded-xl border bg-white px-3 text-[14px] outline-none transition-colors hover:bg-stone-50 focus:ring-2 focus:ring-accent-200"
                        :class="copyAreaFilter ? 'border-accent-300 text-stone-800' : 'border-stone-200 text-stone-500'">
                        <option value="">All Areas</option>
                        <option v-for="(label, area) in LIBRARY_AREAS" :key="area" :value="area">{{ label }}</option>
                    </select>
                    <select v-model="copyStatusFilter" aria-label="Filter by status"
                        class="h-[42px] rounded-xl border bg-white px-3 text-[14px] outline-none transition-colors hover:bg-stone-50 focus:ring-2 focus:ring-accent-200"
                        :class="copyStatusFilter ? 'border-accent-300 text-stone-800' : 'border-stone-200 text-stone-500'">
                        <option value="">All Status</option>
                        <option value="available">On the shelf</option>
                        <option value="borrowed">Borrowed</option>
                        <option value="damaged">Damaged</option>
                        <option value="lost">Lost</option>
                    </select>
                    <div class="flex-1"></div>

                    <LibrarianResetFiltersButton @click="clearCopyFilters" />
                    <ButtonsButton variant="ghost" :disabled="exportingCopies" @click="exportCopies">
                        <Icon :name="exportingCopies ? 'i-tabler-loader-2' : 'i-tabler-file-spreadsheet'" class="h-3.5 w-3.5" :class="{ 'animate-spin': exportingCopies }" />Export to Excel
                    </ButtonsButton>
                    <!-- Prints the ticked copies; with none ticked, every copy the search and filters match. -->
                    <ButtonsButton variant="ghost" @click="printCatalogLabels">
                        <Icon name="i-tabler-printer" class="h-3.5 w-3.5" />{{ selectedCopies.length ? `Print labels (${selectedCopies.length})` : 'Print labels' }}
                    </ButtonsButton>
                    <ButtonsButton v-if="selectedCopies.length" variant="ghost" @click="selectedCopies = []">Clear selection</ButtonsButton>
                    <ButtonsButton variant="primary" @click="openAddCopies()">
                        <Icon name="i-tabler-copy-plus" class="h-3.5 w-3.5" />Add Book Copy
                    </ButtonsButton>
                </div>

                <LibrarianBookCatalogTable :copies="copies?.data ?? []" :loading="copiesPending"
                    :filtered="hasCopyFilters" :selected="selectedCopies" @view="(copy) => openBookDetail(copy.book)"
                    @edit-book="(copy) => openEditBook(copy.book)" @edit-copy="openEditCopy" @add-copy="openAddCopies"
                    @remove-copy="openRemoveCopy" @toggle="toggleCopy" @toggle-page="toggleCopyPage"
                    @print-label="(copy) => openLabels({ copies: [copy.uuid] })" />

                <LibrarianPagination v-if="copies" :shown="copies.data.length" :total="copies.total" noun="copies"
                    :page="copies.current_page" :last-page="copies.last_page" @change="goToCopyPage" />
            </template>

            <template v-else>
                <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
                    <LibrarianSearchInput id="stock-search" v-model="stockSearch"
                        placeholder="Search title, accession no., reason or librarian" />

                    <select v-model="stockAction" aria-label="Filter by action"
                        class="h-[42px] rounded-xl border bg-white px-3 text-[14px] outline-none transition-colors hover:bg-stone-50 focus:ring-2 focus:ring-accent-200"
                        :class="stockAction ? 'border-accent-300 text-stone-800' : 'border-stone-200 text-stone-500'">
                        <option value="">All actions</option>
                        <option value="added">Added only</option>
                        <option value="removed">Removed only</option>
                        <option value="edited">Edited only</option>
                    </select>

                    <div class="flex-1"></div>

                    <LibrarianResetFiltersButton @click="stockSearch = ''; stockAction = ''" />
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
            <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <LibrarianCatalogStatTile label="Total Requests" :value="requestStats.total"
                    icon="i-tabler-clipboard-list" tone="accent" />
                <LibrarianCatalogStatTile label="Pending Requests" :value="requestStats.pending" icon="i-tabler-clock"
                    tone="warning" />
                <LibrarianCatalogStatTile label="Approved Requests" :value="requestStats.approved"
                    icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="Rejected Requests" :value="requestStats.rejected"
                    icon="i-tabler-circle-x" tone="danger" />
            </div>

            <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
                <div
                    class="flex h-[42px] min-w-[200px] max-w-[320px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
                    <Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
                    <input id="request-search" v-model="requestSearch" type="text"
                        placeholder="Search title, author, or requester"
                        class="w-full border-none bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400" />
                </div>

                <select v-model="requestStatusFilter"
                    class="flex h-[42px] items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>

                <div class="flex-1"></div>

                <LibrarianResetFiltersButton @click="requestSearch = ''; requestStatusFilter = ''" />
            </div>

            <LibrarianBookRequestsTable :suggestions="pagedRequests" :loading="requestsPending"
                @review="openReviewDrawer" @approve="handleApprove" @reject="handleReject" />

            <LibrarianPagination v-if="suggestions" :shown="pagedRequests.length" :total="filteredRequests.length" noun="requests"
                :page="requestsPage" :last-page="requestsTotalPages" @change="requestsPage = $event" />
        </template>

        <template v-else>
            <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <LibrarianCatalogStatTile label="Categories" :value="subjects.length" icon="i-tabler-tags"
                    tone="accent" />
                <LibrarianCatalogStatTile label="With a Dewey code" :value="`${classifiedCount} of ${subjects.length}`"
                    icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile class="col-span-2 sm:col-span-1" label="Largest category"
                    :value="largestSubject?.name ?? '—'" icon="i-tabler-book-2" tone="warning" />
            </div>

            <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="category-search" v-model="categorySearch" placeholder="Search categories" />
                <div class="flex-1"></div>
                <ButtonsButton variant="primary" class="toolbar-full" @click="openCategoryForm(null)">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add Category
                </ButtonsButton>
            </div>

            <LibrarianCategoriesTable :subjects="filteredSubjects" :loading="subjectsPending" @edit="openCategoryForm"
                @delete="askDeleteCategory" @view-book="openBookDetail" @show-books="showCategoryBooks" />

            <div class="mt-3 flex items-center justify-between text-[13.5px] text-stone-500">
                <span>Showing {{ filteredSubjects.length }} of {{ subjects.length }} categories</span>
                <span>{{ totalBooks }} books total</span>
            </div>
        </template>


        <LibrarianRequestReviewDrawer :open="isDrawerOpen" :suggestion="activeRequest" @close="isDrawerOpen = false"
            @approve="handleApprove" @reject="handleReject" />

        <LibrarianAddBookModal :open="isAddModalOpen" :categories="bookCategories" :book="editingBook"
            @close="isAddModalOpen = false" @created="handleBookCreated" @updated="handleBookUpdated" @exists="addCopiesToExisting"
            @print-labels="printNewBookLabels" />

        <LibrarianAddCopiesModal :open="isAddCopiesOpen" :book="addCopiesBook" :busy="stockBusy" :added="addedCopies"
            @close="isAddCopiesOpen = false" @submit="saveAddCopies" @print="printNewCopyLabels" />

        <LibrarianRemoveCopyModal :open="isRemoveCopyOpen" :copy="removingCopy" :busy="stockBusy"
            @close="isRemoveCopyOpen = false" @submit="saveRemoveCopy" />

        <LibrarianFindDeweyModal :open="isFindDeweyOpen" @close="isFindDeweyOpen = false"
            @changed="refetchDeweyCount(); refetchBooks(); refetchCopies()" />

        <LibrarianEditCopyModal :open="isEditCopyOpen" :copy="editingCopy" :busy="copyBusy"
            @close="isEditCopyOpen = false" @submit="saveCopy" />

        <!-- Barcode labels for the copies chosen (one, a book's, ticked ones, or everything the filters match). -->
        <LibrarianPrintLabelsModal :open="isLabelsOpen" :labels="labelData.labels" :loading="labelsLoading" :error="labelsError"
            :truncated="labelData.truncated" @close="isLabelsOpen = false" @refine="refineLabels" />

        <LibrarianBookDetailDrawer :open="isDetailOpen" :book="detailBook" :loading="detailLoading" :error="detailError"
            @close="isDetailOpen = false" @edit="openEditBook" @remove="askRemoveBook" />

        <LibrarianConfirmModal :open="isRequestDecisionOpen" :title="requestDecisionText.title"
            :message="requestDecisionText.message" :confirm-label="requestDecisionText.confirm"
            :danger="requestDecision?.action === 'reject'" :loading="requestDecisionBusy"
            @close="isRequestDecisionOpen = false" @confirm="confirmRequestDecision" />

        <!-- Shows everything tied to the book, page by page, before it goes. -->
        <LibrarianRemoveBookModal :open="isRemoveBookOpen" :book="removingBook" :busy="removingBusy"
            @close="isRemoveBookOpen = false" @confirm="handleRemoveBook" />

        <LibrarianCategoryFormModal :open="isCategoryOpen" :subject="editingSubject" :busy="categoryBusy"
            @close="isCategoryOpen = false" @submit="saveCategory" />
        <LibrarianConfirmModal :open="isDeleteCategoryOpen" title="Delete Category?"
            :message="`“${deleteSubject?.name ?? 'This category'}” will be removed. No books use it.`"
            confirm-label="Delete" :loading="categoryBusy" @close="isDeleteCategoryOpen = false"
            @confirm="handleDeleteCategory" />

        <AlertToast />

    </div>
</template>

<script setup lang="ts">
import { LIBRARY_AREAS, librarianService, type BookAvailabilityFilter, type BookDeweyFilter, type BookDetail, type BookSuggestion, type CatalogBook, type CopyCatalogRow, type CopyLabelsResponse, type CopyStatus, type LibraryArea, type RemoveReason } from '~/services/librarianService'
import { subjectService, type SubjectRecord } from '~/services/subjectService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Library' })


const route = useRoute()
const activeTab = ref(['accession', 'catalog', 'requests', 'categories'].includes(String(route.query.tab)) ? String(route.query.tab) : 'accession')

// How many books still have no confirmed Dewey number (the button that looks them all up shows while any do).
const isFindDeweyOpen = ref(false)
const { data: deweyCount, execute: refetchDeweyCount } =
    useLiveAsyncData('dewey-review-count', () => librarianService.fetchDeweyReview({ perPage: 1 }), { lazy: true })
const deweyUnchecked = computed(() => deweyCount.value?.needsReview ?? 0)

const search = ref('')
const page = ref(1)

const { data: stats, execute: refetchStats } = useLiveAsyncData('library-stats', () => librarianService.fetchLibraryStats(), { lazy: true })

const subjectFilter = ref<number | ''>('')
const availabilityFilter = ref<BookAvailabilityFilter>('')
const deweyFilter = ref<BookDeweyFilter>('')
const hasBookFilters = computed(() => !!(search.value.trim() || subjectFilter.value || availabilityFilter.value || deweyFilter.value))

const { data: books, pending: booksPending, execute: refetchBooks } =
    useLiveAsyncData('library-books', () => librarianService.fetchBooks({
        search: search.value || undefined,
        subjectID: subjectFilter.value || undefined,
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
watch([subjectFilter, availabilityFilter, deweyFilter], () => {
    page.value = 1
    refetchBooks()
})

function clearBookFilters() {
    search.value = ''
    subjectFilter.value = ''
    availabilityFilter.value = ''
    deweyFilter.value = ''
}

function goToPage(next: number) {
    if (next < 1 || (books.value && next > books.value.last_page)) return
    page.value = next
    refetchBooks()
}

// ---- Book Catalog: every copy on its own row ----
const copySearch = ref('')
const copySubjectFilter = ref<number | ''>('')
const copyAreaFilter = ref<LibraryArea | ''>('')
const copyStatusFilter = ref<CopyStatus | ''>('')
const copyPage = ref(1)
const hasCopyFilters = computed(() => !!(copySearch.value.trim() || copySubjectFilter.value || copyAreaFilter.value || copyStatusFilter.value))

const { data: copies, pending: copiesPending, execute: refetchCopies } =
    useLiveAsyncData('library-copies', () => librarianService.fetchCopies({
        search: copySearch.value.trim() || undefined,
        subjectID: copySubjectFilter.value || undefined,
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
        subjectID: copySubjectFilter.value || undefined,
        area: copyAreaFilter.value || undefined,
        status: copyStatusFilter.value || undefined,
    }), 'Catalog exported', 'Could not export the catalog')
    exportingCopies.value = false
}

watch([copySubjectFilter, copyAreaFilter, copyStatusFilter], () => {
    copyPage.value = 1
    refetchCopies()
})

// ---- Barcode labels ----
// Copies ticked in the Book Catalog (kept across pages; cleared when the search or filters change, so nothing
// ticked is ever hidden from view).
const selectedCopies = ref<string[]>([])
watch([copySearch, copySubjectFilter, copyAreaFilter, copyStatusFilter], () => { selectedCopies.value = [] })

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
// `includeUnconfirmed` is the window's "print the guessed numbers too" choice, kept when the numbers change.
function refineLabels(ranges: { from: number; to: number }[], options: { includeUnconfirmed: boolean }) {
    return loadLabels({
        ...labelBase,
        ...(ranges.length ? { accessions: ranges } : {}),
        ...(options.includeUnconfirmed ? { includeUnconfirmed: true } : {}),
    })
}

// From the toolbar: the ticked copies, or, with none ticked, everything the search and filters match.
function printCatalogLabels() {
    if (selectedCopies.value.length) return openLabels({ copies: selectedCopies.value })
    return openLabels({
        search: copySearch.value.trim() || undefined,
        subjectID: copySubjectFilter.value || undefined,
        area: copyAreaFilter.value || undefined,
        status: copyStatusFilter.value || undefined,
    })
}

function clearCopyFilters() {
    copySearch.value = ''
    copySubjectFilter.value = ''
    copyAreaFilter.value = ''
    copyStatusFilter.value = ''
}

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

// ---- Categories / genres ----
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

function goToStockPage(next: number) {
    if (next < 1 || (stockLogs.value && next > stockLogs.value.last_page)) return
    stockPage.value = next
    refetchStockLogs()
}

const stockBusy = ref(false)
const refreshStock = [refetchCopies, refetchBooks, refetchStats, refetchStockLogs]

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

const { data: subjectsResponse, pending: subjectsPending, execute: refetchSubjects } =
    useLiveAsyncData('library-subjects', () => subjectService.fetchSubjects(), { lazy: true })

const subjects = computed(() => subjectsResponse.value?.subjects ?? [])
const categorySearch = ref('')

const classifiedCount = computed(() => subjects.value.filter((s) => s.classificationCode).length)
const totalBooks = computed(() => subjects.value.reduce((sum, s) => sum + s.books_count, 0))
const largestSubject = computed(() =>
    subjects.value.reduce<SubjectRecord | null>((best, s) => (!best || s.books_count > best.books_count ? s : best), null))
const filteredSubjects = computed(() => {
    const term = categorySearch.value.trim().toLowerCase()
    return subjects.value.filter((s) => !term || s.name.toLowerCase().includes(term))
})

const isCategoryOpen = ref(false)
const editingSubject = ref<SubjectRecord | null>(null)
const categoryBusy = ref(false)

function openCategoryForm(subject: SubjectRecord | null) {
    editingSubject.value = subject
    isCategoryOpen.value = true
}

async function saveCategory(payload: { name: string; classificationCode: string | null }) {
    categoryBusy.value = true
    const target = editingSubject.value
    const ok = await perform(
        () => target ? subjectService.updateSubject(target.uuid, payload) : subjectService.createSubject(payload),
        target ? 'Category updated' : 'Category added',
        'Could not save category',
        [refetchSubjects, refetchBooks, refetchCopies],
    )
    categoryBusy.value = false
    if (ok) isCategoryOpen.value = false
}

const deleteSubject = ref<SubjectRecord | null>(null)
const isDeleteCategoryOpen = ref(false)

function askDeleteCategory(subject: SubjectRecord) {
    deleteSubject.value = subject
    isDeleteCategoryOpen.value = true
}

async function handleDeleteCategory() {
    if (!deleteSubject.value) return
    const subjectUuid = deleteSubject.value.uuid
    categoryBusy.value = true
    const ok = await perform(() => subjectService.deleteSubject(subjectUuid), 'Category deleted', 'Could not delete category', [refetchSubjects])
    categoryBusy.value = false
    if (ok) isDeleteCategoryOpen.value = false
}

// ---- Add book ----
const isAddModalOpen = ref(false)
// Every category, not just the ones on the current page of books.
const bookCategories = computed(() => subjects.value.map((s) => s.name))

// "Print labels" on the book-added page: the Add Book window gives way to the print window (never two at once).
function printNewBookLabels(bookUuid: string) {
    isAddModalOpen.value = false
    return openLabels({ book: bookUuid })
}

async function handleBookCreated() {
    await Promise.all([refetchBooks(), refetchCopies(), refetchStats(), refetchSubjects(), refetchStockLogs()])
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

// "Show all in Accession Record" in a category's details: the same list, filtered to that category.
function showCategoryBooks(subject: SubjectRecord) {
    subjectFilter.value = subject.subjectID
    activeTab.value = 'accession'
}

async function openBookDetail(book: Pick<CatalogBook, 'uuid'>) {
    if (detailBook.value?.uuid !== book.uuid) detailBook.value = null
    isDetailOpen.value = true
    await loadBookDetail(book.uuid)
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
    await Promise.all([refetchBooks(), refetchCopies(), refetchStats(), refetchSubjects(), refetchStockLogs(), bookUuid ? loadBookDetail(bookUuid) : null])
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
        [refetchBooks, refetchCopies, refetchStats, refetchSubjects, refetchStockLogs])
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
const requestStatusFilter = ref<'' | 'Pending' | 'Approved' | 'Rejected'>('')

const requestStats = computed(() => ({
    total: suggestions.value.length,
    pending: suggestions.value.filter((s) => s.status === 'Pending').length,
    approved: suggestions.value.filter((s) => s.status === 'Approved').length,
    rejected: suggestions.value.filter((s) => s.status === 'Rejected').length,
}))

const filteredRequests = computed(() => {
    const term = requestSearch.value.trim().toLowerCase()
    return suggestions.value.filter((s) => {
        if (requestStatusFilter.value && s.status !== requestStatusFilter.value) return false
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

watch([requestSearch, requestStatusFilter], () => {
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
const requestDecision = ref<{ suggestion: BookSuggestion; action: 'approve' | 'reject' } | null>(null)
const isRequestDecisionOpen = ref(false)
const requestDecisionBusy = ref(false)

const requestDecisionText = computed(() => {
    const d = requestDecision.value
    if (!d) return { title: '', message: '', confirm: '' }
    const requester = d.suggestion.student?.user ? `${d.suggestion.student.user.firstName} ${d.suggestion.student.user.lastName}` : 'the student'
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

function handleReject(suggestion: BookSuggestion) {
    requestDecision.value = { suggestion, action: 'reject' }
    isRequestDecisionOpen.value = true
}

async function confirmRequestDecision() {
    const decision = requestDecision.value
    if (!decision) return
    const { suggestion, action } = decision
    requestDecisionBusy.value = true
    const ok = action === 'approve'
        ? await perform(() => librarianService.approveBookSuggestion(suggestion.uuid), 'Request approved', 'Could not approve this request', [refetchRequests])
        : await perform(() => librarianService.rejectBookSuggestion(suggestion.uuid), 'Request rejected', 'Could not reject this request', [refetchRequests])
    requestDecisionBusy.value = false
    if (ok) {
        isRequestDecisionOpen.value = false
        isDrawerOpen.value = false
    }
}
</script>
