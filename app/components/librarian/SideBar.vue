<template>
    <aside class="flex min-h-screen flex-col self-stretch overflow-hidden border-stone-200 bg-white transition-[width,padding,opacity,border-width] duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
        :class="open ? 'w-56 border-r px-3 py-4 opacity-100' : 'w-0 border-r-0 px-0 py-4 opacity-0'">
        <nav class="relative w-56 space-y-0.5">
            <div class="absolute left-0 z-0 h-[42px] w-full rounded-lg bg-accent-500 shadow-sm"
                :class="highlightReady ? 'transition-[transform,opacity] duration-[250ms] ease-[cubic-bezier(.22,1,.36,1)]' : ''"
                :style="{ transform: `translateY(${highlightOffset}px)`, opacity: displayIndex === -1 ? 0 : 1 }" />

            <NuxtLink v-for="(link, index) in navLinks" :key="link.to" :ref="(el) => setLinkRef(el, index)" :to="link.to"
                class="relative z-10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors duration-[250ms]"
                :class="index === displayIndex ? 'text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'"
                @click="pendingIndex = index">
                <Icon :name="link.icon" class="h-5 w-5 shrink-0" />
                {{ link.label }}
            </NuxtLink>
        </nav>

        <div class="mt-3 w-56 border-t border-stone-200 pt-3">
            <button type="button"
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-stone-500 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
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
const { signOut } = useAuthSession()

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

// The link you just pressed, before the route has finished changing. Following it
// straight away makes the sidebar answer the press even when a page is slow to load.
const pendingIndex = ref<number | null>(null)
const displayIndex = computed(() => pendingIndex.value ?? activeIndex.value)

const highlightOffset = ref(0)
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
})
watch(displayIndex, () => nextTick(measureHighlight))

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
