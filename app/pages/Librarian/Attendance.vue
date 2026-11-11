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
            <LibrarianCatalogStatTile label="Average time inside"
                :value="stats ? `${stats.day.averageMinutes}m` : '—'"
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
                    {{ stationOpen
                        ? 'Scans from the station tab show up here straight away.'
                        : 'Opens the scanner in its own tab using the webcam or a phone camera. It reads student IDs for attendance, and also borrowing receipts, reservation slips and facility labels.' }}
                </p>
            </div>
            <ButtonsButton :variant="stationOpen ? 'ghost' : 'primary'" class="max-sm:w-full" @click="openStation">
                <Icon :name="stationOpen ? 'i-tabler-external-link' : 'i-tabler-player-play'" class="h-4 w-4" />
                {{ stationOpen ? 'Go to station' : 'Start attendance' }}
            </ButtonsButton>
        </section>

        <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
            <div
                class="flex h-[42px] min-w-[200px] max-w-[300px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
                <Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
                <input id="attendance-search" v-model="search" type="text" placeholder="Search student or ID"
                    class="w-full border-none bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400" />
            </div>

            <!-- Day by day: step back through the log, pick a date from a calendar, or jump back to today. -->
            <LibrarianDayPicker v-model="day" :max="todayYmd" :empty-value="todayYmd" reset-label="Today" />

            <div class="flex-1"></div>

            <ButtonsButton variant="ghost" @click="visitorOpen = true">
                <Icon name="i-tabler-user-plus" class="h-4 w-4" />Log a visitor
            </ButtonsButton>
            <LibrarianResetFiltersButton class="toolbar-full" @click="search = ''; day = todayYmd" />
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

    </div>
</template>

<script setup lang="ts">
import { librarianService } from '~/services/librarianService'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Attendance' })


const search = ref('')
const page = ref(1)

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
const alert = useAlert()
const visitorOpen = ref(false)
const visitorBusy = ref(false)
const checkingOut = ref<string | null>(null)

async function submitVisitor(payload: { name: string; purpose: string }) {
    visitorBusy.value = true
    try {
        await librarianService.logVisitor(payload)
        visitorOpen.value = false
        alert.success('Visitor checked in', payload.name)
        await Promise.all([refetchLogs(), refetchStats()])
    } catch (error: any) {
        alert.error('Could not log the visitor', apiErrorMessage(error))
    } finally {
        visitorBusy.value = false
    }
}

async function checkOutVisitor(uuid: string) {
    checkingOut.value = uuid
    try {
        await librarianService.checkOutVisitor(uuid)
        alert.success('Visitor checked out')
        await Promise.all([refetchLogs(), refetchStats()])
    } catch (error: any) {
        alert.error('Could not check them out', apiErrorMessage(error))
    } finally {
        checkingOut.value = null
    }
}

function goToPage(next: number) {
    if (next < 1 || (logs.value && next > logs.value.last_page)) return
    page.value = next
    refetchLogs()
}
</script>
