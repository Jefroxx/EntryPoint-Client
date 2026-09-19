<template>
    <!-- backdrop-blur makes the header its own stacking layer; without an explicit z-index the
         dropdowns inside it get painted over by page content (sticky table heads, cards, sidebar). -->
    <header class="relative z-40 flex h-[68px] w-full items-center justify-between border-b border-stone-200 bg-white/90 px-6 backdrop-blur-sm">
        <!-- Left: hamburger + logo -->
        <div class="flex items-center gap-4">
            <button type="button"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-800 active:scale-90"
                aria-label="Toggle sidebar" :aria-expanded="isSidebarOpen" @click="$emit('toggle-sidebar')">
                <span class="relative block h-4 w-5">
                    <span
                        class="absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
                        :class="isSidebarOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0 rotate-0'" />
                    <span
                        class="absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
                        :class="isSidebarOpen ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'" />
                    <span
                        class="absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
                        :class="isSidebarOpen ? 'bottom-1/2 translate-y-1/2 -rotate-45' : 'bottom-0 rotate-0'" />
                </span>
            </button>

            <NuxtLink to="/librarian/dashboard" class="flex items-center leading-none">
                <img src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-8 w-auto" />
            </NuxtLink>
        </div>

        <!-- Right: notifications + profile -->
        <div class="flex items-center gap-4">
            <div class="relative" ref="bellRootRef">
                <ButtonsButton variant="icon" class="!rounded-full" aria-label="Notifications" :aria-expanded="isBellOpen"
                    @click.stop="toggleBell">
                    <Icon name="i-lucide-bell" class="h-[18px] w-[18px]" />
                </ButtonsButton>
                <span v-if="unreadCount > 0"
                    class="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                    {{ unreadCount > 9 ? '9+' : unreadCount }}
                </span>

                <div
                    class="absolute right-0 top-[calc(100%+10px)] z-50 w-[380px] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg transition-all duration-150"
                    :class="isBellOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'">
                    <div class="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                        <p class="text-[13.5px] font-bold text-stone-900">Notifications</p>
                        <button type="button" :disabled="unreadCount === 0"
                            class="text-[12px] font-semibold text-accent-500 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                            @click="markEverythingRead">
                            Mark all as read
                        </button>
                    </div>

                    <div class="max-h-[420px] overflow-y-auto [scrollbar-width:thin]">
                        <LibrarianNotificationRow v-for="(notification, index) in recent" :key="notification.notificationID"
                            :notification="notification" :index="index" @open="markOneRead" @go="openNotification" />
                        <p v-if="recent.length === 0" class="px-4 py-10 text-center text-[13px] text-stone-400">
                            {{ loaded ? 'No notifications yet.' : 'Loading notifications…' }}
                        </p>
                    </div>

                    <NuxtLink to="/librarian/notifications"
                        class="block border-t border-stone-100 px-4 py-2.5 text-center text-[12.5px] font-semibold text-accent-500 transition-colors hover:bg-stone-50"
                        @click="isBellOpen = false">
                        View all notifications
                    </NuxtLink>
                </div>
            </div>

            <div class="relative" ref="menuRootRef">
                <button type="button"
                    class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-stone-200 transition-transform duration-150 active:scale-90"
                    aria-label="User menu" :aria-expanded="isMenuOpen" @click.stop="toggleUserMenu">
                    <span class="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-500 to-accent-700 text-[13px] font-bold text-white">
                        {{ initials }}
                    </span>
                </button>

                <div
                    class="absolute right-0 top-[calc(100%+10px)] z-50 w-56 origin-top-right rounded-2xl border border-stone-200 bg-white p-2 shadow-lg transition-all duration-150"
                    :class="isMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'">
                    <div class="flex items-center gap-3 px-2 pb-2.5 pt-1">
                        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[12px] font-bold text-white">
                            {{ initials }}
                        </span>
                        <div class="min-w-0">
                            <p class="truncate text-[13.5px] font-bold text-stone-900">{{ fullName }}</p>
                            <p class="text-[11.5px] text-stone-400">{{ roleLabel }}</p>
                        </div>
                    </div>
                    <hr class="mx-1 mb-1.5 border-stone-100" />
                    <button type="button"
                        class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium text-stone-600 transition-colors hover:bg-stone-50"
                        @click="isMenuOpen = false">
                        <Icon name="i-lucide-settings" class="h-[15px] w-[15px]" />Account settings
                    </button>
                    <button type="button" :disabled="isSigningOut"
                        class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        @click="handleLogout">
                        <Icon name="i-lucide-log-out" class="h-[15px] w-[15px]" />
                        {{ isSigningOut ? 'Signing out...' : 'Sign out' }}
                    </button>
                </div>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { authService } from '~/services/auth/AuthService'
import type { NotificationRecord } from '~/services/notificationService'

defineProps<{
    isSidebarOpen: boolean
}>()

defineEmits<{
    (e: 'toggle-sidebar'): void
}>()

const { firstName, lastName, role, signOut } = useAuthSession()

const initials = computed(() => {
    const a = (firstName.value ?? '').trim().charAt(0)
    const b = (lastName.value ?? '').trim().charAt(0)
    return (a + b).toUpperCase() || '?'
})

const fullName = computed(() => {
    const name = `${firstName.value ?? ''} ${lastName.value ?? ''}`.trim()
    return name || 'Librarian'
})

const roleLabel = computed(() => {
    const value = role.value ?? 'librarian'
    return value.charAt(0).toUpperCase() + value.slice(1)
})

const { items, loaded, unreadCount, refresh, markRead, markAllRead } = useNotifications()

const recent = computed(() => items.value.slice(0, 6))

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

// A failed request already rolls the row back to unread, and the next poll
// restores the real state, so there's nothing more to do with the error here.
function markOneRead(notification: NotificationRecord) {
    markRead(notification).catch(() => {})
}

function markEverythingRead() {
    markAllRead().catch(() => {})
}

async function openNotification(notification: NotificationRecord) {
    isBellOpen.value = false
    markOneRead(notification)

    const target = notificationMeta(notification.type).to
    if (target) await navigateTo(target)
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
