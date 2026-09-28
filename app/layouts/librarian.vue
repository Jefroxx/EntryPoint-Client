<template>
    <!-- Sidebar runs the full height on the left (logo on top); header and page share the column beside it,
         the same arrangement as the student layout. -->
    <div class="flex min-h-screen bg-amber-50">
        <LibrarianSideBar :open="sidebarOpen" />

        <div class="flex min-w-0 flex-1 flex-col">
            <LibrarianHeader :is-sidebar-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

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
