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
            :subtitle="demoScope === 'members' ? 'All approved members' : `Different students who visited in ${monthLabel}`"
            :slices="demoSlices" :total="demo?.total ?? 0"
            :empty-text="demoScope === 'members' ? 'No approved members yet.' : `No one visited in ${monthLabel}.`">
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

            <div class="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-stone-100" role="img"
                :aria-label="collection.map((c) => `${c.label} ${c.value}`).join(', ')">
                <span v-for="c in collection.filter((c) => c.value > 0)" :key="c.label" class="h-full first:rounded-l-full last:rounded-r-full"
                    :style="{ width: `${(c.value / Math.max(copiesTotal, 1)) * 100}%`, backgroundColor: c.color }" :title="`${c.label}: ${c.value}`" />
            </div>

            <ul class="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <li v-for="c in collection" :key="c.label">
                    <span class="flex items-center gap-2 text-[13px] text-stone-500">
                        <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: c.color }" />{{ c.label }}
                    </span>
                    <span class="mt-1 block text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums text-stone-900">{{ c.value }}</span>
                    <span class="mt-1 block text-[12px] tabular-nums text-stone-500">{{ copiesTotal ? Math.round((c.value / copiesTotal) * 100) : 0 }}% of copies</span>
                </li>
            </ul>
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
    { lazy: true, watch: [month] },
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
            { key: 'borrowed', label: 'Borrowed', color: '#532c2e', values: o?.borrowed ?? [] },
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
    { lazy: true, watch: [month] },
)
const demo = computed(() => (demoScope.value === 'members' ? demoMembers.value : demoVisitors.value))

// Validated categorical order (brand brown first). "Other" and "Not set" aren't programs, so they
// stay neutral and never use up a program's color.
const PROGRAM_COLORS = ['#532c2e', '#1e423f', '#a97954', '#c29b87', '#839795']
const NEUTRAL: Record<string, string> = { 'Other': '#a8a29e', 'Not set': '#d6d3d1' }

// Color follows the program, not its rank: slots come from the all-members ranking, so BSIT keeps
// its color when you switch to visitors. A program only visitors have takes the next free slot.
const programColors = computed(() => {
    const map = new Map<string, string>()
    for (const slice of demoMembers.value?.slices ?? []) {
        if (!NEUTRAL[slice.label] && map.size < PROGRAM_COLORS.length) map.set(slice.label, PROGRAM_COLORS[map.size]!)
    }
    return map
})

const demoSlices = computed(() => {
    const used = new Set(programColors.value.values())
    const spare = PROGRAM_COLORS.filter((c) => !used.has(c))
    return (demo.value?.slices ?? []).map((slice) => ({
        ...slice,
        color: NEUTRAL[slice.label] ?? programColors.value.get(slice.label) ?? spare.shift() ?? NEUTRAL.Other!,
    }))
})

/* ---------- collection ---------- */
// Copy states: "borrowed" uses the chart's brown so it means one color everywhere.
const collection = computed(() => {
    const b = bookStatus.value?.breakdown
    return [
        { label: 'On the shelf', value: b?.available ?? 0, color: '#059669' },
        { label: 'Borrowed', value: b?.borrowed ?? 0, color: '#532c2e' },
        { label: 'Damaged', value: b?.maintenance ?? 0, color: '#d97706' },
        { label: 'Lost or retired', value: b?.inactive ?? 0, color: '#a8a29e' },
    ]
})
const copiesTotal = computed(() => bookStatus.value?.total ?? 0)
</script>
