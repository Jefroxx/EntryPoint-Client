<template>
    <!-- Sidebar runs the full height on the left (logo on top); header and page share the column beside it,
         the same arrangement as the student layout. -->
    <div class="flex min-h-screen bg-parchment">
        <LibrarianSideBar :open="sidebarOpen" />

        <div class="flex min-w-0 flex-1 flex-col">
            <LibrarianHeader :is-sidebar-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

            <!-- The page loader covers only this column below the header; the sidebar and header stay usable. -->
            <div class="relative flex min-w-0 flex-1 flex-col">
                <main class="min-w-0 flex-1 p-6">
                    <slot />
                </main>
                <AppLoader :show="loader.active" contained />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// The header and sidebar live here, not in each page, so they stay mounted while
// you navigate: no flicker, and the sidebar's highlight can slide between items.
// Expanded (labels) or folded to an icon rail, as on the student side. A per-device preference.
const sidebarOpen = useCookie<boolean>('librarian-sidebar-open', { default: () => true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
const loader = usePageLoader()
</script>
