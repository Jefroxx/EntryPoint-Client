<template>
    <div class="min-h-screen bg-amber-50">
        <!-- Header Component -->
        <LibrarianHeader :avatar-url="userAvatar" :is-sidebar-open="isSidebarVisible"
            @toggle-sidebar="isSidebarVisible = !isSidebarVisible" />

        <div class="flex">
            <LibrarianSideBar :open="isSidebarVisible" />

            <!-- Main Dashboard Content Goes Here -->
            <main class="flex-1 p-6">

                <div class="flex items-center justify-between ">
                    <div>
                        <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Dashboard</h1>
                        <p class="dashboard-heading mt-1 text-amber-900">Welcome back, Librarian!</p>
                    </div>

                    <LibrarianDate />
                </div>

                <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div v-for="stat in stats" :key="stat.title" class="relative">
                        <LibrarianStatCard :title="stat.title" :value="stat.value" :icon="stat.icon" :color="stat.color"
                            :class="{ 'opacity-40 transition-opacity': summaryPending }" />
                        <LibrarianLoadingOverlay :loading="summaryPending" />
                    </div>

                    <!-- Spans the same two columns as the first two stat cards above
                         (Total Books + Total Members), so it always lines up with them
                         at any sidebar/viewport width instead of using a fixed size. -->
                    <div class="relative sm:col-span-2 lg:col-span-2">
                        <LibrarianBorrowingOverviewCard :labels="overview?.labels ?? []" :borrowed="overview?.borrowed ?? []"
                            :returned="overview?.returned ?? []" :class="{ 'opacity-40 transition-opacity': overviewPending }" />
                        <LibrarianLoadingOverlay :loading="overviewPending" />
                    </div>

                    <div class="relative sm:col-span-2 lg:col-span-2">
                        <LibrarianBookStatusCard :available="bookStatus?.breakdown?.available ?? 0"
                            :borrowed="bookStatus?.breakdown?.borrowed ?? 0"
                            :maintenance="bookStatus?.breakdown?.maintenance ?? 0"
                            :inactive="bookStatus?.breakdown?.inactive ?? 0"
                            :class="{ 'opacity-40 transition-opacity': bookStatusPending }" />
                        <LibrarianLoadingOverlay :loading="bookStatusPending" />
                    </div>

                    <div class="relative sm:col-span-2 lg:col-span-2">
                        <LibrarianRecentLoansCard :loans="recentLoans ?? []"
                            :class="{ 'opacity-40 transition-opacity': recentLoansPending }" />
                        <LibrarianLoadingOverlay :loading="recentLoansPending" />
                    </div>

                    <div class="relative sm:col-span-2 lg:col-span-2">
                        <LibrarianOverdueBooksCard :loans="overdueLoans ?? []"
                            :class="{ 'opacity-40 transition-opacity': overdueLoansPending }" />
                        <LibrarianLoadingOverlay :loading="overdueLoansPending" />
                    </div>

                </div>

            </main>
        </div>
    </div>
</template>
<script setup lang="ts">

import { ref } from 'vue'
import { librarianService } from '~/services/librarianService'

definePageMeta({
    middleware: 'librarian',
})

// Example user avatar state/ref (replace with your actual data/auth store)
const userAvatar = ref('https://via.placeholder.com/150')
const isSidebarVisible = useState('librarian-sidebar-open', () => false)

const { data: summary, pending: summaryPending } =
    useAsyncData('dashboard-summary', () => librarianService.fetchDashboardSummary(), { lazy: true })
const { data: overview, pending: overviewPending } =
    useAsyncData('borrowing-overview', () => librarianService.fetchBorrowingOverview(), { lazy: true })
const { data: bookStatus, pending: bookStatusPending } =
    useAsyncData('book-status-overview', () => librarianService.fetchBookStatusOverview(), { lazy: true })
const { data: recentLoans, pending: recentLoansPending } =
    useAsyncData('recent-loans', () => librarianService.fetchRecentLoans(), { lazy: true })
const { data: overdueLoans, pending: overdueLoansPending } =
    useAsyncData('overdue-loans', () => librarianService.fetchOverdueLoans(), { lazy: true })

const stats = computed(() => [
    { title: 'Total Books', value: summary.value?.totalBooks ?? '—', icon: 'i-lucide-book', color: 'brown' as const },
    { title: 'Total Members', value: summary.value?.totalMembers ?? '—', icon: 'i-lucide-users', color: 'brown' as const },
    { title: 'Active Loans', value: summary.value?.activeLoans ?? '—', icon: 'i-lucide-book-open', color: 'gold' as const },
    { title: 'Pending Fines', value: summary.value?.pendingFines ?? '—', icon: 'i-lucide-circle-dollar-sign', color: 'red' as const },
])
</script>

<style scoped>
.dashboard-heading {
    font-family: 'Raleway', sans-serif;
}
</style>