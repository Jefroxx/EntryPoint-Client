<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Students</h1>
            <p class="dashboard-heading mt-1 text-crimson">Review registrations and manage member accounts.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" wrap class="mb-5" :tabs="[
            { label: 'Approved Students', short: 'Approved', value: 'approved' },
            { label: 'Pending Approval', short: 'Pending', value: 'pending', badge: stats?.pending || undefined },
            { label: 'Rejected', value: 'rejected' },
            { label: 'Faculty and staff', short: 'Members', value: 'members' },
        ]" />

        <p v-if="isMembers" class="mb-4 flex items-start gap-2.5 rounded-xl bg-stone-100 px-4 py-3 text-[13.5px] text-stone-700">
            <Icon name="i-tabler-info-circle" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Faculty and staff members borrow and visit like students. An administrator creates and manages their accounts, so this list is for looking them up.
        </p>

        <p v-if="activeTab === 'rejected'" class="mb-4 flex items-start gap-2.5 rounded-xl bg-stone-100 px-4 py-3 text-[13.5px] text-stone-700">
            <Icon name="i-tabler-info-circle" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            These registrations were rejected, so these students can't log in. Reinstate a student to approve them again.
        </p>

        <!-- The counts. Pending, Approved and Rejected take you to that list (tap the one you are on to stay); for faculty and staff,
             Faculty and Staff narrow the list by type (tap again to see both). -->
        <div v-if="!isMembers" class="phone-stats mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <LibrarianCatalogStatTile label="Total Students" :value="stats?.total ?? '—'" icon="i-tabler-users" tone="accent" />
            <LibrarianStatTileButton label="Approved" :value="stats?.approved ?? '—'" icon="i-tabler-circle-check" tone="success"
                :active="activeTab === 'approved'" @click="activeTab = 'approved'" />
            <LibrarianStatTileButton label="Pending Approval" :value="stats?.pending ?? '—'" icon="i-tabler-clock" tone="warning"
                :active="activeTab === 'pending'" @click="activeTab = 'pending'" />
            <LibrarianStatTileButton label="Rejected" :value="stats?.rejected ?? '—'" icon="i-tabler-circle-x" tone="danger"
                :active="activeTab === 'rejected'" @click="activeTab = 'rejected'" />
        </div>
        <div v-else class="phone-stats mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <LibrarianCatalogStatTile label="Total Members" :value="memberStats ? memberStats.faculty! + memberStats.staff! : '—'" icon="i-tabler-users" tone="accent" />
            <LibrarianStatTileButton label="Faculty" :value="memberStats?.faculty ?? '—'" icon="i-tabler-school" tone="success"
                :active="typeFilter === 'faculty'" @click="typeFilter = typeFilter === 'faculty' ? '' : 'faculty'" />
            <LibrarianStatTileButton label="Staff" :value="memberStats?.staff ?? '—'" icon="i-tabler-briefcase" tone="warning"
                :active="typeFilter === 'staff'" @click="typeFilter = typeFilter === 'staff' ? '' : 'staff'" />
        </div>

        <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
            <LibrarianSearchInput id="student-search" v-model="search" class="!min-w-[210px] !max-w-[560px] !basis-[480px]"
                :placeholder="isMembers ? 'Search name, employee ID or email' : 'Search name, student ID or email'" />
            <LibrarianFilterMenu class="toolbar-full" v-model="filters" :groups="filterGroups" />
            <div class="flex-1"></div>
        </div>

        <LibrarianStudentsTable :students="students?.data ?? []" :loading="studentsPending" :empty-text="emptyText" :members="isMembers"
            @view="openDrawer" @approve="handleApprove" @reject="handleReject" @reinstate="askReinstate" />

        <LibrarianPagination v-if="students" :shown="students.data.length" :total="students.total" :noun="isMembers ? 'members' : 'students'"
            :page="students.current_page" :last-page="students.last_page" @change="goToPage" />


        <LibrarianStudentDetailDrawer :open="isDrawerOpen" :student="activeStudent" @close="isDrawerOpen = false"
            @approve="handleApprove" @reject="handleReject" @reinstate="askReinstate" />

        <LibrarianStudentReviewModal :open="isReviewOpen" :mode="reviewMode" :student="reviewStudent" :busy="reviewBusy"
            @close="isReviewOpen = false" @submit="confirmReview" />

        <AlertToast />
    
    </div>
</template>

<script setup lang="ts">
import { librarianService, type StudentRecord } from '~/services/librarianService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Students' })

const { perform } = useAction()

const route = useRoute()
// The list is split by status: approved students (the default), those waiting for approval, and rejected ones.
type StudentTab = 'approved' | 'pending' | 'rejected' | 'members'
const activeTab = ref<StudentTab>(['pending', 'rejected', 'members'].includes(String(route.query.tab)) ? (route.query.tab as StudentTab) : 'approved')

// The fourth tab is a read-only list of faculty and staff members (an administrator manages their accounts).
const isMembers = computed(() => activeTab.value === 'members')

const emptyText = computed(() => ({
    approved: 'No approved students match your search.',
    pending: 'No registrations are waiting for approval.',
    rejected: 'No rejected registrations.',
    members: 'No faculty or staff members match your search.',
})[activeTab.value])
const search = ref('')
// For students this narrows by program; for faculty and staff, by department.
const programFilter = ref('')
// Faculty and staff only: just one of the two types ('' = both).
const typeFilter = ref<'' | 'faculty' | 'staff'>('')
const page = ref(1)

// The order of the list: the oldest registration first where there is a queue to work through (pending), newest first elsewhere.
// Each tab starts on its own order; the Filter button changes it.
const ALL = 'all'
const defaultSort = computed<'oldest' | 'newest'>(() => (activeTab.value === 'pending' ? 'oldest' : 'newest'))
const sort = ref<'oldest' | 'newest'>(defaultSort.value)

const { data: stats, execute: refetchStats } = useLiveAsyncData('student-stats', () => librarianService.fetchStudentStats('student'), { lazy: true })
const { data: memberStats } = useLiveAsyncData('member-stats', () => librarianService.fetchStudentStats('members'), { lazy: true })

const { data: students, pending: studentsPending, execute: refetchStudents } = useLiveAsyncData(
    'students-list',
    () => librarianService.fetchStudents({
        search: search.value || undefined,
        program: programFilter.value || undefined,
        status: isMembers.value ? 'approved' : activeTab.value,
        // The first three tabs are students only: faculty and staff members are created by the administrator and are
        // never approved here. The fourth tab lists them.
        memberType: isMembers.value ? (typeFilter.value || 'members') : 'student',
        sort: sort.value,
        page: page.value,
        perPage: 12,
    }),
    { lazy: true },
)

// The Filter button: the order, and (for students) the program. The programs come from the server, so every program is
// there whichever page of the list is showing.
const filterGroups = computed(() => [
    { key: 'sort', title: 'Order', allValue: defaultSort.value, options: [
        { value: 'oldest', label: 'Oldest first', badge: 'Oldest first' },
        { value: 'newest', label: 'Newest first', badge: 'Newest first' },
    ] },
    ...(isMembers.value ? [{ key: 'type', title: 'Type', options: [
        { value: ALL, label: 'Faculty and staff' },
        { value: 'faculty', label: 'Faculty' },
        { value: 'staff', label: 'Staff' },
    ] }] : []),
    { key: 'program', title: isMembers.value ? 'Department' : 'Program', options: [
        { value: ALL, label: isMembers.value ? 'All departments' : 'All programs' },
        ...((isMembers.value ? memberStats.value?.programs : stats.value?.programs) ?? []).map((p) => ({ value: p, label: p })),
    ] },
])
const filters = computed({
    get: () => ({ sort: sort.value, type: typeFilter.value || ALL, program: programFilter.value || ALL }),
    set: (v) => {
        sort.value = v.sort as typeof sort.value
        typeFilter.value = (v.type === ALL ? '' : v.type) as typeof typeFilter.value
        programFilter.value = v.program === ALL ? '' : v.program
    },
})

let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        page.value = 1
        refetchStudents()
    }, 300)
})

watch(activeTab, () => { sort.value = defaultSort.value })
// A program means nothing for faculty and staff (and a department nothing for students), so crossing over clears it.
watch(isMembers, () => { programFilter.value = ''; typeFilter.value = '' })

watch([programFilter, typeFilter, sort, activeTab], () => {
    page.value = 1
    refetchStudents()
})

function goToPage(next: number) {
    if (next < 1 || (students.value && next > students.value.last_page)) return
    page.value = next
    refetchStudents()
}

const isDrawerOpen = ref(false)
const activeStudent = ref<StudentRecord | null>(null)

function openDrawer(student: StudentRecord) {
    activeStudent.value = student
    isDrawerOpen.value = true
}

// Approving, rejecting and reinstating a student all ask first, in one window: the student's details, then a
// last confirmation. Nothing changes until that final button.
type ReviewMode = 'approve' | 'reject' | 'reinstate'
const isReviewOpen = ref(false)
const reviewMode = ref<ReviewMode>('approve')
const reviewStudent = ref<StudentRecord | null>(null)
const reviewBusy = ref(false)

function openReview(student: StudentRecord, mode: ReviewMode) {
    reviewStudent.value = student
    reviewMode.value = mode
    isReviewOpen.value = true
}

const handleApprove = (student: StudentRecord) => openReview(student, 'approve')
const handleReject = (student: StudentRecord) => openReview(student, 'reject')
const askReinstate = (student: StudentRecord) => openReview(student, 'reinstate')

async function confirmReview(reason = '') {
    const student = reviewStudent.value
    if (!student) return
    const mode = reviewMode.value

    reviewBusy.value = true
    const ok = await perform(
        () => (mode === 'reject' ? librarianService.rejectStudent(student.uuid, reason) : librarianService.approveStudent(student.uuid)),
        mode === 'approve' ? 'Student approved' : mode === 'reinstate' ? 'Approval reinstated' : 'Student rejected',
        mode === 'reject' ? 'Could not reject student' : mode === 'reinstate' ? 'Could not reinstate the student' : 'Could not approve student',
        [refetchStudents, refetchStats],
    )
    reviewBusy.value = false
    // Done or failed, the window has served its purpose (a failure is shown as a message, the list is as it was).
    isReviewOpen.value = false
    if (ok) isDrawerOpen.value = false
}
</script>
