<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Attendance</h1>
            <p class="dashboard-heading mt-1 text-crimson">Manage attendance records and related activities.</p>
        </div>

        <!-- Today: who is in right now. Any other day: that day's own numbers. -->
        <div class="phone-stats mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <LibrarianCatalogStatTile v-if="isToday" label="Currently in library" :value="stats?.currentlyInLibrary ?? '—'"
                icon="i-tabler-circle-check" tone="success" />
            <LibrarianCatalogStatTile v-else label="Different students" :value="stats?.day.students ?? '—'"
                icon="i-tabler-users" tone="success" />
            <LibrarianCatalogStatTile :label="isToday ? 'Total visits today' : 'Visits that day'" :value="stats?.day.visits ?? '—'"
                icon="i-tabler-user-check" tone="accent" />
            <!-- The average length of the visits that have ended; with none ended yet there is nothing to average. -->
            <LibrarianCatalogStatTile label="Average visit length"
                :value="stats && stats.day.averageMinutes !== null ? formatMinutes(stats.day.averageMinutes) : '—'"
                icon="i-tabler-clock" tone="warning" />
        </div>

        <!-- The scanner runs in its own tab; this card opens it and shows whether it's running. -->
        <section class="mb-5 flex flex-col items-start gap-3 rounded-2xl border p-4 transition-colors duration-300 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:p-5"
            :class="stationOpen ? 'border-emerald-200 bg-emerald-50' : 'border-stone-200 bg-white'">
            <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                :class="stationOpen ? 'bg-emerald-600 text-white' : 'bg-accent-100 text-accent-600'">
                <Icon :name="stationOpen ? 'i-tabler-scan' : 'i-tabler-camera'" class="h-6 w-6" />
            </span>
            <div class="min-w-0 flex-1">
                <p class="flex items-center gap-2 text-[16px] font-bold text-stone-900">
                    {{ stationOpen ? 'Scan station is running' : 'Start the scanner' }}
                    <span v-if="stationOpen" class="relative flex h-2.5 w-2.5">
                        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                        <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    </span>
                </p>
                <p class="text-[13.5px] leading-snug text-stone-500">
                    <template v-if="stationOpen">Scans from the station tab show up here straight away.</template>
                    <template v-else>
                        <span class="sm:hidden">Opens the scanner in its own tab, with the webcam or a phone camera.</span>
                        <span class="hidden sm:inline">Opens the scanner in its own tab using the webcam or a phone camera. It reads student IDs for attendance, and also borrowing receipts, reservation slips and facility labels.</span>
                    </template>
                </p>
            </div>
            <ButtonsButton :variant="stationOpen ? 'ghost' : 'primary'" class="max-sm:w-full" @click="openStation">
                <Icon :name="stationOpen ? 'i-tabler-external-link' : 'i-tabler-player-play'" class="h-4 w-4" />
                {{ stationOpen ? 'Go to station' : 'Start attendance' }}
            </ButtonsButton>
        </section>

        <!-- With the day picker in it this toolbar is wider than the others, so it only stays on one row on a desktop. -->
        <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2 lg:flex-nowrap">
            <LibrarianSearchInput id="attendance-search" v-model="search" class="!min-w-[210px]" placeholder="Search name or ID" />

            <!-- Day by day: step back through the log, pick a date from a calendar, or jump back to today. -->
            <LibrarianDayPicker class="toolbar-full" v-model="day" :max="todayYmd" :empty-value="todayYmd" reset-label="Today" />

            <LibrarianFilterMenu class="toolbar-half" v-model="filters" :groups="filterGroups" />
            <div class="flex-1"></div>
            <ButtonsButton variant="primary" class="toolbar-half" @click="visitorOpen = true">
                <Icon name="i-tabler-user-plus" class="h-4 w-4" />Log a visitor
            </ButtonsButton>
        </div>

        <p class="mb-3 text-[15px] font-semibold text-stone-800">
            {{ dayHeading }}
            <span v-if="stats" class="font-normal text-stone-500">
                · {{ stats.day.visits }} {{ stats.day.visits === 1 ? 'visit' : 'visits' }}<span v-if="stats.day.visitors"> ({{ stats.day.visitors }} walk-in {{ stats.day.visitors === 1 ? 'visitor' : 'visitors' }})</span>
            </span>
        </p>

        <LibrarianAttendanceLogTable :logs="logs?.data ?? []" :loading="logsPending" :checking-out="checkingOut"
            @check-out="checkOutVisitor" />

        <LibrarianVisitorLogModal :open="visitorOpen" :busy="visitorBusy" @close="visitorOpen = false"
            @submit="submitVisitor" />

        <LibrarianPagination v-if="logs" :shown="logs.data.length" :total="logs.total" noun="logs"
            :page="logs.current_page" :last-page="logs.last_page" @change="goToPage" />

        <AlertToast />

    </div>
</template>

<script setup lang="ts">
import { librarianService } from '~/services/librarianService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Attendance' })


const search = ref('')
const page = ref(1)

// The Filter button: who was inside, what kind of person, and the order.
const ALL = 'all'
const statusFilter = ref<'' | 'in' | 'out'>('')
const whoFilter = ref<'' | 'students' | 'members' | 'visitors'>('')
const sort = ref<'newest' | 'oldest'>('newest')
const filterGroups = [
    { key: 'status', title: 'Status', options: [{ value: ALL, label: 'Any status' }, { value: 'in', label: 'In the library' }, { value: 'out', label: 'Checked out' }] },
    { key: 'who', title: 'Who', options: [{ value: ALL, label: 'Everyone' }, { value: 'students', label: 'Students' }, { value: 'members', label: 'Faculty and staff' }, { value: 'visitors', label: 'Walk-in visitors' }] },
    { key: 'sort', title: 'Order', allValue: 'newest', options: [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }] },
]
const filters = computed({
    get: () => ({ status: statusFilter.value || ALL, who: whoFilter.value || ALL, sort: sort.value }),
    set: (v) => {
        statusFilter.value = (v.status === ALL ? '' : v.status) as typeof statusFilter.value
        whoFilter.value = (v.who === ALL ? '' : v.who) as typeof whoFilter.value
        sort.value = v.sort as typeof sort.value
    },
})

/* ---------- day by day ---------- */
// Local Y-m-d (not toISOString, which is UTC and can land on the wrong day in the evening).
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayYmd = ymd(new Date())
const day = ref(todayYmd)
const isToday = computed(() => day.value === todayYmd)

const dayHeading = computed(() => {
    const [y, m, d] = day.value.split('-').map(Number)
    if (!y || !m || !d) return 'Attendance'
    const label = formatLongDate(new Date(y, m - 1, d))
    return isToday.value ? `Today · ${label}` : label
})

const { data: stats, execute: refetchStats } = useLiveAsyncData('attendance-stats', () => librarianService.fetchAttendanceStats(day.value), { lazy: true })

const { data: logs, pending: logsPending, execute: refetchLogs } = useLiveAsyncData(
    'attendance-logs',
    () => librarianService.fetchAttendanceLogs({
        search: search.value || undefined,
        date: day.value,
        status: statusFilter.value || undefined,
        who: whoFilter.value || undefined,
        sort: sort.value === 'oldest' ? 'oldest' : undefined,
        page: page.value,
        perPage: 12,
    }),
    { lazy: true },
)

// A cleared or half-typed date box means "back to today".
watch(day, (value) => {
    if (!value) { day.value = todayYmd; return }
    page.value = 1
    void refetchLogs()
    void refetchStats()
})

watch([statusFilter, whoFilter, sort], () => {
    page.value = 1
    void refetchLogs()
})

let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        page.value = 1
        refetchLogs()
    }, 300)
})

/* ---------- scan station (its own tab) ---------- */
const stationOpen = ref(false)
const openStation = openAttendanceStation

// The station tab tells us when it opens, closes, or scans someone.
const { post } = useStationChannel((message) => {
    if (message.type === 'open') stationOpen.value = true
    else if (message.type === 'closed') stationOpen.value = false
    else if (message.type === 'scanned') {
        // A scan changes both the log and the "currently in library" numbers straight away.
        void refetchLogs()
        void refetchStats()
    }
})

onMounted(() => post({ type: 'ping' }))

/* ---------- walk-in visitors (no account) ---------- */
const { perform } = useAction()
const visitorOpen = ref(false)
const visitorBusy = ref(false)
const checkingOut = ref<string | null>(null)

async function submitVisitor(payload: { name: string; purpose: string }) {
    visitorBusy.value = true
    const ok = await perform(() => librarianService.logVisitor(payload), 'Visitor checked in', 'Could not log the visitor', [refetchLogs, refetchStats])
    visitorBusy.value = false
    if (ok) visitorOpen.value = false
}

async function checkOutVisitor(uuid: string) {
    checkingOut.value = uuid
    await perform(() => librarianService.checkOutVisitor(uuid), 'Visitor checked out', 'Could not check them out', [refetchLogs, refetchStats])
    checkingOut.value = null
}

function goToPage(next: number) {
    if (next < 1 || (logs.value && next > logs.value.last_page)) return
    page.value = next
    refetchLogs()
}
</script>
