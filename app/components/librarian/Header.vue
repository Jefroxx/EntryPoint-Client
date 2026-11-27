<template>
    <!-- backdrop-blur makes the header its own stacking layer; without an explicit z-index the
         dropdowns inside it get painted over by page content (sticky table heads, cards, sidebar). -->
    <!-- Sticky, so the menu button and the bell stay reachable on long pages (the sidebar sits beside it). -->
    <header class="sticky top-0 z-40 flex h-[68px] w-full items-center justify-between border-b border-stone-200 bg-parchment/85 px-4 backdrop-blur-sm sm:px-6">
        <!-- Left: the sidebar toggle (the logo lives at the top of the sidebar, as on the student side) -->
        <div class="flex items-center gap-4">
            <!-- On desktop this folds the sidebar to icons and back; on a phone it opens and closes the menu drawer. -->
            <button type="button" aria-controls="librarian-sidebar" :aria-expanded="isSidebarOpen"
                :aria-label="isDesktop ? (isSidebarOpen ? 'Collapse sidebar to icons' : 'Expand sidebar') : (isSidebarOpen ? 'Close menu' : 'Open menu')"
                :title="isDesktop ? (isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar') : undefined"
                class="-ml-2 flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-[transform,background-color,color] duration-150 ease-out hover:bg-stone-900/5 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 active:scale-[0.96]"
                @click="$emit('toggle-sidebar')">
                <Icon name="i-tabler-menu-2" class="h-[22px] w-[22px]" />
            </button>

            <!-- The sidebar (and its logo) is out of sight on a phone, so the header carries the wordmark. -->
            <NuxtLink :to="staffRole === 'admin' ? '/admin/dashboard' : '/librarian/dashboard'" aria-label="EntryPoint home" class="flex items-center lg:hidden">
                <img src="~/assets/css/logo/EntryPointLogo.png" alt="" class="h-7 w-auto max-w-none" />
            </NuxtLink>

        </div>

        <!-- Right: notifications + profile -->
        <div class="flex items-center gap-3">
            <div class="relative" ref="bellRootRef">
                <!-- Same tile as the student bell: white, hairline border, 40px, a 22px bell that reads at a glance. -->
                <button type="button" :aria-label="unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'"
                    :aria-expanded="isBellOpen" aria-haspopup="dialog"
                    class="relative flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition-[transform,border-color,color] duration-150 ease-out active:scale-[0.96]"
                    :class="isBellOpen ? 'border-accent-200 text-accent-600' : 'border-stone-200 text-stone-700 hover:border-accent-200 hover:text-accent-600'"
                    @click.stop="toggleBell">
                    <Icon name="i-tabler-bell" class="h-[22px] w-[22px]" />
                </button>
                <CountBadge v-if="unreadCount > 0" size="md" ring="parchment" class="pointer-events-none absolute -right-1.5 -top-1.5">{{ unreadCount > 9 ? '9+' : unreadCount }}</CountBadge>

                <div
                    class="absolute right-0 top-[calc(100%+10px)] z-50 w-[380px] max-w-[calc(100vw-2rem)] origin-top-right max-sm:fixed max-sm:inset-x-3 max-sm:right-3 max-sm:top-[76px] max-sm:w-auto max-sm:max-w-none overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card transition-[opacity,transform,translate,scale] duration-150"
                    :class="isBellOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'">
                    <NotificationPanel side="staff" @close="isBellOpen = false" />
                </div>
            </div>

            <div class="relative" ref="menuRootRef">
                <button type="button"
                    class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-stone-200 transition-transform duration-150 active:scale-[0.96]"
                    aria-label="User menu" :aria-expanded="isMenuOpen" @click.stop="toggleUserMenu">
                    <span class="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-500 to-accent-700 text-[14px] font-bold text-white">
                        {{ initials }}
                    </span>
                </button>

                <div
                    class="absolute right-0 top-[calc(100%+10px)] z-50 w-64 origin-top-right rounded-2xl border border-stone-200 bg-white p-2 shadow-card transition-[opacity,transform,translate,scale] duration-150"
                    :class="isMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'">
                    <div class="flex items-center gap-3 px-2 pb-2.5 pt-1">
                        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[13px] font-bold text-white">
                            {{ initials }}
                        </span>
                        <div class="min-w-0">
                            <p class="truncate text-[15px] font-bold text-stone-900">{{ fullName }}</p>
                            <p class="text-[12.5px] text-stone-500">{{ roleLabel }}</p>
                        </div>
                    </div>
                    <hr class="mx-1 mb-1.5 border-stone-100" />
                    <!-- How every list of cards is shown, on this device: a grid, or one card per row. -->
                    <div class="px-2 pb-2.5 pt-1">
                        <p class="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Cards</p>
                        <CardLayoutSwitch />
                    </div>
                    <hr class="mx-1 mb-1.5 border-stone-100" />
                    <!-- Administrators have their own page; librarians and assistants use the Account tab of Settings. -->
                    <NuxtLink :to="staffRole === 'admin' ? '/admin/account' : '/librarian/settings'"
                        class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[14px] font-medium text-stone-700 transition-colors hover:bg-stone-100"
                        @click="isMenuOpen = false">
                        <Icon name="i-tabler-settings" class="h-[15px] w-[15px] text-stone-500" />
                        Account settings
                    </NuxtLink>
                    <button type="button" :disabled="isSigningOut"
                        class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[14px] font-medium text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        @click="handleLogout">
                        <Icon name="i-tabler-logout" class="h-[15px] w-[15px]" />
                        {{ isSigningOut ? 'Signing out...' : 'Sign out' }}
                    </button>
                </div>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { authService } from '~/services/authService'

withDefaults(defineProps<{
    isSidebarOpen: boolean
    isDesktop?: boolean
}>(), { isDesktop: true })

defineEmits<{
    (e: 'toggle-sidebar'): void
}>()

const { firstName, lastName, signOut } = useAuthSession()
const staffRole = useCookie(SESSION_COOKIES.librarian.staffRole)

const initials = computed(() => {
    const a = (firstName.value ?? '').trim().charAt(0)
    const b = (lastName.value ?? '').trim().charAt(0)
    return (a + b).toUpperCase() || '?'
})

const fullName = computed(() => {
    const name = `${firstName.value ?? ''} ${lastName.value ?? ''}`.trim()
    return name || 'Librarian'
})

// The session role is always "librarian" on this side; what the account may do (admin, librarian,
// student assistant) lives in the staffRole cookie.
const roleLabel = computed(() => staffRoleLabel(staffRole.value ?? 'librarian'))

const { unreadCount, refresh } = useNotifications()

const isMenuOpen = ref(false)
const isBellOpen = ref(false)
const isSigningOut = ref(false)
const menuRootRef = ref<HTMLElement | null>(null)
const bellRootRef = ref<HTMLElement | null>(null)

function toggleUserMenu() {
    isMenuOpen.value = !isMenuOpen.value
    isBellOpen.value = false
}

function toggleBell() {
    isBellOpen.value = !isBellOpen.value
    isMenuOpen.value = false
}

function closeMenus(event: MouseEvent) {
    const target = event.target as Node
    if (menuRootRef.value && !menuRootRef.value.contains(target)) isMenuOpen.value = false
    if (bellRootRef.value && !bellRootRef.value.contains(target)) isBellOpen.value = false
}

function closeOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        isMenuOpen.value = false
        isBellOpen.value = false
    }
}

// The API has no push channel, so poll — but only while the tab is in view.
const POLL_MS = 15_000
let pollTimer: ReturnType<typeof setInterval> | undefined

function refreshIfVisible() {
    if (!document.hidden) refresh()
}

onMounted(() => {
    document.addEventListener('click', closeMenus)
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('visibilitychange', refreshIfVisible)

    refresh()
    pollTimer = setInterval(refreshIfVisible, POLL_MS)
})
onUnmounted(() => {
    document.removeEventListener('click', closeMenus)
    document.removeEventListener('keydown', closeOnEscape)
    document.removeEventListener('visibilitychange', refreshIfVisible)
    clearInterval(pollTimer)
})

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
