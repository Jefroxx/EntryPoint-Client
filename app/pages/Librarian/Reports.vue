<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Reports</h1>
            <p class="dashboard-heading mt-1 text-crimson">Review attendance, circulation, overdue records, resource use and member demographics.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" class="mb-5" :tabs="[
            { label: 'Overview', value: 'overview' },
            { label: 'Hall of Fame', value: 'hall-of-fame' },
        ]" />

        <template v-if="activeTab === 'overview'">
        <div class="phone-toolbar mb-5 flex flex-wrap items-center gap-2">
            <select v-model="months"
                class="toolbar-half h-[42px] rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-600 transition-colors hover:bg-stone-50">
                <option :value="3">Last 3 months</option>
                <option :value="6">Last 6 months</option>
                <option :value="12">Last 12 months</option>
            </select>

            <div class="flex-1"></div>

            <ButtonsButton variant="ghost" :disabled="!overview" @click="exportCsv">
                <Icon name="i-tabler-download" class="h-3.5 w-3.5" />Export CSV
            </ButtonsButton>
        </div>

        <div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <LibrarianCatalogStatTile label="Loans this month" :value="overview?.kpis.loansThisMonth ?? '—'"
                icon="i-tabler-book" tone="accent" />
            <LibrarianCatalogStatTile label="Returned on time"
                :value="overview?.kpis.onTimeRate != null ? `${overview.kpis.onTimeRate}%` : '—'"
                icon="i-tabler-circle-check" tone="success" />
            <LibrarianCatalogStatTile label="Avg. visit length"
                :value="overview?.kpis.avgVisitMinutes != null ? `${overview.kpis.avgVisitMinutes}m` : '—'"
                icon="i-tabler-clock" tone="warning" />
            <LibrarianCatalogStatTile label="Fines outstanding"
                :value="overview ? formatPeso(overview.kpis.finesOutstanding) : '—'"
                icon="i-tabler-coin" tone="danger" />
        </div>

        <!-- Trend analytics: this period set beside the same length of time just before it. -->
        <section class="report-card mb-5" aria-label="Trends">
            <header class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                <h2 class="report-title">Trends</h2>
                <span class="text-[12.5px] text-stone-500">Last {{ months }} months compared with the {{ months }} before</span>
            </header>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div v-for="t in trendCards" :key="t.label" class="rounded-xl bg-stone-50 px-3.5 py-3">
                    <p class="text-[12.5px] font-medium text-stone-500">{{ t.label }}</p>
                    <p class="mt-0.5 flex items-baseline gap-2">
                        <b class="text-[22px] font-bold tabular-nums text-stone-900">{{ t.trend ? t.trend.current : '—' }}</b>
                        <span v-if="t.trend" class="flex items-center gap-0.5 text-[13px] font-semibold" :class="t.tone">
                            <Icon :name="t.icon" class="h-3.5 w-3.5" />{{ t.text }}
                        </span>
                    </p>
                    <p class="text-[12.5px] text-stone-500">{{ t.trend ? `${t.trend.previous} before` : '' }}</p>
                </div>
            </div>
        </section>

        <!-- The same analytics as the Dashboard (one shared component, so the two always agree). -->
        <LibrarianDashboardAnalytics class="mb-5" />

        <div class="relative grid grid-cols-1 gap-3 lg:grid-cols-2">
            <section class="report-card lg:col-span-2">
                <header class="mb-3 flex items-center justify-between">
                    <h2 class="report-title">Loans per month</h2>
                    <div class="flex gap-4 text-[12.5px] text-stone-500">
                        <span class="flex items-center gap-1.5"><i class="h-2 w-2 rounded-sm" style="background:#532c2e" />Checked out</span>
                        <span class="flex items-center gap-1.5"><i class="h-2 w-2 rounded-sm" style="background:#1e423f" />Returned</span>
                    </div>
                </header>
                <LibrarianBarChart :labels="overview?.loansPerMonth.labels ?? []" :series="loanSeries"
                    aria-label="Loans checked out and returned per month" />
            </section>

            <section class="report-card">
                <header class="mb-3"><h2 class="report-title">Visits by weekday</h2></header>
                <LibrarianBarChart :labels="overview?.visitsByWeekday.labels ?? []" :series="visitSeries" :height="200"
                    aria-label="Library visits by weekday" />
            </section>

            <section class="report-card">
                <header class="mb-3"><h2 class="report-title">Most borrowed books</h2></header>
                <LibrarianRankedBars ranked :items="topBooks" empty="No loans in this period." />
            </section>

            <section class="report-card lg:col-span-2">
                <header class="mb-3 flex items-center justify-between">
                    <h2 class="report-title">Books by category</h2>
                    <span class="text-[12.5px] text-stone-500">Whole collection</span>
                </header>
                <LibrarianRankedBars :items="categories" empty="No categories yet." />
            </section>

            <!-- Overdue records -->
            <section class="report-card lg:col-span-2" aria-label="Overdue records">
                <header class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                    <h2 class="report-title">Overdue records</h2>
                    <span class="text-[12.5px] text-stone-500">
                        <b class="font-semibold tabular-nums text-stone-800">{{ overview?.overdue.now ?? '—' }}</b> overdue right now
                    </span>
                </header>

                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div v-for="a in overview?.overdue.aging ?? []" :key="a.label" class="rounded-xl bg-stone-50 px-3.5 py-2.5">
                        <b class="block text-[22px] font-bold tabular-nums" :class="a.count ? 'text-stone-900' : 'text-stone-300'">{{ a.count }}</b>
                        <span class="text-[12.5px] text-stone-500">{{ a.label }}</span>
                    </div>
                </div>

                <ul v-if="overview?.overdue.oldest.length" class="mt-4 divide-y divide-stone-100">
                    <li v-for="row in overview.overdue.oldest" :key="`${row.memberID}-${row.title}-${row.dueDate}`"
                        class="flex items-center gap-3 py-2 text-[13.5px]">
                        <span class="min-w-0 flex-1">
                            <span class="block truncate font-medium text-stone-800">{{ row.student }}</span>
                            <span class="block truncate text-[12.5px] text-stone-500">{{ row.title }}</span>
                        </span>
                        <span class="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-[12.5px] font-semibold tabular-nums text-red-700">{{ row.daysOverdue }} days late</span>
                    </li>
                </ul>
                <p v-else class="mt-4 text-[13.5px] text-stone-500">Nothing is overdue.</p>
            </section>

            <!-- Resource utilization -->
            <section class="report-card lg:col-span-2" aria-label="Resource utilization">
                <header class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                    <h2 class="report-title">Resource utilization</h2>
                    <span class="text-[12.5px] text-stone-500">How much of the collection is in use</span>
                </header>
                <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div class="rounded-xl bg-stone-50 px-3.5 py-3">
                        <p class="text-[12.5px] font-medium text-stone-500">Copies out now</p>
                        <p class="mt-0.5 text-[22px] font-bold tabular-nums text-stone-900">{{ utilizationRate }}</p>
                        <p class="text-[12.5px] text-stone-500">{{ overview ? `${overview.utilization.copiesOut} of ${overview.utilization.lendableCopies} lendable copies` : '' }}</p>
                    </div>
                    <div class="rounded-xl bg-stone-50 px-3.5 py-3">
                        <p class="text-[12.5px] font-medium text-stone-500">Titles never borrowed</p>
                        <p class="mt-0.5 text-[22px] font-bold tabular-nums text-stone-900">{{ overview?.utilization.neverBorrowedTitles ?? '—' }}</p>
                        <p class="text-[12.5px] text-stone-500">In the last {{ months }} months</p>
                    </div>
                    <div class="rounded-xl bg-stone-50 px-3.5 py-3">
                        <p class="text-[12.5px] font-medium text-stone-500">Busiest subject</p>
                        <p class="mt-0.5 truncate text-[22px] font-bold text-stone-900">{{ overview?.utilization.bySubject[0]?.name ?? '—' }}</p>
                        <p class="text-[12.5px] text-stone-500">{{ overview?.utilization.bySubject[0] ? `${overview.utilization.bySubject[0].perCopy} loans per copy` : '' }}</p>
                    </div>
                </div>
                <p class="mb-2 text-[12.5px] font-medium text-stone-500">Loans by subject (each subject's copies in brackets)</p>
                <LibrarianRankedBars :items="subjectUse" empty="No loans in this period." />
            </section>

            <LibrarianLoadingOverlay :loading="pending && !overview" />
        </div>
        </template>

        <!-- The same boards as the Dashboard and the student Home page, with full names and ID numbers. -->
        <HallOfFame v-else :board="hallOfFame ?? null" :loading="hallOfFamePending" />
    </div>
</template>

<script setup lang="ts">
import { reportService, type ReportTrend } from '~/services/reportService'
import { librarianService } from '~/services/librarianService'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Reports' })


const route = useRoute()
const activeTab = ref(route.query.tab === 'hall-of-fame' ? 'hall-of-fame' : 'overview')

const months = ref<3 | 6 | 12>(6)

// The server recalculates the boards every 5 minutes at most, so polling faster than that shows nothing new.
const { data: hallOfFame, pending: hallOfFamePending } =
    useLiveAsyncData('reports-hall-of-fame', () => librarianService.fetchHallOfFame(), { lazy: true, pollMs: 300_000 })

const { data: overview, pending } = useAsyncData(
    'reports-overview',
    () => reportService.fetchOverview(months.value),
    { lazy: true, watch: [months] },
)

const loanSeries = computed(() => [
    { name: 'Checked out', color: '#532c2e', values: overview.value?.loansPerMonth.checkedOut ?? [] },
    { name: 'Returned', color: '#1e423f', values: overview.value?.loansPerMonth.returned ?? [] },
])

const visitSeries = computed(() => [
    { name: 'Visits', color: '#532c2e', values: overview.value?.visitsByWeekday.counts ?? [] },
])

const subjectUse = computed(() => (overview.value?.utilization.bySubject ?? [])
    .filter((s) => s.loans > 0)
    .map((s) => ({ label: `${s.name} (${s.copies})`, value: s.loans })))

const utilizationRate = computed(() => overview.value?.utilization.rate != null ? `${overview.value.utilization.rate}%` : '—')

// For loans and visits more is good; for late loans fewer is good, so the colour follows what the change means.
const trendCards = computed(() => {
    const trends = overview.value?.trends
    const card = (label: string, trend: ReportTrend | undefined, upIsGood: boolean) => {
        const change = trend?.change
        const flat = change == null || change === 0
        const good = change != null && (change > 0) === upIsGood
        return {
            label,
            trend,
            icon: flat ? 'i-tabler-minus' : change > 0 ? 'i-tabler-trending-up' : 'i-tabler-trending-down',
            tone: flat ? 'text-stone-500' : good ? 'text-emerald-700' : 'text-red-600',
            text: change == null ? 'no earlier data' : `${change > 0 ? '+' : ''}${change}%`,
        }
    }
    return [
        card('Loans', trends?.loans, true),
        card('Library visits', trends?.visits, true),
        card('Late loans', trends?.late, false),
    ]
})

const topBooks = computed(() => (overview.value?.topBooks ?? []).map((b) => ({ label: b.title, value: b.count })))
const categories = computed(() => (overview.value?.booksByCategory ?? []).map((c) => ({ label: c.name, value: c.count })))

function exportCsv() {
    const data = overview.value
    if (!data) return

    downloadCsv(`library-report-${new Date().toISOString().slice(0, 10)}.csv`, [
        ['Loans per month'],
        ['Month', 'Checked out', 'Returned'],
        ...data.loansPerMonth.labels.map((label, i) => [label, data.loansPerMonth.checkedOut[i] ?? 0, data.loansPerMonth.returned[i] ?? 0]),
        [],
        ['Visits by weekday'],
        ['Day', 'Visits'],
        ...data.visitsByWeekday.labels.map((label, i) => [label, data.visitsByWeekday.counts[i] ?? 0]),
        [],
        ['Most borrowed books'],
        ['Title', 'Loans'],
        ...data.topBooks.map((b) => [b.title, b.count]),
        [],
        ['Books by category'],
        ['Category', 'Books'],
        ...data.booksByCategory.map((c) => [c.name, c.count]),
        [],
        [`Trends (last ${months.value} months vs the ${months.value} before)`],
        ['Measure', 'This period', 'Before', 'Change %'],
        ...(['loans', 'visits', 'late'] as const).map((key) => [
            { loans: 'Loans', visits: 'Library visits', late: 'Late loans' }[key],
            data.trends[key].current, data.trends[key].previous, data.trends[key].change ?? '',
        ]),
        [],
        ['Overdue now, by how late'],
        ['Days late', 'Loans'],
        ...data.overdue.aging.map((a) => [a.label, a.count]),
        [],
        ['Late loans per month (by due date)'],
        ['Month', 'Late loans'],
        ...data.overdue.byMonth.labels.map((label, i) => [label, data.overdue.byMonth.counts[i] ?? 0]),
        [],
        ['Longest overdue'],
        ['Member', 'Member ID', 'Book', 'Due date', 'Days late'],
        ...data.overdue.oldest.map((o) => [o.student, o.memberID ?? '', o.title, o.dueDate, o.daysOverdue]),
        [],
        ['Resource utilization'],
        ['Copies out now', 'Lendable copies', 'Percent out', 'Titles never borrowed'],
        [data.utilization.copiesOut, data.utilization.lendableCopies, data.utilization.rate ?? '', data.utilization.neverBorrowedTitles],
        [],
        ['Subject', 'Loans', 'Lendable copies', 'Loans per copy'],
        ...data.utilization.bySubject.map((s) => [s.name, s.loans, s.copies, s.perCopy]),
    ])
}
</script>

<style scoped>
.report-card {
    border-radius: 1rem;
    border: 1px solid #e7e5e4;
    background: #fff;
    padding: 1.125rem;
}

.report-title {
    font-size: 14px;
    font-weight: 700;
    color: #1c1917;
}
</style>
