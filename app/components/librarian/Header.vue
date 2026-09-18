<template>
    <header class="flex h-[68px] w-full items-center justify-between border-b border-stone-200 bg-white/90 px-6 backdrop-blur-sm">
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

            <a href="/dashboard" class="flex items-center leading-none">
                <img src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-8 w-auto" />
            </a>
        </div>

        <!-- Right: notifications + profile -->
        <div class="flex items-center gap-4">
            <ButtonsButton variant="icon" class="!rounded-full" aria-label="Notifications">
                <Icon name="i-lucide-bell" class="h-[18px] w-[18px]" />
            </ButtonsButton>

            <div class="relative" ref="menuRootRef">
                <button type="button"
                    class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-stone-200 transition-transform duration-150 active:scale-90"
                    aria-label="User menu" :aria-expanded="isMenuOpen" @click.stop="isMenuOpen = !isMenuOpen">
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

defineProps<{
    isSidebarOpen: boolean
}>()

defineEmits<{
    (e: 'toggle-sidebar'): void
}>()

const firstName = useCookie<string | null>('_firstName')
const lastName = useCookie<string | null>('_lastName')
const role = useCookie<string | null>('_role')

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

const isMenuOpen = ref(false)
const isSigningOut = ref(false)
const menuRootRef = ref<HTMLElement | null>(null)

function closeMenu(event: MouseEvent) {
    if (menuRootRef.value && !menuRootRef.value.contains(event.target as Node)) {
        isMenuOpen.value = false
    }
}

function closeOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') isMenuOpen.value = false
}

onMounted(() => {
    document.addEventListener('click', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
})
onUnmounted(() => {
    document.removeEventListener('click', closeMenu)
    document.removeEventListener('keydown', closeOnEscape)
})

async function handleLogout() {
    isSigningOut.value = true
    try {
        await authService.logout()
    } finally {
        useCookie('_token').value = null
        useCookie('_uuid').value = null
        useCookie('_role').value = null
        useCookie('_firstName').value = null
        useCookie('_lastName').value = null
        useState('librarian-sidebar-open', () => false).value = false
        await navigateTo('/')
    }
}
</script>
