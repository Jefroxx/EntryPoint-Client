<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Reports</h1>
            <p class="dashboard-heading mt-1 text-amber-900">Review circulation, attendance and collection trends.</p>
        </div>

        <div class="mb-5 flex flex-wrap items-center gap-2">
            <select v-model="months"
                class="h-[38px] rounded-xl border border-stone-200 bg-white px-3 text-[13px] text-stone-600 transition-colors hover:bg-stone-50">
                <option :value="3">Last 3 months</option>
                <option :value="6">Last 6 months</option>
                <option :value="12">Last 12 months</option>
            </select>

            <div class="flex-1"></div>

            <ButtonsButton variant="ghost" :disabled="!overview" @click="exportCsv">
                <Icon name="i-lucide-download" class="h-3.5 w-3.5" />Export CSV
            </ButtonsButton>
        </div>

        <div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <LibrarianCatalogStatTile label="Loans this month" :value="overview?.kpis.loansThisMonth ?? '—'"
                icon="i-lucide-book-open" tone="accent" />
            <LibrarianCatalogStatTile label="Returned on time"
                :value="overview?.kpis.onTimeRate != null ? `${overview.kpis.onTimeRate}%` : '—'"
                icon="i-lucide-circle-check" tone="success" />
            <LibrarianCatalogStatTile label="Avg. visit length"
                :value="overview?.kpis.avgVisitMinutes != null ? `${overview.kpis.avgVisitMinutes}m` : '—'"
                icon="i-lucide-clock" tone="warning" />
            <LibrarianCatalogStatTile label="Fines outstanding"
                :value="overview ? formatPeso(overview.kpis.finesOutstanding) : '—'"
                icon="i-lucide-circle-dollar-sign" tone="danger" />
        </div>

        <div class="relative grid grid-cols-1 gap-3 lg:grid-cols-2">
            <section class="report-card lg:col-span-2">
                <header class="mb-3 flex items-center justify-between">
                    <h2 class="report-title">Loans per month</h2>
                    <div class="flex gap-4 text-[11.5px] text-stone-500">
                        <span class="flex items-center gap-1.5"><i class="h-2 w-2 rounded-sm" style="background:#9a5323" />Checked out</span>
                        <span class="flex items-center gap-1.5"><i class="h-2 w-2 rounded-sm" style="background:#d9b48a" />Returned</span>
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
                    <span class="text-[11.5px] text-stone-400">Whole collection</span>
                </header>
                <LibrarianRankedBars :items="categories" empty="No categories yet." />
            </section>

            <LibrarianLoadingOverlay :loading="pending && !overview" />
        </div>
    
    </div>
</template>

<script setup lang="ts">
import { reportService } from '~/services/reportService'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})


const months = ref<3 | 6 | 12>(6)

const { data: overview, pending } = useAsyncData(
    'reports-overview',
    () => reportService.fetchOverview(months.value),
    { lazy: true, watch: [months] },
)

const loanSeries = computed(() => [
    { name: 'Checked out', color: '#9a5323', values: overview.value?.loansPerMonth.checkedOut ?? [] },
    { name: 'Returned', color: '#d9b48a', values: overview.value?.loansPerMonth.returned ?? [] },
])

const visitSeries = computed(() => [
    { name: 'Visits', color: '#9a5323', values: overview.value?.visitsByWeekday.counts ?? [] },
])

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
