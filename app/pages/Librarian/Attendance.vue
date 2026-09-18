<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Attendance</h1>
            <p class="dashboard-heading mt-1 text-amber-900">Manage attendance records and related activities.</p>
        </div>

        <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LibrarianCatalogStatTile label="Currently in library" :value="stats?.currentlyInLibrary ?? '—'"
                icon="i-lucide-circle-check" tone="success" />
            <LibrarianCatalogStatTile label="Total visits today" :value="stats?.totalVisitsToday ?? '—'"
                icon="i-lucide-user-check" tone="accent" />
            <LibrarianCatalogStatTile label="Average time inside"
                :value="stats?.averageMinutesToday != null ? `${stats.averageMinutesToday}m` : '—'"
                icon="i-lucide-clock" tone="warning" />
        </div>

        <div class="mb-4 flex flex-wrap items-center gap-2">
            <div
                class="flex h-[38px] min-w-[200px] max-w-[300px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
                <Icon name="i-lucide-search" class="h-[15px] w-[15px] text-stone-400" />
                <input id="attendance-search" v-model="search" type="text" placeholder="Search student or ID"
                    class="w-full border-none bg-transparent text-[13.5px] text-stone-800 outline-none placeholder:text-stone-400" />
            </div>

            <div class="flex-1"></div>

            <ButtonsButton variant="ghost" @click="search = ''">
                <Icon name="i-lucide-rotate-ccw" class="h-3.5 w-3.5" />Reset
            </ButtonsButton>
        </div>

        <LibrarianAttendanceLogTable :logs="logs?.data ?? []" :loading="logsPending" />

        <div v-if="logs" class="mt-3 flex items-center justify-between text-[12.5px] text-stone-400">
            <span>Showing {{ logs.data.length }} of {{ logs.total }} logs</span>
            <span>Page {{ logs.current_page }} of {{ logs.last_page }}</span>
        </div>

        <div v-if="logs && logs.last_page > 1" class="mt-3 flex items-center justify-center gap-2">
            <ButtonsButton variant="ghost" size="sm" :disabled="logs.current_page <= 1"
                @click="goToPage(logs.current_page - 1)">
                <Icon name="i-lucide-chevron-left" class="h-3.5 w-3.5" />Previous
            </ButtonsButton>
            <ButtonsButton variant="ghost" size="sm" :disabled="logs.current_page >= logs.last_page"
                @click="goToPage(logs.current_page + 1)">
                Next
                <Icon name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
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


const search = ref('')
const page = ref(1)

const { data: stats } = useAsyncData('attendance-stats', () => librarianService.fetchAttendanceStats(), { lazy: true })

const { data: logs, pending: logsPending, execute: refetchLogs } = useAsyncData(
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

function goToPage(next: number) {
    if (next < 1 || (logs.value && next > logs.value.last_page)) return
    page.value = next
    refetchLogs()
}
</script>
