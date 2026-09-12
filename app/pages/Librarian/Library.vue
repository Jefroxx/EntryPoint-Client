<template>
    <div class="min-h-screen bg-amber-50">
        <!-- Header Component -->
        <LibrarianHeader :avatar-url="userAvatar" @toggle-sidebar="isSidebarVisible = !isSidebarVisible" />

        <div class="flex">
            <LibrarianSideBar v-if="isSidebarVisible" />

            <!-- Main Dashboard Content Goes Here -->
            <main class="flex-1 p-6">

                <div class="flex items-center justify-between ">
                    <div>
                        <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Library</h1>
                        <p class="dashboard-heading mt-1 text-amber-900">Manage and Organize all library books.</p>
                    </div>

                    <Date />
                </div>
            </main>
        </div>
    </div>
</template>
<script setup lang="ts">
definePageMeta({
    middleware: 'librarian',
})

const userAvatar = ref('https://via.placeholder.com/150')
const isSidebarVisible = ref(true)
</script>