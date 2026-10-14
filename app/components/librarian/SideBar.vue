<template>
    <!-- Same measurements as the student sidebar (layouts/student.vue): 232px expanded, a 76px icon rail
         folded, 44px rows, 19px icons, 14.5px labels. Labels stay for screen readers when folded, and
         each item names itself on hover. -->
    <!-- Full height with the logo on top, like the student sidebar; the header sits beside it. Sticky and
         exactly one screen tall, so it stays put while long pages scroll. -->
    <!-- Below 1024px (max-lg) it leaves the page flow and becomes a 280px drawer sliding in from the left;
         the layout then passes open=true so the labels always show. -->
    <aside id="librarian-sidebar" :inert="!isDesktop && !drawerOpen ? true : undefined"
        class="no-scrollbar sticky top-0 flex h-dvh shrink-0 flex-col self-start overflow-y-auto overflow-x-hidden border-r border-stone-200 bg-white px-3 pb-4 transition-[width] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-[60] max-lg:w-[280px] max-lg:max-w-[85vw] max-lg:border-r-0 max-lg:shadow-overlay max-lg:transition-transform max-lg:duration-[260ms]"
        :class="[open ? 'w-[232px]' : 'w-[76px]', drawerOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full max-lg:shadow-none']">
        <!-- Wordmark when open, the round mark when folded to the icon rail (same as the student side). -->
        <NuxtLink :to="homeLink" aria-label="EntryPoint home"
            class="-mx-3 flex h-[68px] shrink-0 items-center leading-none"
            :class="open ? 'justify-start px-6' : 'justify-center'">
            <img v-if="open" src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-8 w-auto max-w-none" />
            <img v-else src="/favicon.png" alt="" class="h-8 w-8" />
        </NuxtLink>
        <button type="button" aria-label="Close menu"
            class="absolute right-3 top-3.5 flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-900 lg:hidden"
            @click="emit('close')">
            <Icon name="i-tabler-x" class="h-5 w-5" />
        </button>

        <nav class="relative mt-3 grid gap-1" aria-label="Main">
            <!-- Rows are a fixed 44px whether or not the labels show, so the highlight's position holds
                 across folding; it's still re-measured on every fold in case that ever changes. -->
            <div class="absolute left-0 top-0 z-0 h-11 w-full rounded-xl bg-accent-500 shadow-sm"
                :class="highlightReady ? 'transition-[transform,opacity] duration-[250ms] ease-[cubic-bezier(.22,1,.36,1)]' : ''"
                :style="{ transform: `translateY(${highlightOffset}px)`, opacity: displayIndex === -1 ? 0 : 1 }" />

            <NuxtLink v-for="(link, index) in navLinks" :key="link.to" :ref="(el) => setLinkRef(el, index)" :to="link.to"
                :title="open ? undefined : link.label" :aria-current="index === activeIndex ? 'page' : undefined"
                class="relative z-10 flex h-11 items-center gap-3 rounded-xl text-[14.5px] font-medium transition-[transform,color,background-color] duration-150 ease-out active:scale-[.97]"
                :class="[open ? 'px-3.5' : 'justify-center px-0', index === displayIndex ? 'text-white' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900']"
                @click="pendingIndex = index">
                <Icon :name="link.icon" class="h-[19px] w-[19px] shrink-0" />
                <span class="whitespace-nowrap" :class="open ? '' : 'sr-only'">{{ link.label }}</span>
            </NuxtLink>
        </nav>

        <div class="mx-3 my-4 h-px shrink-0 bg-stone-100" />

        <button type="button" :title="open ? undefined : 'Logout'"
            class="flex h-11 w-full shrink-0 items-center gap-3 rounded-xl text-[14.5px] font-medium text-stone-500 transition-colors duration-150 hover:bg-stone-50 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
            :class="open ? 'px-3.5' : 'justify-center px-0'"
            :disabled="isSigningOut" @click="handleLogout">
            <Icon name="i-tabler-logout" class="h-[19px] w-[19px] shrink-0" />
            <span class="whitespace-nowrap" :class="open ? '' : 'sr-only'">{{ isSigningOut ? 'Signing out...' : 'Logout' }}</span>
        </button>
    </aside>
</template>

<script setup lang="ts">
import { authService } from '~/services/authService'

const props = withDefaults(defineProps<{ open?: boolean; drawerOpen?: boolean; isDesktop?: boolean }>(), { open: true, drawerOpen: false, isDesktop: true })
const emit = defineEmits<{ (e: 'close'): void }>()

const isSigningOut = ref(false)
const route = useRoute()
const { signOut } = useAuthSession()

const ALL_LINKS = [
    { label: 'Dashboard', to: '/librarian/dashboard', icon: 'i-tabler-home' },
    { label: 'Library', to: '/librarian/library', icon: 'i-tabler-book-2' },
    { label: 'Circulation', to: '/librarian/circulation', icon: 'i-tabler-book' },
    { label: 'Students', to: '/librarian/students', icon: 'i-tabler-users' },
    { label: 'Attendance', to: '/librarian/attendance', icon: 'i-tabler-user-check' },
    { label: 'Resources', to: '/librarian/resources', icon: 'i-tabler-device-desktop' },
    { label: 'Engagement', to: '/librarian/engagement', icon: 'i-tabler-trophy' },
    { label: 'Reports', to: '/librarian/reports', icon: 'i-tabler-clipboard-list' },
    { label: 'Notifications', to: '/librarian/notifications', icon: 'i-tabler-bell' },
    { label: 'Settings', to: '/librarian/settings', icon: 'i-tabler-settings' },
]

// The admin side has its own sidebar. Administrators reach it from the librarian one, and come back from it.
const ADMIN_LINKS = [
    { label: 'Overview', to: '/admin/dashboard', icon: 'i-tabler-layout-dashboard' },
    { label: 'Staff', to: '/admin/staff', icon: 'i-tabler-id-badge-2' },
    { label: 'Members', to: '/admin/members', icon: 'i-tabler-users' },
    { label: 'Roles', to: '/admin/roles', icon: 'i-tabler-shield-lock' },
    { label: 'Announcements', to: '/admin/announcements', icon: 'i-tabler-speakerphone' },
    { label: 'Privacy', to: '/admin/privacy', icon: 'i-tabler-user-shield' },
    { label: 'Audit log', to: '/admin/audit-log', icon: 'i-tabler-history' },
    { label: 'Librarian side', to: '/librarian/dashboard', icon: 'i-tabler-arrow-back-up' },
]

const inAdminArea = computed(() => route.path.toLowerCase().startsWith('/admin'))

// A role sees only the areas it may use (the server enforces it; this keeps the sidebar honest).
const { can, isAdmin } = useStaffAccess()
const navLinks = computed(() => {
    if (inAdminArea.value) return ADMIN_LINKS
    const links = ALL_LINKS.filter((link) => can(permissionForPath(link.to)))
    return isAdmin.value ? [...links, { label: 'Admin', to: '/admin/dashboard', icon: 'i-tabler-shield-lock' }] : links
})
const homeLink = computed(() => (inAdminArea.value ? '/admin/dashboard' : '/librarian/dashboard'))

const linkRefs = ref<any[]>([])
function setLinkRef(el: any, index: number) {
    linkRefs.value[index] = el
}

// Ignoring capitals: the pages live in a "Librarian" folder, and the address can come back as /Librarian/… after
// a query-only change, which would otherwise leave nothing highlighted.
const activeIndex = computed(() => navLinks.value.findIndex((link) => route.path.toLowerCase().startsWith(link.to)))

// The link you just pressed, before the route has finished changing. Following it
// straight away makes the sidebar answer the press even when a page is slow to load.
const pendingIndex = ref<number | null>(null)
const displayIndex = computed(() => pendingIndex.value ?? activeIndex.value)

// One row (h-11, 44px) plus the gap-1 between rows. Lets the server render the highlight on the right
// item before anything can be measured; measureHighlight() takes over once the page is in the browser.
const ROW_PITCH = 48
const highlightOffset = ref(Math.max(activeIndex.value, 0) * ROW_PITCH)
const highlightReady = ref(false)

function measureHighlight() {
    const el = linkRefs.value[displayIndex.value]?.$el as HTMLElement | undefined
    if (el) highlightOffset.value = el.offsetTop
}

onMounted(() => {
    nextTick(() => {
        measureHighlight()
        // Only start animating after the first placement, so it doesn't slide in from the top.
        requestAnimationFrame(() => { highlightReady.value = true })
    })
    window.addEventListener('resize', measureHighlight)
})
onUnmounted(() => window.removeEventListener('resize', measureHighlight))
// Folding shows or hides the labels, so re-measure then too, not only when the page changes.
watch([displayIndex, () => props.open], () => nextTick(measureHighlight))

// A finished (or cancelled) navigation ends the "pressed" state.
const removeAfterEach = useRouter().afterEach(() => { pendingIndex.value = null })
onUnmounted(removeAfterEach)

async function handleLogout() {
    isSigningOut.value = true
    try {
        await authService.logout('librarian')
    } finally {
        signOut()
        await navigateTo('/librarian/login')
    }
}
</script>
