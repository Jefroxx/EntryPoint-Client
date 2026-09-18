<template>
    <aside class="flex min-h-screen flex-col self-stretch overflow-hidden border-stone-200 bg-white transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
        :class="open ? 'w-56 border-r px-3 py-4 opacity-100' : 'w-0 border-r-0 px-0 py-4 opacity-0'">
        <nav class="relative w-56 space-y-0.5">
            <div class="absolute left-0 z-0 h-[42px] w-full rounded-lg bg-accent-500 shadow-sm transition-transform duration-250 ease-[cubic-bezier(.22,1,.36,1)]"
                :style="{ transform: `translateY(${highlightOffset}px)`, opacity: activeIndex === -1 ? 0 : 1 }" />

            <NuxtLink v-for="(link, index) in navLinks" :key="link.to" :ref="(el) => setLinkRef(el, index)" :to="link.to"
                class="relative z-10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150"
                :class="index === activeIndex ? 'text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'">
                <Icon :name="link.icon" class="h-5 w-5 shrink-0" />
                {{ link.label }}
            </NuxtLink>
        </nav>

        <div class="mt-3 w-56 border-t border-stone-200 pt-3">
            <button type="button"
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-500 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isSigningOut" @click="handleLogout">
                <Icon name="i-lucide-log-out" class="h-5 w-5 shrink-0" />
                {{ isSigningOut ? 'Signing out...' : 'Logout' }}
            </button>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { authService } from '~/services/auth/AuthService'

withDefaults(defineProps<{ open?: boolean }>(), { open: true })

const isSigningOut = ref(false)
const route = useRoute()

const navLinks = [
    { label: 'Dashboard', to: '/librarian/dashboard', icon: 'i-lucide-home' },
    { label: 'Library', to: '/librarian/library', icon: 'i-lucide-book' },
    { label: 'Circulation', to: '/librarian/circulation', icon: 'i-lucide-book-open' },
    { label: 'Students', to: '/librarian/students', icon: 'i-lucide-users' },
    { label: 'Attendance', to: '/librarian/attendance', icon: 'i-lucide-user-check' },
    { label: 'Resources', to: '/librarian/resources', icon: 'i-lucide-monitor' },
    { label: 'Engagement', to: '/librarian/engagement', icon: 'i-lucide-trophy' },
    { label: 'Reports', to: '/librarian/reports', icon: 'i-lucide-clipboard-list' },
    { label: 'Notifications', to: '/librarian/notifications', icon: 'i-lucide-bell' },
    { label: 'Settings', to: '/librarian/settings', icon: 'i-lucide-settings' },
]

const linkRefs = ref<any[]>([])
function setLinkRef(el: any, index: number) {
    linkRefs.value[index] = el
}

const activeIndex = computed(() => navLinks.findIndex((link) => route.path.startsWith(link.to)))
const highlightOffset = ref(0)

function measureHighlight() {
    const index = activeIndex.value
    const el = linkRefs.value[index]?.$el as HTMLElement | undefined
    if (el) highlightOffset.value = el.offsetTop
}

onMounted(() => nextTick(measureHighlight))
watch(activeIndex, () => nextTick(measureHighlight))

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
