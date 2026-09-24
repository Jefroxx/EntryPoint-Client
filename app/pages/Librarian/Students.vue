<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Students</h1>
            <p class="dashboard-heading mt-1 text-amber-900">Review registrations and manage member accounts.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" class="mb-5" :tabs="[
            { label: 'All Students', value: 'all' },
            { label: 'Pending Approval', value: 'pending' },
        ]" />

        <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <LibrarianCatalogStatTile label="Total Students" :value="stats?.total ?? '—'"
                icon="i-tabler-users" tone="accent" />
            <LibrarianCatalogStatTile label="Pending Approval" :value="stats?.pending ?? '—'"
                icon="i-tabler-clock" tone="warning" />
            <LibrarianCatalogStatTile label="Approved" :value="stats?.approved ?? '—'"
                icon="i-tabler-circle-check" tone="success" />
            <LibrarianCatalogStatTile label="Rejected" :value="stats?.rejected ?? '—'"
                icon="i-tabler-circle-x" tone="danger" />
        </div>

        <div class="mb-4 flex flex-wrap items-center gap-2">
            <div
                class="flex h-[42px] min-w-[200px] max-w-[300px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
                <Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
                <input id="student-search" v-model="search" type="text" placeholder="Search name or student ID"
                    class="w-full border-none bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400" />
            </div>

            <select v-model="programFilter"
                class="flex h-[42px] items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                <option value="">All Programs</option>
                <option v-for="p in programOptions" :key="p" :value="p">{{ p }}</option>
            </select>

            <div class="flex-1"></div>

            <LibrarianResetFiltersButton @click="search = ''; programFilter = ''" />
        </div>

        <LibrarianStudentsTable :students="students?.data ?? []" :loading="studentsPending"
            @view="openDrawer" @approve="handleApprove" @reject="handleReject" />

        <div v-if="students" class="mt-3 flex items-center justify-between text-[13.5px] text-stone-400">
            <span>Showing {{ students.data.length }} of {{ students.total }} students</span>
            <span>Page {{ students.current_page }} of {{ students.last_page }}</span>
        </div>

        <div v-if="students && students.last_page > 1" class="mt-3 flex items-center justify-center gap-2">
            <ButtonsButton variant="ghost" size="sm" :disabled="students.current_page <= 1"
                @click="goToPage(students.current_page - 1)">
                <Icon name="i-tabler-chevron-left" class="h-3.5 w-3.5" />Previous
            </ButtonsButton>
            <ButtonsButton variant="ghost" size="sm" :disabled="students.current_page >= students.last_page"
                @click="goToPage(students.current_page + 1)">
                Next<Icon name="i-tabler-chevron-right" class="h-3.5 w-3.5" />
            </ButtonsButton>
        </div>
    

        <LibrarianStudentDetailDrawer :open="isDrawerOpen" :student="activeStudent" @close="isDrawerOpen = false"
            @approve="handleApprove" @reject="handleReject" />

        <AlertToast />
    
    </div>
</template>

<script setup lang="ts">
import { librarianService, type StudentRecord } from '~/services/librarianService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Students' })

const alert = useAlert()

const route = useRoute()
const activeTab = ref(route.query.tab === 'pending' ? 'pending' : 'all')
const search = ref('')
const programFilter = ref('')
const page = ref(1)

const { data: stats, execute: refetchStats } = useLiveAsyncData('student-stats', () => librarianService.fetchStudentStats(), { lazy: true })

const { data: students, pending: studentsPending, execute: refetchStudents } = useLiveAsyncData(
    'students-list',
    () => librarianService.fetchStudents({
        search: search.value || undefined,
        program: programFilter.value || undefined,
        status: activeTab.value === 'pending' ? 'pending' : undefined,
        page: page.value,
        perPage: 10,
    }),
    { lazy: true },
)

const programOptions = computed(() => {
    const names = (students.value?.data ?? []).map((s) => s.academicProgram).filter((p): p is string => !!p)
    return [...new Set(names)]
})

let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        page.value = 1
        refetchStudents()
    }, 300)
})

watch([programFilter, activeTab], () => {
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

async function handleApprove(student: StudentRecord) {
    try {
        await librarianService.approveStudent(student.studentID)
        isDrawerOpen.value = false
        alert.success('Student approved', `${student.user?.firstName ?? 'Student'} can now log in.`)
        await Promise.all([refetchStudents(), refetchStats()])
    } catch (error: any) {
        alert.error('Could not approve student', error?.data?.message || 'Please try again.')
    }
}

async function handleReject(student: StudentRecord) {
    try {
        await librarianService.rejectStudent(student.studentID)
        isDrawerOpen.value = false
        alert.success('Student rejected', `${student.user?.firstName ?? 'Student'}'s registration was rejected.`)
        await Promise.all([refetchStudents(), refetchStats()])
    } catch (error: any) {
        alert.error('Could not reject student', error?.data?.message || 'Please try again.')
    }
}
</script>
