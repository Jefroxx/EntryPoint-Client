<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Attendance</h1>
            <p class="dashboard-heading mt-1 text-amber-900">Manage attendance records and related activities.</p>
        </div>

        <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LibrarianCatalogStatTile label="Currently in library" :value="stats?.currentlyInLibrary ?? '—'"
                icon="i-tabler-circle-check" tone="success" />
            <LibrarianCatalogStatTile label="Total visits today" :value="stats?.totalVisitsToday ?? '—'"
                icon="i-tabler-user-check" tone="accent" />
            <LibrarianCatalogStatTile label="Average time inside"
                :value="stats?.averageMinutesToday != null ? `${stats.averageMinutesToday}m` : '—'"
                icon="i-tabler-clock" tone="warning" />
        </div>

        <LibrarianScanStation class="mb-5" @scanned="onScanned" />

        <div class="mb-4 flex flex-wrap items-center gap-2">
            <div
                class="flex h-[42px] min-w-[200px] max-w-[300px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
                <Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
                <input id="attendance-search" v-model="search" type="text" placeholder="Search student or ID"
                    class="w-full border-none bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400" />
            </div>

            <div class="flex-1"></div>

            <ButtonsButton variant="ghost" @click="search = ''">
                <Icon name="i-tabler-rotate" class="h-3.5 w-3.5" />Reset
            </ButtonsButton>
        </div>

        <LibrarianAttendanceLogTable :logs="logs?.data ?? []" :loading="logsPending" />

        <div v-if="logs" class="mt-3 flex items-center justify-between text-[13.5px] text-stone-400">
            <span>Showing {{ logs.data.length }} of {{ logs.total }} logs</span>
            <span>Page {{ logs.current_page }} of {{ logs.last_page }}</span>
        </div>

        <div v-if="logs && logs.last_page > 1" class="mt-3 flex items-center justify-center gap-2">
            <ButtonsButton variant="ghost" size="sm" :disabled="logs.current_page <= 1"
                @click="goToPage(logs.current_page - 1)">
                <Icon name="i-tabler-chevron-left" class="h-3.5 w-3.5" />Previous
            </ButtonsButton>
            <ButtonsButton variant="ghost" size="sm" :disabled="logs.current_page >= logs.last_page"
                @click="goToPage(logs.current_page + 1)">
                Next
                <Icon name="i-tabler-chevron-right" class="h-3.5 w-3.5" />
            </ButtonsButton>
        </div>
    
    </div>
</template>

<script setup lang="ts">
import { librarianService } from '~/services/librarianService'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Attendance' })


const search = ref('')
const page = ref(1)

const { data: stats, execute: refetchStats } = useLiveAsyncData('attendance-stats', () => librarianService.fetchAttendanceStats(), { lazy: true })

const { data: logs, pending: logsPending, execute: refetchLogs } = useLiveAsyncData(
    'attendance-logs',
    () => librarianService.fetchAttendanceLogs({
        search: search.value || undefined,
        page: page.value,
        perPage: 10,
    }),
    { lazy: true },
)

let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        page.value = 1
        refetchLogs()
    }, 300)
})

// A scan changes both the log and the "currently in library" numbers straight away.
function onScanned() {
    void refetchLogs()
    void refetchStats()
}

function goToPage(next: number) {
    if (next < 1 || (logs.value && next > logs.value.last_page)) return
    page.value = next
    refetchLogs()
}
</script>
