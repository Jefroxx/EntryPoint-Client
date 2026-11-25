<template>
    <!-- The dashboard's analytics, shared by the Dashboard ("Trends") and the Reports page so the two always match. -->
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div class="relative xl:col-span-2">
            <LibrarianTrendChartCard :title="chart.title" :subtitle="chart.subtitle" :labels="overview?.labels ?? []"
                :series="chart.series" :class="{ 'opacity-40 transition-opacity': overviewPending }">
                <template #actions>
                    <div class="flex flex-wrap items-center gap-2">
                        <LibrarianMiniToggle v-model="chartView" label="Chart data" :options="CHART_VIEWS" />
                        <div class="flex items-center gap-1 rounded-xl border border-stone-200 p-0.5" role="group" aria-label="Month">
                            <button type="button" aria-label="Previous month"
                                class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-[transform,background-color] duration-150 ease-out hover:bg-stone-100 hover:text-stone-900 active:scale-[0.96]"
                                @click="shiftMonth(-1)">
                                <Icon name="i-tabler-chevron-left" class="h-4 w-4" />
                            </button>
                            <span class="min-w-[118px] text-center text-[13.5px] font-semibold tabular-nums text-stone-800" aria-live="polite">{{ monthLabel }}</span>
                            <button type="button" aria-label="Next month" :disabled="isCurrentMonth"
                                class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-[transform,background-color] duration-150 ease-out hover:bg-stone-100 hover:text-stone-900 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-30"
                                @click="shiftMonth(1)">
                                <Icon name="i-tabler-chevron-right" class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </template>
            </LibrarianTrendChartCard>
            <LibrarianLoadingOverlay :loading="overviewPending" />
        </div>

        <LibrarianDemographicsCard title="Students by program"
            :subtitle="demoScope === 'members' ? 'All approved students' : `Different students who visited in ${monthLabel}`"
            :slices="demoSlices" :total="demo?.total ?? 0"
            :empty-text="demoScope === 'members' ? 'No approved students yet.' : `No one visited in ${monthLabel}.`">
            <template #actions>
                <LibrarianMiniToggle v-model="demoScope" label="Which students" :options="DEMO_SCOPES" />
            </template>
        </LibrarianDemographicsCard>

        <!-- Collection health: one stacked bar of every physical copy, by state. -->
        <section aria-labelledby="collection-heading" class="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm xl:col-span-3">
            <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <div>
                    <h2 id="collection-heading" class="font-bold text-crimson">Collection</h2>
                    <p class="text-[13px] text-stone-500">Every physical copy, by where it is now</p>
                </div>
                <p class="text-[13.5px] text-stone-500">
                    <b class="font-semibold tabular-nums text-stone-800">{{ summary?.totalBooks ?? '—' }}</b> titles
                    <span class="mx-1.5 text-stone-300">·</span>
                    <b class="font-semibold tabular-nums text-stone-800">{{ copiesTotal }}</b> copies
                    <span class="mx-1.5 text-stone-300">·</span>
                    <b class="font-semibold tabular-nums text-stone-800">{{ summary?.totalMembers ?? '—' }}</b> approved members
                </p>
            </div>

            <LibrarianCollectionBar :items="collection" :total="copiesTotal" />
        </section>
    </div>
</template>

<script setup lang="ts">
import { librarianService, type DemographicsScope } from '~/services/librarianService'

const { data: summary } =
    useLiveAsyncData('dashboard-summary', () => librarianService.fetchDashboardSummary(), { lazy: true, pollMs: 60_000 })
const { data: bookStatus } =
    useLiveAsyncData('book-status-overview', () => librarianService.fetchBookStatusOverview(), { lazy: true, pollMs: 60_000 })

/* ---------- chart month (the one place a date control changes what you see) ---------- */
const now = ref(new Date())
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const month = ref(monthKey(new Date()))
const isCurrentMonth = computed(() => month.value === monthKey(now.value))
const monthLabel = computed(() => {
    const [y, m] = month.value.split('-').map(Number)
    return new Date(y!, m! - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

function shiftMonth(delta: number) {
    const [y, m] = month.value.split('-').map(Number)
    const next = new Date(y!, m! - 1 + delta, 1)
    if (monthKey(next) > monthKey(new Date())) return
    month.value = monthKey(next)
}

const { data: overview, pending: overviewPending } = useLiveAsyncData(
    'borrowing-overview',
    () => librarianService.fetchBorrowingOverview(month.value),
    { lazy: true, watch: [month], pollMs: 60_000 },
)

// Same weeks, two stories. Both color pairs pass the dataviz palette validator on white.
const CHART_VIEWS = [
    { label: 'Books', value: 'books' },
    { label: 'Visitors', value: 'visitors' },
]
const chartView = ref<'books' | 'visitors'>('books')

const chart = computed(() => {
    const o = overview.value
    if (chartView.value === 'visitors') {
        return {
            title: 'Library visitors',
            subtitle: 'Entrance scans, and how many different students came, week by week',
            series: [
                { key: 'visits', label: 'Visits', color: '#532c2e', values: o?.visits ?? [] },
                { key: 'visitors', label: 'Different students', color: '#1e423f', values: o?.visitors ?? [], total: o?.visitorsTotal ?? 0, totalNote: 'this month', dashed: true },
            ],
        }
    }
    return {
        title: 'Borrowing & returns',
        subtitle: 'Books checked out and brought back, week by week',
        series: [
            { key: 'borrowed', label: 'Checked out', color: '#532c2e', values: o?.borrowed ?? [] },
            { key: 'returned', label: 'Returned', color: '#1e423f', values: o?.returned ?? [] },
        ],
    }
})

/* ---------- demographics (students by program) ---------- */
const DEMO_SCOPES = [
    { label: 'Members', value: 'members' },
    { label: 'Visitors', value: 'visitors' },
]
const demoScope = ref<DemographicsScope>('members')

const { data: demoMembers } =
    useLiveAsyncData('demographics-members', () => librarianService.fetchDemographics('members'), { lazy: true, pollMs: 60_000 })
const { data: demoVisitors } = useLiveAsyncData(
    'demographics-visitors',
    () => librarianService.fetchDemographics('visitors', month.value),
    { lazy: true, watch: [month], pollMs: 60_000 },
)
const demo = computed(() => (demoScope.value === 'members' ? demoMembers.value : demoVisitors.value))

// Each program keeps its color across both views (see colorProgramSlices).
const demoSlices = computed(() => colorProgramSlices(demo.value?.slices ?? [], demoMembers.value?.slices ?? []))

/* ---------- collection ---------- */
// Copy states: "borrowed" uses the chart's brown so it means one color everywhere.
const collection = computed(() => {
    const b = bookStatus.value?.breakdown
    return [
        { label: 'On the shelf', value: b?.available ?? 0, color: COPY_STATE_COLORS.available },
        { label: 'Borrowed', value: b?.borrowed ?? 0, color: COPY_STATE_COLORS.borrowed },
        { label: 'Damaged', value: b?.maintenance ?? 0, color: COPY_STATE_COLORS.damaged },
        { label: 'Lost or retired', value: b?.inactive ?? 0, color: COPY_STATE_COLORS.lostOrRetired },
    ]
})
const copiesTotal = computed(() => bookStatus.value?.total ?? 0)
</script>
