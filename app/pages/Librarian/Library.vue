<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Library</h1>
            <p class="dashboard-heading mt-1 text-amber-900">Manage and organize all library books.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" class="mb-5" :tabs="[
            { label: 'Book Catalog', value: 'catalog' },
            { label: 'Book Requests', value: 'requests' },
            { label: 'Categories / Genres', value: 'categories' },
        ]" />

        <template v-if="activeTab === 'catalog'">
            <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <LibrarianCatalogStatTile label="Total Books" :value="stats?.totalBooks ?? '—'"
                    icon="i-tabler-book-2" tone="accent" />
                <LibrarianCatalogStatTile label="Available Books" :value="stats?.availableBooks ?? '—'"
                    icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="Borrowed Books" :value="stats?.borrowedBooks ?? '—'"
                    icon="i-tabler-book" tone="warning" />
                <LibrarianCatalogStatTile label="Overdue Books" :value="stats?.overdueBooks ?? '—'"
                    icon="i-tabler-alert-circle" tone="danger" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <div
                    class="flex h-[42px] min-w-[200px] max-w-[320px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
                    <Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
                    <input id="library-search" v-model="search" type="text"
                        placeholder="Search book, author, or ISBN"
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
                <div class="flex-1"></div>

                <LibrarianResetFiltersButton @click="clearBookFilters" />
                <ButtonsButton variant="primary" @click="openAddBook">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add New Book
                </ButtonsButton>
            </div>

            <LibrarianBookCatalogTable :books="books?.data ?? []" :loading="booksPending" :filtered="hasBookFilters"
                @view="openBookDetail" @edit="openEditBook" @remove="askRemoveBook" />

            <div v-if="books" class="mt-3 flex items-center justify-between text-[13.5px] text-stone-400">
                <span>Showing {{ books.data.length }} of {{ books.total }} books</span>
                <span>Page {{ books.current_page }} of {{ books.last_page }}</span>
            </div>

            <div v-if="books && books.last_page > 1" class="mt-3 flex items-center justify-center gap-2">
                <ButtonsButton variant="ghost" size="sm" :disabled="books.current_page <= 1"
                    @click="goToPage(books.current_page - 1)">
                    <Icon name="i-tabler-chevron-left" class="h-3.5 w-3.5" />Previous
                </ButtonsButton>
                <ButtonsButton variant="ghost" size="sm" :disabled="books.current_page >= books.last_page"
                    @click="goToPage(books.current_page + 1)">
                    Next<Icon name="i-tabler-chevron-right" class="h-3.5 w-3.5" />
                </ButtonsButton>
            </div>
        </template>

        <template v-else-if="activeTab === 'requests'">
            <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <LibrarianCatalogStatTile label="Total Requests" :value="requestStats.total"
                    icon="i-tabler-clipboard-list" tone="accent" />
                <LibrarianCatalogStatTile label="Pending Requests" :value="requestStats.pending"
                    icon="i-tabler-clock" tone="warning" />
                <LibrarianCatalogStatTile label="Approved Requests" :value="requestStats.approved"
                    icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="Rejected Requests" :value="requestStats.rejected"
                    icon="i-tabler-circle-x" tone="danger" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
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

            <p v-if="requestActionError" class="mb-3 text-[14px] font-medium text-red-600">{{ requestActionError }}</p>

            <LibrarianBookRequestsTable :suggestions="pagedRequests" :loading="requestsPending"
                @review="openReviewDrawer" @approve="handleApprove" @reject="handleReject" />

            <div v-if="suggestions" class="mt-3 flex items-center justify-between text-[13.5px] text-stone-400">
                <span>Showing {{ pagedRequests.length }} of {{ filteredRequests.length }} requests</span>
                <span>Page {{ requestsPage }} of {{ requestsTotalPages }}</span>
            </div>

            <div v-if="requestsTotalPages > 1" class="mt-3 flex items-center justify-center gap-2">
                <ButtonsButton variant="ghost" size="sm" :disabled="requestsPage <= 1" @click="requestsPage--">
                    <Icon name="i-tabler-chevron-left" class="h-3.5 w-3.5" />Previous
                </ButtonsButton>
                <ButtonsButton variant="ghost" size="sm" :disabled="requestsPage >= requestsTotalPages" @click="requestsPage++">
                    Next<Icon name="i-tabler-chevron-right" class="h-3.5 w-3.5" />
                </ButtonsButton>
            </div>
        </template>

        <template v-else>
            <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LibrarianCatalogStatTile label="Categories" :value="subjects.length" icon="i-tabler-tags"
                    tone="accent" />
                <LibrarianCatalogStatTile label="With a Dewey code"
                    :value="`${classifiedCount} of ${subjects.length}`" icon="i-tabler-circle-check"
                    tone="success" />
                <LibrarianCatalogStatTile label="Largest category" :value="largestSubject?.name ?? '—'"
                    icon="i-tabler-book-2" tone="warning" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="category-search" v-model="categorySearch"
                    placeholder="Search categories" />
                <div class="flex-1"></div>
                <ButtonsButton variant="primary" @click="openCategoryForm(null)">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add Category
                </ButtonsButton>
            </div>

            <LibrarianCategoriesTable :subjects="filteredSubjects" :loading="subjectsPending"
                @edit="openCategoryForm" @delete="askDeleteCategory" />

            <div class="mt-3 flex items-center justify-between text-[13.5px] text-stone-400">
                <span>Showing {{ filteredSubjects.length }} of {{ subjects.length }} categories</span>
                <span>{{ totalBooks }} books total</span>
            </div>
        </template>
    

        <LibrarianRequestReviewDrawer :open="isDrawerOpen" :suggestion="activeRequest" @close="isDrawerOpen = false"
            @approve="handleApprove" @reject="handleReject" />

        <LibrarianAddBookModal :open="isAddModalOpen" :categories="bookCategories" :book="editingBook"
            @close="isAddModalOpen = false" @created="handleBookCreated" @updated="handleBookUpdated" />

        <LibrarianBookDetailDrawer :open="isDetailOpen" :book="detailBook" :loading="detailLoading" :error="detailError"
            @close="isDetailOpen = false" @edit="openEditBook" @remove="askRemoveBook" />

        <LibrarianConfirmModal :open="isRemoveBookOpen" title="Remove this book?"
            :message="`“${removingBook?.title ?? 'This book'}” leaves the catalog and its copies are retired. Past loans and fines stay on students' records.`"
            confirm-label="Remove" :loading="removingBusy" @close="isRemoveBookOpen = false"
            @confirm="handleRemoveBook" />

        <LibrarianCategoryFormModal :open="isCategoryOpen" :subject="editingSubject" :busy="categoryBusy"
            @close="isCategoryOpen = false" @submit="saveCategory" />
        <LibrarianConfirmModal :open="isDeleteCategoryOpen" title="Delete category?"
            :message="`“${deleteSubject?.name ?? 'This category'}” will be removed. No books use it.`"
            confirm-label="Delete" :loading="categoryBusy" @close="isDeleteCategoryOpen = false"
            @confirm="handleDeleteCategory" />

        <AlertToast />
    
    </div>
</template>

<script setup lang="ts">
import { librarianService, type BookAvailabilityFilter, type BookDetail, type BookSuggestion, type CatalogBook } from '~/services/librarianService'
import { subjectService, type SubjectRecord } from '~/services/subjectService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Library' })


const route = useRoute()
const activeTab = ref(['catalog', 'requests', 'categories'].includes(String(route.query.tab)) ? String(route.query.tab) : 'catalog')
const search = ref('')
const page = ref(1)

const { data: stats, execute: refetchStats } = useLiveAsyncData('library-stats', () => librarianService.fetchLibraryStats(), { lazy: true })

const subjectFilter = ref<number | ''>('')
const availabilityFilter = ref<BookAvailabilityFilter>('')
const hasBookFilters = computed(() => !!(search.value.trim() || subjectFilter.value || availabilityFilter.value))

const { data: books, pending: booksPending, execute: refetchBooks } =
    useLiveAsyncData('library-books', () => librarianService.fetchBooks({
        search: search.value || undefined,
        subjectID: subjectFilter.value || undefined,
        availability: availabilityFilter.value || undefined,
        page: page.value,
        perPage: 10,
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
watch([subjectFilter, availabilityFilter], () => {
    page.value = 1
    refetchBooks()
})

function clearBookFilters() {
    search.value = ''
    subjectFilter.value = ''
    availabilityFilter.value = ''
}

function goToPage(next: number) {
    if (next < 1 || (books.value && next > books.value.last_page)) return
    page.value = next
    refetchBooks()
}

// ---- Categories / genres ----
const { perform } = useAction()

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
        () => target ? subjectService.updateSubject(target.subjectID, payload) : subjectService.createSubject(payload),
        target ? 'Category updated' : 'Category added',
        'Could not save category',
        [refetchSubjects, refetchBooks],
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
    const subjectID = deleteSubject.value.subjectID
    categoryBusy.value = true
    const ok = await perform(() => subjectService.deleteSubject(subjectID), 'Category deleted', 'Could not delete category', [refetchSubjects])
    categoryBusy.value = false
    if (ok) isDeleteCategoryOpen.value = false
}

// ---- Add book ----
const isAddModalOpen = ref(false)
// Every category, not just the ones on the current page of books.
const bookCategories = computed(() => subjects.value.map((s) => s.name))

async function handleBookCreated() {
    await Promise.all([refetchBooks(), refetchStats(), refetchSubjects()])
}

// ---- View / edit / remove a book ----
// The table only carries what its columns show; details and the edit form need the full record.
const detailBook = ref<BookDetail | null>(null)
const isDetailOpen = ref(false)
const detailLoading = ref(false)
const detailError = ref('')

async function loadBookDetail(bookID: number): Promise<BookDetail | null> {
    detailLoading.value = true
    detailError.value = ''
    try {
        const { book } = await librarianService.fetchBook(bookID)
        detailBook.value = book
        return book
    } catch (error) {
        detailError.value = apiErrorMessage(error, 'Please try again.')
        return null
    } finally {
        detailLoading.value = false
    }
}

async function openBookDetail(book: CatalogBook) {
    if (detailBook.value?.bookID !== book.bookID) detailBook.value = null
    isDetailOpen.value = true
    await loadBookDetail(book.bookID)
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
    const { new: _, ...rest } = route.query
    void navigateTo({ query: rest }, { replace: true })
})

/** From the table (a list row, so fetch the full record) or from the details drawer (already full). */
async function openEditBook(book: CatalogBook | BookDetail) {
    const full = 'loans' in book ? book : await loadBookDetail(book.bookID)
    if (!full) {
        alert.error('Could not open this book', detailError.value)
        return
    }
    editingBook.value = full
    isDetailOpen.value = false
    isAddModalOpen.value = true
}

async function handleBookUpdated() {
    const bookID = editingBook.value?.bookID
    await Promise.all([refetchBooks(), refetchStats(), refetchSubjects(), bookID ? loadBookDetail(bookID) : null])
}

const removingBook = ref<{ bookID: number; title: string } | null>(null)
const isRemoveBookOpen = ref(false)
const removingBusy = ref(false)

function askRemoveBook(book: CatalogBook | BookDetail) {
    removingBook.value = { bookID: book.bookID, title: book.title }
    isRemoveBookOpen.value = true
}

async function handleRemoveBook() {
    if (!removingBook.value) return
    const { bookID } = removingBook.value
    removingBusy.value = true
    const ok = await perform(() => librarianService.deleteBook(bookID), 'Book removed', 'Could not remove book',
        [refetchBooks, refetchStats, refetchSubjects])
    removingBusy.value = false
    if (ok) {
        isRemoveBookOpen.value = false
        if (detailBook.value?.bookID === bookID) isDetailOpen.value = false
    }
}

// ---- Book Requests (backed by the BookSuggestion feature) ----
const { data: suggestionsResponse, pending: requestsPending, execute: refetchRequests } =
    useLiveAsyncData('book-suggestions', () => librarianService.fetchBookSuggestions(), { lazy: true })

const suggestions = computed(() => suggestionsResponse.value?.suggestions ?? [])

const requestSearch = ref('')
const requestStatusFilter = ref<'' | 'Pending' | 'Approved' | 'Rejected'>('')
const requestActionError = ref('')

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

const REQUESTS_PER_PAGE = 10
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

async function handleApprove(suggestion: BookSuggestion) {
    requestActionError.value = ''
    try {
        await librarianService.approveBookSuggestion(suggestion.suggestionID)
        isDrawerOpen.value = false
        await refetchRequests()
    } catch (error: any) {
        requestActionError.value = error?.data?.message || 'Could not approve this request. Please try again.'
    }
}

async function handleReject(suggestion: BookSuggestion) {
    requestActionError.value = ''
    try {
        await librarianService.rejectBookSuggestion(suggestion.suggestionID)
        isDrawerOpen.value = false
        await refetchRequests()
    } catch (error: any) {
        requestActionError.value = error?.data?.message || 'Could not reject this request. Please try again.'
    }
}
</script>
