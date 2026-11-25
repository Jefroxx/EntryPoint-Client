<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Reports</h1>
            <p class="dashboard-heading mt-1 text-crimson">Review attendance, circulation, overdue records, computers and rooms, fines, reservations and rewards.</p>
        </div>

        <!-- One period for the whole page: everything below is for these days, except where it says otherwise. -->
        <div class="phone-toolbar mb-5 flex flex-wrap items-center gap-2">
            <!-- A dropdown you pick from (a native select: nothing can be typed into it). -->
            <label class="flex items-center gap-2 text-[13.5px] font-semibold text-stone-600">Period
                <select v-model="period" aria-label="Report period"
                    class="h-[42px] cursor-pointer rounded-xl border border-accent-300 bg-white px-3 text-[14.5px] font-normal text-stone-800 outline-none focus:ring-2 focus:ring-accent-200">
                    <option v-for="p in PERIODS" :key="p.value" :value="p.value">{{ p.label }}</option>
                </select>
            </label>

            <div v-if="period === 'custom'" class="toolbar-full flex flex-wrap items-center gap-x-4 gap-y-2">
                <label class="flex items-center gap-2 text-[13.5px] font-semibold text-stone-600">From
                    <input v-model="from" type="date" :max="to"
                        class="h-[42px] rounded-xl border border-accent-300 bg-white px-3 text-[14.5px] font-normal text-stone-800 outline-none focus:ring-2 focus:ring-accent-200" />
                </label>
                <label class="flex items-center gap-2 text-[13.5px] font-semibold text-stone-600">To
                    <input v-model="to" type="date" :min="from" :max="todayYmd"
                        class="h-[42px] rounded-xl border border-accent-300 bg-white px-3 text-[14.5px] font-normal text-stone-800 outline-none focus:ring-2 focus:ring-accent-200" />
                </label>
            </div>

            <div class="flex-1"></div>

            <ButtonsButton variant="ghost" class="toolbar-full" :disabled="!overview" @click="exportCsv">
                <Icon name="i-tabler-download" class="h-3.5 w-3.5" />Export CSV
            </ButtonsButton>
        </div>

        <!-- The page dims while a new period loads, so the old numbers are never mistaken for the new ones. -->
        <div class="relative" :class="pending && overview ? 'opacity-50 transition-opacity' : 'transition-opacity'" :aria-busy="pending">
        <div class="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <LibrarianCatalogStatTile label="Loans this month" :hint="monthLabel" :value="overview?.kpis.loansThisMonth ?? '—'"
                icon="i-tabler-book" tone="accent" />
            <LibrarianCatalogStatTile label="Returned on time" :hint="periodLabel"
                :value="overview?.kpis.onTimeRate != null ? `${overview.kpis.onTimeRate}%` : '—'"
                icon="i-tabler-circle-check" tone="success" />
            <LibrarianCatalogStatTile label="Avg. visit length" :hint="periodLabel"
                :value="overview?.kpis.avgVisitMinutes != null ? formatMinutes(overview.kpis.avgVisitMinutes) : '—'"
                icon="i-tabler-clock" tone="warning" />
            <LibrarianCatalogStatTile label="Unpaid fines" hint="All time"
                :value="overview ? formatPeso(overview.kpis.finesOutstanding) : '—'"
                icon="i-tabler-coin" tone="danger" />
        </div>

        <!-- Trend analytics: this period set beside the same length of time just before it. -->
        <section class="report-card mb-5" aria-label="Trends">
            <header class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                <h2 class="report-title">Trends</h2>
                <span class="text-[12.5px] text-stone-500">{{ periodLabel }}, compared with the same length of time before it</span>
            </header>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div v-for="t in trendCards" :key="t.label" class="rounded-xl bg-stone-50 px-3.5 py-3">
                    <p class="text-[12.5px] font-medium text-stone-500">{{ t.label }}</p>
                    <p class="mt-0.5 flex items-baseline gap-2">
                        <b class="text-[22px] font-bold tabular-nums text-stone-900">{{ t.trend ? t.trend.current : '—' }}</b>
                        <span v-if="t.trend && t.hasEarlier" class="flex items-center gap-0.5 text-[13px] font-semibold" :class="t.tone">
                            <Icon :name="t.icon" class="h-3.5 w-3.5" />{{ t.text }}
                        </span>
                    </p>
                    <!-- With nothing earlier there is nothing to compare against, so it says that instead of "0 before". -->
                    <p class="text-[12.5px] text-stone-500">{{ !t.trend ? '' : t.hasEarlier ? `${t.trend.previous} before` : 'Nothing earlier to compare with' }}</p>
                </div>
            </div>
        </section>

        <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <section class="report-card lg:col-span-2">
                <header class="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
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
                <header class="mb-3 flex items-baseline justify-between gap-2">
                    <h2 class="report-title">Visits by weekday</h2>
                    <span class="text-[12.5px] text-stone-500">{{ periodLabel }}</span>
                </header>
                <LibrarianBarChart :labels="overview?.visitsByWeekday.labels ?? []" :series="visitSeries" :height="200"
                    aria-label="Library visits by weekday" />
            </section>

            <section class="report-card">
                <header class="mb-3 flex items-baseline justify-between gap-2">
                    <h2 class="report-title">Most borrowed books</h2>
                    <span class="text-[12.5px] text-stone-500">{{ periodLabel }}</span>
                </header>
                <LibrarianRankedBars ranked :items="topBooks" empty="No loans in this period." />
            </section>

            <!-- Students by program: everyone approved, or just those who came in the period. -->
            <LibrarianDemographicsCard title="Students by program" :subtitle="demoSubtitle" :slices="demoSlices" :total="demo?.total ?? 0"
                :empty-text="demoScope === 'members' ? 'No approved students yet.' : 'No one visited in this period.'">
                <template #actions>
                    <LibrarianMiniToggle v-model="demoScope" label="Which students" :options="DEMO_SCOPES" />
                </template>
            </LibrarianDemographicsCard>

            <section class="report-card">
                <header class="mb-3 flex items-baseline justify-between gap-2">
                    <h2 class="report-title">Books by category</h2>
                    <span class="text-[12.5px] text-stone-500">Every title the library owns, grouped by category</span>
                </header>
                <LibrarianRankedBars :items="shownCategories" empty="No categories yet." />
                <button v-if="categories.length > CATEGORIES_SHOWN" type="button"
                    class="mt-3 text-[13.5px] font-semibold text-accent-600 hover:underline" @click="showAllCategories = !showAllCategories">
                    {{ showAllCategories ? 'Show fewer' : `Show all ${categories.length} categories` }}
                </button>
            </section>

            <!-- Collection health: every physical copy, by where it is now. -->
            <section class="report-card lg:col-span-2" aria-label="Collection">
                <header class="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 class="report-title">Collection</h2>
                    <span class="text-[12.5px] text-stone-500">Every physical copy, by where it is now · {{ overview?.collection.total ?? '—' }} copies</span>
                </header>
                <p class="mb-3 text-[13px] leading-snug text-stone-500">
                    The "collection" is everything the library owns. One title can have several copies, and each copy is counted once here, so this is a count of
                    copies, not titles. It is a snapshot of today and does not change with the period above. "Damaged" copies are out for repair; "Lost or retired"
                    copies can no longer be lent.
                </p>
                <LibrarianCollectionBar :items="collectionItems" :total="overview?.collection.total ?? 0" />
            </section>

            <!-- Overdue records -->
            <section class="report-card lg:col-span-2" aria-label="Overdue records">
                <header class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                    <h2 class="report-title">Overdue records</h2>
                    <span class="text-[12.5px] text-stone-500">
                        <b class="font-semibold tabular-nums text-stone-800">{{ overview?.overdue.now ?? '—' }}</b> overdue right now
                        <NuxtLink v-if="overview?.overdue.now" to="/librarian/circulation?tab=loans&status=overdue" class="ml-2 font-semibold text-accent-600 hover:underline">See them all</NuxtLink>
                    </span>
                </header>

                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div v-for="a in overview?.overdue.aging ?? []" :key="a.label" class="rounded-xl bg-stone-50 px-3.5 py-2.5">
                        <b class="block text-[22px] font-bold tabular-nums" :class="a.count ? 'text-stone-900' : 'text-stone-300'">{{ a.count }}</b>
                        <span class="text-[12.5px] text-stone-500">{{ a.label }}</span>
                    </div>
                </div>

                <ul v-if="overview?.overdue.oldest.length" class="mt-4 divide-y divide-stone-100">
                    <li v-for="row in overview.overdue.oldest" :key="`${row.memberID}-${row.title}-${row.dueDate}`">
                        <!-- Each opens Circulation on the overdue loans, where it can be returned or fined. -->
                        <NuxtLink to="/librarian/circulation?tab=loans&status=overdue" class="flex items-center gap-3 rounded-lg py-2 text-[13.5px] transition-colors hover:bg-stone-50">
                            <span class="min-w-0 flex-1">
                                <span class="block truncate font-medium text-stone-800">{{ row.student }}</span>
                                <span class="block truncate text-[12.5px] text-stone-500">{{ row.title }}</span>
                            </span>
                            <span class="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-[12.5px] font-semibold tabular-nums text-red-700">{{ row.daysOverdue }} days overdue</span>
                        </NuxtLink>
                    </li>
                </ul>
                <p v-else class="mt-4 text-[13.5px] text-stone-500">Nothing is overdue.</p>
            </section>

            <!-- Collection use (how hard the books are working) -->
            <section class="report-card lg:col-span-2" aria-label="Collection use">
                <header class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                    <h2 class="report-title">Collection use</h2>
                    <span class="text-[12.5px] text-stone-500">How hard the books are working · loans in the period above, against today's collection</span>
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
                        <p class="text-[12.5px] text-stone-500">{{ periodLabel }}</p>
                    </div>
                    <div class="rounded-xl bg-stone-50 px-3.5 py-3">
                        <p class="text-[12.5px] font-medium text-stone-500">Busiest subject</p>
                        <p class="mt-0.5 line-clamp-2 text-[22px] font-bold leading-tight text-stone-900">{{ busiestSubject?.name ?? '—' }}</p>
                        <p class="text-[12.5px] text-stone-500">{{ busiestSubject ? `${busiestSubject.perCopy} loans per copy` : '' }}</p>
                    </div>
                </div>
                <p class="mb-2 text-[12.5px] font-medium text-stone-500">Loans by subject, most borrowed first</p>
                <!-- Column headings so each number says what it is; a line under every row, as in Overdue records. -->
                <div v-if="subjectUse.length" class="flex items-center gap-3 border-b border-stone-200 pb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-stone-400">
                    <span class="min-w-0 flex-1">Subject</span>
                    <span class="hidden w-24 shrink-0 sm:block sm:w-40"></span>
                    <span class="w-16 shrink-0 text-right">Copies</span>
                    <span class="w-16 shrink-0 text-right">Loans</span>
                </div>
                <ul v-if="subjectUse.length" class="divide-y divide-stone-100">
                    <li v-for="s in subjectUse" :key="s.name" class="flex items-center gap-3 py-2.5 text-[14px]">
                        <span class="line-clamp-2 min-w-0 flex-1 break-words font-medium leading-snug text-stone-800" :title="s.name">{{ s.name }}</span>
                        <span class="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-stone-100 sm:block sm:w-40" aria-hidden="true">
                            <span class="block h-full rounded-full bg-accent-500" :style="{ width: `${subjectMax ? (s.loans / subjectMax) * 100 : 0}%` }" />
                        </span>
                        <span class="w-16 shrink-0 text-right tabular-nums text-stone-500" :title="`${s.name} has ${s.copies} ${s.copies === 1 ? 'copy' : 'copies'} in the library`">{{ s.copies }}</span>
                        <span class="w-16 shrink-0 text-right font-bold tabular-nums text-stone-900" :title="`${s.loans} ${s.loans === 1 ? 'loan' : 'loans'} ${periodPhrase}`">{{ s.loans }}</span>
                    </li>
                </ul>
                <p v-else class="py-6 text-center text-[15px] text-stone-500">No loans in this period.</p>
            </section>

            <!-- Computers, rooms and the like -->
            <section class="report-card" aria-label="Computers and rooms">
                <header class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                    <h2 class="report-title">Computers and rooms</h2>
                    <span class="text-[12.5px] text-stone-500">{{ periodLabel }}</span>
                </header>
                <div class="mb-4 grid grid-cols-2 gap-3">
                    <div class="rounded-xl bg-stone-50 px-3.5 py-3">
                        <p class="text-[12.5px] font-medium text-stone-500">Sessions</p>
                        <p class="mt-0.5 text-[22px] font-bold tabular-nums text-stone-900">{{ overview?.resources.sessions ?? '—' }}</p>
                    </div>
                    <div class="rounded-xl bg-stone-50 px-3.5 py-3">
                        <p class="text-[12.5px] font-medium text-stone-500">Time in use</p>
                        <p class="mt-0.5 text-[22px] font-bold tabular-nums text-stone-900">{{ overview ? formatMinutes(overview.resources.minutes) : '—' }}</p>
                    </div>
                </div>
                <LibrarianRankedBars :items="resourceUse" empty="No computer or room sessions in this period." />
            </section>

            <!-- Reservations -->
            <section class="report-card" aria-label="Reservations">
                <header class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                    <h2 class="report-title">Reservations</h2>
                    <span class="text-[12.5px] text-stone-500">Made {{ periodPhrase }}</span>
                </header>
                <div class="mb-4 rounded-xl bg-stone-50 px-3.5 py-3">
                    <p class="text-[12.5px] font-medium text-stone-500">Reserved</p>
                    <p class="mt-0.5 text-[22px] font-bold tabular-nums text-stone-900">{{ overview?.reservations.total ?? '—' }}</p>
                </div>
                <p class="mb-2 text-[12.5px] font-medium text-stone-500">Where they stand now</p>
                <LibrarianRankedBars :items="reservationStatuses" empty="No reservations in this period." />
            </section>

            <!-- Fines -->
            <section class="report-card" aria-label="Fines">
                <header class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                    <h2 class="report-title">Fines</h2>
                    <span class="text-[12.5px] text-stone-500">Late, lost and damaged</span>
                </header>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    <div class="rounded-xl bg-stone-50 px-3.5 py-3">
                        <p class="text-[12.5px] font-medium text-stone-500">Collected</p>
                        <p class="mt-0.5 text-[20px] font-bold tabular-nums text-stone-900">{{ overview ? formatPeso(overview.fines.collected) : '—' }}</p>
                        <p class="text-[12.5px] text-stone-500">{{ overview ? `${overview.fines.collectedCount} paid` : '' }}</p>
                    </div>
                    <div class="rounded-xl bg-stone-50 px-3.5 py-3">
                        <p class="text-[12.5px] font-medium text-stone-500">Waived</p>
                        <p class="mt-0.5 text-[20px] font-bold tabular-nums text-stone-900">{{ overview ? formatPeso(overview.fines.waived) : '—' }}</p>
                        <p class="text-[12.5px] text-stone-500">{{ overview ? `${overview.fines.waivedCount} forgiven` : '' }}</p>
                    </div>
                    <div class="rounded-xl bg-stone-50 px-3.5 py-3">
                        <p class="text-[12.5px] font-medium text-stone-500">Still owed</p>
                        <p class="mt-0.5 text-[20px] font-bold tabular-nums text-stone-900">{{ overview ? formatPeso(overview.fines.outstanding) : '—' }}</p>
                        <p class="text-[12.5px] text-stone-500">{{ overview ? `${overview.fines.outstandingCount} unpaid` : '' }}</p>
                    </div>
                </div>
                <p class="mt-3 text-[12.5px] text-stone-500">Collected and waived count fines settled {{ periodPhrase }}. Still owed is every unpaid fine, whenever it was issued.</p>
            </section>

            <!-- Rewards -->
            <section class="report-card" aria-label="Rewards">
                <header class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                    <h2 class="report-title">Rewards</h2>
                    <span class="text-[12.5px] text-stone-500">{{ periodLabel }}</span>
                </header>
                <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-xl bg-stone-50 px-3.5 py-3">
                        <p class="text-[12.5px] font-medium text-stone-500">Redemptions</p>
                        <p class="mt-0.5 text-[22px] font-bold tabular-nums text-stone-900">{{ overview?.rewards.redemptions ?? '—' }}</p>
                        <p class="text-[12.5px] text-stone-500">{{ overview ? `${overview.rewards.pending} still pending` : '' }}</p>
                    </div>
                    <div class="rounded-xl bg-stone-50 px-3.5 py-3">
                        <p class="text-[12.5px] font-medium text-stone-500">Points spent</p>
                        <p class="mt-0.5 text-[22px] font-bold tabular-nums text-stone-900">{{ overview?.rewards.pointsSpent ?? '—' }}</p>
                        <p class="text-[12.5px] text-stone-500">{{ overview ? `${overview.rewards.cancelled} cancelled, refunded` : '' }}</p>
                    </div>
                </div>
            </section>
        </div>
        <LibrarianLoadingOverlay :loading="pending" />
        </div>

        <AlertToast />
    </div>
</template>

<script setup lang="ts">
import { reportService, type ReportTrend } from '~/services/reportService'
import { useAlert } from '~/api/alert/useAlert'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Reports' })

const route = useRoute()
const alert = useAlert()

// The Hall of Fame lives under Engagement now; an old link to it lands there.
onMounted(() => {
    if (route.query.tab === 'hall-of-fame') void navigateTo({ path: '/librarian/engagement', query: { tab: 'hall-of-fame' } }, { replace: true })
})

/* ---------- the period (one, for the whole page) ---------- */
const PERIODS = [
    { label: 'Last 3 months', short: '3 mo', value: '3' },
    { label: 'Last 6 months', short: '6 mo', value: '6' },
    { label: 'Last 12 months', short: '12 mo', value: '12' },
    { label: 'Custom range', short: 'Custom', value: 'custom' },
]
const period = ref<'3' | '6' | '12' | 'custom'>('6')

const todayYmd = toYmd()
// A custom range starts as the last 30 days, and its two ends never cross.
const from = ref(toYmd(new Date(Date.now() - 29 * 86_400_000)))
const to = ref(todayYmd)
watch(from, (value) => { if (value && to.value && value > to.value) to.value = value })
watch(to, (value) => {
    if (value > todayYmd) to.value = todayYmd
    else if (value && from.value && value < from.value) from.value = value
})

const params = computed(() => period.value === 'custom' && from.value && to.value
    ? { from: from.value, to: to.value }
    : { months: (period.value === 'custom' ? 6 : Number(period.value)) as 3 | 6 | 12 })

const periodLabel = computed(() => period.value === 'custom' && from.value && to.value
    ? (from.value === to.value ? formatDate(from.value) : `${formatDate(from.value)} to ${formatDate(to.value)}`)
    : `Last ${period.value === 'custom' ? 6 : period.value} months`)
// The same period inside a sentence: "in the last 6 months", "from Oct 27, 2026 to Nov 25, 2026".
const periodPhrase = computed(() => period.value === 'custom' && from.value && to.value
    ? (from.value === to.value ? `on ${formatDate(from.value)}` : `from ${formatDate(from.value)} to ${formatDate(to.value)}`)
    : `in the last ${period.value === 'custom' ? 6 : period.value} months`)
const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

const { data: overview, pending } = useAsyncData(
    'reports-overview',
    () => reportService.fetchOverview(params.value),
    { lazy: true, watch: [params] },
)

/* ---------- charts and lists ---------- */
const loanSeries = computed(() => [
    { name: 'Checked out', color: '#532c2e', values: overview.value?.loansPerMonth.checkedOut ?? [] },
    { name: 'Returned', color: '#1e423f', values: overview.value?.loansPerMonth.returned ?? [] },
])

const visitSeries = computed(() => [
    { name: 'Visits', color: '#532c2e', values: overview.value?.visitsByWeekday.counts ?? [] },
])

// Loans by subject, the most-borrowed first, so the bars read in order. (The busiest by loans per copy is its own figure.)
const subjectUse = computed(() => (overview.value?.utilization.bySubject ?? [])
    .filter((s) => s.loans > 0)
    .sort((a, b) => b.loans - a.loans)
    .slice(0, 8)
    .map((s) => ({ name: s.name, copies: s.copies, loans: s.loans })))
const subjectMax = computed(() => Math.max(0, ...subjectUse.value.map((s) => s.loans)))
const busiestSubject = computed(() => (overview.value?.utilization.bySubject ?? []).find((s) => s.loans > 0))

const utilizationRate = computed(() => overview.value?.utilization.rate != null ? `${overview.value.utilization.rate}%` : '—')

// For loans and visits more is good; for late loans fewer is good, so the colour follows what the change means.
const trendCards = computed(() => {
    const trends = overview.value?.trends
    const card = (label: string, trend: ReportTrend | undefined, upIsGood: boolean) => {
        const change = trend?.change
        const hasEarlier = change != null
        const flat = change == null || change === 0
        const good = change != null && (change > 0) === upIsGood
        return {
            label,
            trend,
            hasEarlier,
            icon: flat ? 'i-tabler-minus' : change > 0 ? 'i-tabler-trending-up' : 'i-tabler-trending-down',
            tone: flat ? 'text-stone-500' : good ? 'text-emerald-700' : 'text-red-600',
            text: change == null ? '' : `${change > 0 ? '+' : ''}${change}%`,
        }
    }
    return [
        card('Loans', trends?.loans, true),
        card('Library visits', trends?.visits, true),
        card('Late loans', trends?.late, false),
    ]
})

const topBooks = computed(() => (overview.value?.topBooks ?? []).map((b) => ({ label: b.title, value: b.count })))

// Books by category: the biggest few, and a way to see the rest (the whole list is long).
const CATEGORIES_SHOWN = 8
const showAllCategories = ref(false)
const categories = computed(() => (overview.value?.booksByCategory ?? []).map((c) => ({ label: c.name, value: c.count })))
const shownCategories = computed(() => (showAllCategories.value ? categories.value : categories.value.slice(0, CATEGORIES_SHOWN)))

const collectionItems = computed(() => {
    const b = overview.value?.collection.breakdown
    return [
        { label: 'On the shelf', value: b?.available ?? 0, color: COPY_STATE_COLORS.available },
        { label: 'Borrowed', value: b?.borrowed ?? 0, color: COPY_STATE_COLORS.borrowed },
        { label: 'Damaged', value: b?.maintenance ?? 0, color: COPY_STATE_COLORS.damaged },
        { label: 'Lost or retired', value: b?.inactive ?? 0, color: COPY_STATE_COLORS.lostOrRetired },
    ]
})

/* ---------- students by program ---------- */
const DEMO_SCOPES = [
    { label: 'Members', value: 'members' },
    { label: 'Visitors', value: 'visitors' },
]
const demoScope = ref<'members' | 'visitors'>('members')
const demo = computed(() => overview.value?.students[demoScope.value])
const demoSubtitle = computed(() => (demoScope.value === 'members' ? 'All approved students' : `Different students who visited ${periodPhrase.value}`))
const demoSlices = computed(() => colorProgramSlices(demo.value?.slices ?? [], overview.value?.students.members.slices ?? []))

/* ---------- computers and rooms, reservations ---------- */
const resourceUse = computed(() => (overview.value?.resources.byType ?? []).map((r) => ({ label: `${r.type} (${formatMinutes(r.minutes)})`, value: r.sessions })))

// The same words as Circulation's reservation tiles.
const RESERVATION_WORDS: Record<string, string> = {
    Waiting: 'Waiting for Review', Accepted: 'Ready for Pickup', Fulfilled: 'Checked Out', Rejected: 'Rejected', Expired: 'Expired',
}
const reservationStatuses = computed(() => (overview.value?.reservations.byStatus ?? [])
    .filter((s) => s.count > 0)
    .map((s) => ({ label: RESERVATION_WORDS[s.status] ?? s.status, value: s.count })))

/* ---------- the CSV (everything on the page, for the period shown) ---------- */
function exportCsv() {
    const data = overview.value
    if (!data) return

    const filename = `library-report-${data.period.from}-to-${data.period.to}.csv`

    downloadCsv(filename, [
        ['Library report'],
        ['Period', data.period.from, data.period.to],
        [],
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
        ['Students by program (all approved students)'],
        ['Program', 'Students'],
        ...data.students.members.slices.map((s) => [s.label, s.count]),
        [],
        ['Students by program (visited in the period)'],
        ['Program', 'Students'],
        ...data.students.visitors.slices.map((s) => [s.label, s.count]),
        [],
        ['Collection (copies)'],
        ['On the shelf', 'Borrowed', 'Damaged', 'Lost or retired', 'Total'],
        [data.collection.breakdown.available, data.collection.breakdown.borrowed, data.collection.breakdown.maintenance, data.collection.breakdown.inactive, data.collection.total],
        [],
        ['Trends (this period vs the same length before)'],
        ['Measure', 'This period', 'Before', 'Change %'],
        ...(['loans', 'visits', 'late'] as const).map((key) => [
            { loans: 'Loans', visits: 'Library visits', late: 'Late loans' }[key],
            data.trends[key].current, data.trends[key].previous, data.trends[key].change ?? '',
        ]),
        [],
        ['Overdue now, by how late'],
        ['Days overdue', 'Loans'],
        ...data.overdue.aging.map((a) => [a.label, a.count]),
        [],
        ['Late loans per month (by due date)'],
        ['Month', 'Late loans'],
        ...data.overdue.byMonth.labels.map((label, i) => [label, data.overdue.byMonth.counts[i] ?? 0]),
        [],
        ['Longest overdue'],
        ['Member', 'Member ID', 'Book', 'Due date', 'Days overdue'],
        ...data.overdue.oldest.map((o) => [o.student, o.memberID ?? '', o.title, o.dueDate, o.daysOverdue]),
        [],
        ['Collection use'],
        ['Copies out now', 'Lendable copies', 'Percent out', 'Titles never borrowed'],
        [data.utilization.copiesOut, data.utilization.lendableCopies, data.utilization.rate ?? '', data.utilization.neverBorrowedTitles],
        [],
        ['Subject', 'Loans', 'Lendable copies', 'Loans per copy'],
        ...data.utilization.bySubject.map((s) => [s.name, s.loans, s.copies, s.perCopy]),
        [],
        ['Computers and rooms'],
        ['Type', 'Sessions', 'Minutes in use'],
        ...data.resources.byType.map((r) => [r.type, r.sessions, r.minutes]),
        ['All', data.resources.sessions, data.resources.minutes],
        [],
        ['Reservations (made in the period)'],
        ['Status', 'Reservations'],
        ...data.reservations.byStatus.map((s) => [RESERVATION_WORDS[s.status] ?? s.status, s.count]),
        [],
        ['Fines'],
        ['Collected', 'Payments', 'Waived', 'Waived fines', 'Still owed (all time)', 'Unpaid fines'],
        [data.fines.collected, data.fines.collectedCount, data.fines.waived, data.fines.waivedCount, data.fines.outstanding, data.fines.outstandingCount],
        [],
        ['Rewards'],
        ['Redemptions', 'Points spent', 'Still pending', 'Cancelled (refunded)'],
        [data.rewards.redemptions, data.rewards.pointsSpent, data.rewards.pending, data.rewards.cancelled],
    ])

    alert.success('Report downloaded', filename)
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
