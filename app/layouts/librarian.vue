<template>
    <div class="min-h-screen bg-amber-50">
        <LibrarianHeader :is-sidebar-open="isSidebarVisible" @toggle-sidebar="isSidebarVisible = !isSidebarVisible" />

        <div class="flex">
            <LibrarianSideBar :open="isSidebarVisible" />

            <main class="min-w-0 flex-1 p-6">
                <slot />
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
// The header and sidebar live here, not in each page, so they stay mounted while
// you navigate: no flicker, and the sidebar's highlight can slide between items.
const isSidebarVisible = useState('librarian-sidebar-open', () => false)
</script>
