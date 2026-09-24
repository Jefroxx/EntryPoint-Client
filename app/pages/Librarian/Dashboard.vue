<template>
    <div class="dash">
        <!-- Greeting: the date is just stated; there's nothing to pick on a live dashboard. -->
        <header class="mb-5">
            <h1 class="dashboard-heading text-3xl font-bold text-amber-900">{{ greeting }}, {{ name }}</h1>
            <p class="mt-1 text-[14.5px] text-stone-500">
                {{ todayLabel }}<template v-if="today">
                    <span class="mx-1.5 text-stone-300">·</span>
                    <span class="text-stone-700"><b class="font-semibold tabular-nums">{{ today.inLibrary }}</b> {{ today.inLibrary === 1 ? 'student is' : 'students are' }} in the library right now</span>
                </template>
            </p>
        </header>

        <!-- Quick actions: attendance leads, the rest are the desk's everyday jobs. -->
        <section aria-label="Quick actions" class="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1fr]">
            <button type="button"
                class="group flex items-center gap-3.5 rounded-2xl p-4 text-left transition-[transform,background-color,box-shadow] duration-150 ease-out active:scale-[.98] sm:col-span-2 xl:col-span-1"
                :class="stationOpen
                    ? 'border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70'
                    : 'bg-accent-500 text-white shadow-[0_8px_20px_-10px_rgba(154,83,35,.7)] hover:bg-accent-600'"
                @click="openAttendanceStation">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    :class="stationOpen ? 'bg-emerald-600 text-white' : 'bg-white/15 text-white'">
                    <Icon :name="stationOpen ? 'i-tabler-scan' : 'i-tabler-player-play'" class="h-5 w-5" />
                </span>
                <span class="min-w-0 flex-1">
                    <span class="flex items-center gap-2 text-[15.5px] font-bold" :class="stationOpen ? 'text-emerald-900' : ''">
                        {{ stationOpen ? 'Attendance is running' : 'Start attendance' }}
                        <span v-if="stationOpen" class="relative flex h-2 w-2">
                            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                            <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                        </span>
                    </span>
                    <span class="block text-[13px]" :class="stationOpen ? 'text-emerald-800/80' : 'text-white/80'">
                        {{ stationOpen ? 'Go to the scan station tab' : 'Opens the camera scanner in its own tab' }}
                    </span>
                </span>
                <Icon :name="stationOpen ? 'i-tabler-external-link' : 'i-tabler-arrow-right'"
                    class="h-4 w-4 shrink-0 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                    :class="stationOpen ? 'text-emerald-700' : 'text-white/80'" />
            </button>

            <NuxtLink v-for="action in actions" :key="action.label" :to="action.to"
                class="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-[transform,border-color,box-shadow] duration-150 ease-out hover:border-accent-200 hover:shadow-card active:scale-[.98]">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 transition-colors duration-150 group-hover:bg-accent-100">
                    <Icon :name="action.icon" class="h-5 w-5" />
                </span>
                <span class="min-w-0 flex-1">
                    <span class="block text-[14.5px] font-semibold text-stone-900">{{ action.label }}</span>
                    <span class="block truncate text-[12.5px] text-stone-500">{{ action.hint }}</span>
                </span>
                <span v-if="action.badge" class="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-600 px-2 text-[12px] font-bold tabular-nums text-white">
                    {{ action.badge }}</span>
            </NuxtLink>
        </section>

        <!-- Today at the desk: one ledger instead of a row of look-alike tiles. -->
        <section aria-labelledby="today-heading" class="mb-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <h2 id="today-heading" class="sr-only">Today</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
                <NuxtLink v-for="cell in ledger" :key="cell.label" :to="cell.to"
                    class="ledger-cell group relative px-5 py-4 transition-colors duration-150 hover:bg-stone-50">
                    <span class="flex items-center gap-1.5 text-[12.5px] font-medium text-stone-500">
                        <Icon :name="cell.icon" class="h-3.5 w-3.5" :class="cell.iconClass" />{{ cell.label }}
                    </span>
                    <span class="mt-1 block text-[28px] font-bold leading-none tracking-[-0.02em] tabular-nums"
                        :class="cell.valueClass">{{ cell.value }}</span>
                    <span class="mt-1.5 block text-[12px] text-stone-400">{{ cell.note }}</span>
                </NuxtLink>
            </div>
        </section>

        <div class="mb-5 grid gap-4 xl:grid-cols-3">
        <LibrarianDemographicsCard title="Students by program"
            :subtitle="demoScope === 'members' ? 'All approved members' : `Different students who visited in ${monthLabel}`"
            :slices="demoSlices" :total="demo?.total ?? 0"
            :empty-text="demoScope === 'members' ? 'No approved members yet.' : `No one visited in ${monthLabel}.`">
            <template #actions>
                <LibrarianMiniToggle v-model="demoScope" label="Which students" :options="DEMO_SCOPES" />
            </template>
        </LibrarianDemographicsCard>

        <!-- Collection health: one stacked bar of every physical copy, by state. -->
        <section aria-labelledby="collection-heading" class="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <div>
                    <h2 id="collection-heading" class="font-bold text-amber-900">Collection</h2>
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
                    <span class="mt-1 block text-[12px] tabular-nums text-stone-400">{{ copiesTotal ? Math.round((c.value / copiesTotal) * 100) : 0 }}% of copies</span>
                </li>
            </ul>
        </section>
        </div>

        <div class="mb-5 grid gap-4 xl:grid-cols-3">
            <div class="relative xl:col-span-2">
                <LibrarianTrendChartCard :title="chart.title" :subtitle="chart.subtitle" :labels="overview?.labels ?? []"
                    :series="chart.series" :class="{ 'opacity-40 transition-opacity': overviewPending }">
                    <template #actions>
                        <div class="flex flex-wrap items-center gap-2">
                        <LibrarianMiniToggle v-model="chartView" label="Chart data" :options="CHART_VIEWS" />
                        <div class="flex items-center gap-1 rounded-xl border border-stone-200 p-0.5" role="group" aria-label="Month">
                            <button type="button" aria-label="Previous month"
                                class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-[transform,background-color] duration-150 ease-out hover:bg-stone-100 hover:text-stone-900 active:scale-90"
                                @click="shiftMonth(-1)">
                                <Icon name="i-tabler-chevron-left" class="h-4 w-4" />
                            </button>
                            <span class="min-w-[118px] text-center text-[13.5px] font-semibold tabular-nums text-stone-800" aria-live="polite">{{ monthLabel }}</span>
                            <button type="button" aria-label="Next month" :disabled="isCurrentMonth"
                                class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-[transform,background-color] duration-150 ease-out hover:bg-stone-100 hover:text-stone-900 active:scale-90 disabled:pointer-events-none disabled:opacity-30"
                                @click="shiftMonth(1)">
                                <Icon name="i-tabler-chevron-right" class="h-4 w-4" />
                            </button>
                        </div>
                        </div>
                    </template>
                </LibrarianTrendChartCard>
                <LibrarianLoadingOverlay :loading="overviewPending" />
            </div>

            <!-- Needs your attention: every queue that is waiting on a librarian, linked to where it's handled. -->
            <section aria-labelledby="attention-heading" class="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div class="mb-3 flex items-center justify-between gap-2">
                    <h2 id="attention-heading" class="font-bold text-amber-900">Needs your attention</h2>
                    <span v-if="attentionTotal" class="rounded-full bg-amber-100 px-2.5 py-0.5 text-[12.5px] font-bold tabular-nums text-amber-800">{{ attentionTotal }}</span>
                </div>

                <p v-if="!today" class="py-8 text-center text-[14px] text-stone-400">Loading…</p>

                <div v-else-if="!attentionRows.length" class="flex flex-1 flex-col items-center justify-center py-8 text-center">
                    <span class="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Icon name="i-tabler-check" class="h-5 w-5" />
                    </span>
                    <p class="text-[15px] font-semibold text-stone-800">All caught up</p>
                    <p class="text-[13px] text-stone-500">Nothing is waiting on a librarian.</p>
                </div>

                <ul v-else class="-mx-2 grid gap-0.5">
                    <li v-for="row in attentionRows" :key="row.label">
                        <NuxtLink :to="row.to"
                            class="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-150 hover:bg-stone-50">
                            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" :class="row.chip">
                                <Icon :name="row.icon" class="h-[18px] w-[18px]" />
                            </span>
                            <span class="min-w-0 flex-1">
                                <span class="block text-[14px] font-semibold text-stone-800">{{ row.label }}</span>
                                <span class="block truncate text-[12.5px] text-stone-500">{{ row.hint }}</span>
                            </span>
                            <span class="text-[17px] font-bold tabular-nums text-stone-900">{{ row.count }}</span>
                            <Icon name="i-tabler-chevron-right" class="h-4 w-4 text-stone-300 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-stone-500" />
                        </NuxtLink>
                    </li>
                </ul>
            </section>
        </div>

        <div class="grid gap-4 xl:grid-cols-3">
            <div class="relative xl:col-span-2">
                <LibrarianRecentLoansCard :loans="recentLoans ?? []" :class="{ 'opacity-40 transition-opacity': recentLoansPending }" />
                <LibrarianLoadingOverlay :loading="recentLoansPending" />
            </div>
            <div class="relative">
                <LibrarianOverdueBooksCard :loans="overdueLoans ?? []" :class="{ 'opacity-40 transition-opacity': overdueLoansPending }" />
                <LibrarianLoadingOverlay :loading="overdueLoansPending" />
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { librarianService, type DemographicsScope } from '~/services/librarianService'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Dashboard' })

const { firstName } = useAuthSession()
const name = computed(() => firstName.value?.trim() || 'Librarian')

/* ---------- clock-driven text ---------- */
const now = ref(new Date())
let clockTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => { clockTimer = setInterval(() => { now.value = new Date() }, 60_000) })
onUnmounted(() => clearInterval(clockTimer))

const greeting = computed(() => {
    const hour = now.value.getHours()
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})
const todayLabel = computed(() => now.value.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))

/* ---------- data ---------- */
const { data: today, execute: refetchToday } =
    useLiveAsyncData('dashboard-today', () => librarianService.fetchDashboardToday(), { lazy: true })
const { data: summary } =
    useLiveAsyncData('dashboard-summary', () => librarianService.fetchDashboardSummary(), { lazy: true, pollMs: 60_000 })
const { data: bookStatus } =
    useLiveAsyncData('book-status-overview', () => librarianService.fetchBookStatusOverview(), { lazy: true, pollMs: 60_000 })
const { data: recentLoans, pending: recentLoansPending } =
    useLiveAsyncData('recent-loans', () => librarianService.fetchRecentLoans(), { lazy: true })
const { data: overdueLoans, pending: overdueLoansPending } =
    useLiveAsyncData('overdue-loans', () => librarianService.fetchOverdueLoans(), { lazy: true })

/* ---------- chart month (the one place a date control changes what you see) ---------- */
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
                { key: 'visits', label: 'Visits', color: '#7a5af0', values: o?.visits ?? [] },
                { key: 'visitors', label: 'Different students', color: '#0f8f6a', values: o?.visitors ?? [], total: o?.visitorsTotal ?? 0, totalNote: 'this month', dashed: true },
            ],
        }
    }
    return {
        title: 'Borrowing & returns',
        subtitle: 'Books checked out and brought back, week by week',
        series: [
            { key: 'borrowed', label: 'Borrowed', color: '#9a5323', values: o?.borrowed ?? [] },
            { key: 'returned', label: 'Returned', color: '#1c8aa8', values: o?.returned ?? [] },
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
const PROGRAM_COLORS = ['#9a5323', '#2a78d6', '#1baf7a', '#eda100', '#e87ba4']
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

/* ---------- attendance station ---------- */
const stationOpen = ref(false)
const { post } = useStationChannel((message) => {
    if (message.type === 'open') stationOpen.value = true
    else if (message.type === 'closed') stationOpen.value = false
    else if (message.type === 'scanned') void refetchToday()
})
onMounted(() => post({ type: 'ping' }))

/* ---------- quick actions ---------- */
const actions = computed(() => [
    { label: 'Check out a book', hint: 'Lend a copy to a student', icon: 'i-tabler-book-upload', to: '/librarian/circulation?new=checkout', badge: 0 },
    { label: 'Add a book', hint: 'Catalog a new title', icon: 'i-tabler-book-2', to: '/librarian/library?new=book', badge: 0 },
    {
        label: 'Approve students', hint: today.value?.attention.registrations ? 'Registrations are waiting' : 'No one waiting',
        icon: 'i-tabler-user-check', to: '/librarian/students?tab=pending', badge: today.value?.attention.registrations ?? 0,
    },
])

/* ---------- today ledger ---------- */
const n = (value: number | undefined) => (value ?? '—')

const ledger = computed(() => {
    const t = today.value
    const overdue = t?.overdue ?? 0
    const dueToday = t?.dueToday ?? 0
    return [
        { label: 'In the library', value: n(t?.inLibrary), note: 'checked in, not out yet', icon: 'i-tabler-door-enter', iconClass: 'text-emerald-600', valueClass: 'text-stone-900', to: '/librarian/attendance' },
        { label: 'Visits today', value: n(t?.visitsToday), note: 'scans at the entrance', icon: 'i-tabler-user-check', iconClass: 'text-stone-400', valueClass: 'text-stone-900', to: '/librarian/attendance' },
        { label: 'Checked out', value: n(t?.checkedOut), note: 'loans started today', icon: 'i-tabler-book-upload', iconClass: 'text-stone-400', valueClass: 'text-stone-900', to: '/librarian/circulation' },
        { label: 'Returned', value: n(t?.returned), note: 'books back today', icon: 'i-tabler-book-download', iconClass: 'text-stone-400', valueClass: 'text-stone-900', to: '/librarian/circulation' },
        {
            label: 'Due today', value: n(t?.dueToday), note: dueToday ? 'still out, due before closing' : 'nothing due later today',
            icon: 'i-tabler-clock', iconClass: dueToday ? 'text-amber-600' : 'text-stone-400', valueClass: dueToday ? 'text-amber-700' : 'text-stone-900', to: '/librarian/circulation',
        },
        {
            label: 'Overdue', value: n(t?.overdue), note: overdue ? 'past their due date' : 'all loans on time',
            icon: 'i-tabler-alert-triangle', iconClass: overdue ? 'text-red-600' : 'text-stone-400', valueClass: overdue ? 'text-red-600' : 'text-stone-900', to: '/librarian/circulation',
        },
    ]
})

/* ---------- needs your attention ---------- */
const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

const attentionRows = computed(() => {
    const a = today.value?.attention
    if (!a) return []
    const plural = (count: number, one: string, many: string) => (count === 1 ? one : many)
    return [
        { count: a.registrations, label: 'Registrations', hint: plural(a.registrations, 'Email confirmed, waiting for approval', 'Emails confirmed, waiting for approval'), icon: 'i-tabler-user-plus', chip: 'bg-accent-50 text-accent-600', to: '/librarian/students?tab=pending' },
        { count: a.selfReturns, label: 'Self-return reports', hint: 'Check the book is back on the shelf', icon: 'i-tabler-arrow-back-up', chip: 'bg-accent-50 text-accent-600', to: '/librarian/circulation?tab=selfreturn' },
        { count: a.reservations, label: 'Reservations', hint: 'Waiting to be accepted', icon: 'i-tabler-bookmark', chip: 'bg-accent-50 text-accent-600', to: '/librarian/circulation?tab=reservations' },
        { count: a.bookRequests, label: 'Book requests', hint: 'Students asking for new titles', icon: 'i-tabler-bulb', chip: 'bg-accent-50 text-accent-600', to: '/librarian/library?tab=requests' },
        { count: a.redemptions, label: 'Rewards to hand out', hint: 'Point Shop redemptions', icon: 'i-tabler-gift', chip: 'bg-accent-50 text-accent-600', to: '/librarian/engagement?tab=redemptions' },
        { count: a.unpaidFines, label: 'Unpaid fines', hint: `${peso.format(a.unpaidTotal)} outstanding`, icon: 'i-tabler-coin', chip: 'bg-red-50 text-red-600', to: '/librarian/circulation?tab=penalties' },
    ].filter((row) => row.count > 0)
})

// Fines are a running balance rather than a job to clear today, so they don't add to the badge.
const attentionTotal = computed(() => attentionRows.value.filter((r) => r.label !== 'Unpaid fines').reduce((s, r) => s + r.count, 0))

/* ---------- collection ---------- */
// Copy states: "borrowed" uses the chart's brown so it means one color everywhere on the page.
const collection = computed(() => {
    const b = bookStatus.value?.breakdown
    return [
        { label: 'On the shelf', value: b?.available ?? 0, color: '#059669' },
        { label: 'Borrowed', value: b?.borrowed ?? 0, color: '#9a5323' },
        { label: 'Damaged', value: b?.maintenance ?? 0, color: '#d97706' },
        { label: 'Lost or retired', value: b?.inactive ?? 0, color: '#a8a29e' },
    ]
})
const copiesTotal = computed(() => bookStatus.value?.total ?? 0)
</script>

<style scoped>
/* Ledger dividers: a hairline between cells that follows the grid at every width. */
.ledger-cell {
    box-shadow: inset -1px 0 0 #f0ebe4, inset 0 -1px 0 #f0ebe4;
}

/* One entrance for the page: sections rise in order, once. */
.dash > * {
    animation: dashIn 420ms cubic-bezier(.22, 1, .36, 1) both;
}

.dash > *:nth-child(2) { animation-delay: 40ms; }
.dash > *:nth-child(3) { animation-delay: 80ms; }
.dash > *:nth-child(4) { animation-delay: 120ms; }
.dash > *:nth-child(5) { animation-delay: 160ms; }
.dash > *:nth-child(6) { animation-delay: 200ms; }

@keyframes dashIn {
    from {
        opacity: 0;
        transform: translateY(6px);
    }
}

@media (prefers-reduced-motion: reduce) {
    .dash > * {
        animation: none;
    }
}
</style>
