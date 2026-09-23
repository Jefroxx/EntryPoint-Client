<template>
    <div class="min-h-screen bg-amber-50">
        <LibrarianHeader :is-sidebar-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

        <div class="flex">
            <LibrarianSideBar :open="sidebarOpen" />

            <main class="min-w-0 flex-1 p-6">
                <slot />
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
// The header and sidebar live here, not in each page, so they stay mounted while
// you navigate: no flicker, and the sidebar's highlight can slide between items.
// Expanded (labels) or folded to an icon rail, as on the student side. A per-device preference.
const sidebarOpen = useCookie<boolean>('librarian-sidebar-open', { default: () => true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
</script>
