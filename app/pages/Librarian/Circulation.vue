<template>
    <div class="min-h-screen bg-amber-50">
        <!-- Header Component -->
        <LibrarianHeader :is-sidebar-open="isSidebarVisible" @toggle-sidebar="isSidebarVisible = !isSidebarVisible" />

        <div class="flex">
            <LibrarianSideBar :open="isSidebarVisible" />

            <!-- Main Dashboard Content Goes Here -->
            <main class="flex-1 p-6">

                <div class="flex items-center justify-between ">
                    <div>
                        <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Circulation</h1>
                        <p class="dashboard-heading mt-1 text-amber-900">Manage reservations, borrowing, returns and
                            penalties.</p>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>
<script setup lang="ts">
definePageMeta({
    middleware: 'librarian',
})

const isSidebarVisible = useState('librarian-sidebar-open', () => false)
</script>