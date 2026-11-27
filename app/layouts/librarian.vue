<template>
    <div class="flex min-h-screen bg-parchment">
        <!-- Sidebar runs the full height on the left (logo on top); header and page share the column beside it,
             the same arrangement as the student layout. Comments stay inside the root element (one root node). -->
        <!-- On a phone the sidebar is a drawer over the page: the menu button opens it, and a tap on the dimmed
             page, a link or Escape closes it. From 1024px up it is the docked sidebar that folds to icons. -->
        <Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-150 ease-out" leave-to-class="opacity-0">
            <div v-if="drawerOpen" class="fixed inset-0 z-[55] bg-[#1c1712]/40 lg:hidden" aria-hidden="true"
                @click="drawerOpen = false" />
        </Transition>
        <LibrarianSideBar :open="isDesktop ? railOpen : true" :drawer-open="drawerOpen" :is-desktop="isDesktop"
            @close="drawerOpen = false" />

        <div class="flex min-w-0 flex-1 flex-col">
            <LibrarianHeader :is-sidebar-open="!!(isDesktop ? railOpen : drawerOpen)" :is-desktop="isDesktop" @toggle-sidebar="toggleSidebar" />

            <!-- The page loader covers only this column below the header; the sidebar and header stay usable. -->
            <div class="relative flex min-w-0 flex-1 flex-col">
                <main class="min-w-0 flex-1 p-4 sm:p-6">
                    <slot />
                </main>
                <AppLoader :show="loader.active && loader.full" contained />
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
// The area names and fund sources every screen shows (Library > Categories), fetched once.
useLibraryAreas()
useFundSources()

// An administrator can change a role while someone is signed in, so ask the server what this account may do now.
const { refresh: refreshAccess } = useStaffAccess()
onMounted(() => { void refreshAccess() })
// Below 1024px the sidebar is a drawer. The server renders the desktop arrangement (the drawer is hidden by CSS
// until then, so nothing flashes), and this takes over once the page is in the browser.
const isDesktop = ref(true)
const drawerOpen = ref(false)

// 1024-1279px (a tablet, a small laptop): the labelled sidebar took 232px of a narrow screen and squeezed every page,
// so there it starts as the icon rail. The menu button still opens it for the visit; the saved preference is only
// for wider screens.
const isCompact = ref(false)
const compactOpen = ref(false)
const railOpen = computed(() => (isCompact.value ? compactOpen.value : sidebarOpen.value))

function toggleSidebar() {
    if (!isDesktop.value) drawerOpen.value = !drawerOpen.value
    else if (isCompact.value) compactOpen.value = !compactOpen.value
    else sidebarOpen.value = !sidebarOpen.value
}

let query: MediaQueryList | undefined
let compactQuery: MediaQueryList | undefined
const onQueryChange = () => {
    isDesktop.value = !!query?.matches
    isCompact.value = !!compactQuery?.matches
    if (isDesktop.value) drawerOpen.value = false
}
const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') drawerOpen.value = false }

onMounted(() => {
    query = window.matchMedia('(min-width: 1024px)')
    compactQuery = window.matchMedia('(min-width: 1024px) and (max-width: 1279px)')
    onQueryChange()
    query.addEventListener('change', onQueryChange)
    compactQuery.addEventListener('change', onQueryChange)
    window.addEventListener('keydown', onEscape)
    // The scan station sends returns and checkouts here (composables/useStationChannel.ts).
    registerMainTab()
})
onUnmounted(() => {
    query?.removeEventListener('change', onQueryChange)
    compactQuery?.removeEventListener('change', onQueryChange)
    window.removeEventListener('keydown', onEscape)
    document.body.style.overflow = ''
})

// Choosing a page closes the drawer; while it is open the page behind it stays put.
const route = useRoute()
watch(() => route.fullPath, () => { drawerOpen.value = false })
watch(drawerOpen, (open) => { document.body.style.overflow = open ? 'hidden' : '' })
</script>
