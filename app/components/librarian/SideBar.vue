<template>
    <!-- Expanded: icons and labels. Folded: a 68px icon rail (labels stay for screen readers, and each
         item names itself on hover). Icons sit at the same x in both, so nothing jumps while it folds. -->
    <!-- Sticky and exactly one screen tall (under the 68px header), so it stays put while long pages
         scroll; a page-tall column would carry its icons off the top and leave a blank white strip. -->
    <aside id="librarian-sidebar"
        class="no-scrollbar sticky top-[68px] flex h-[calc(100dvh-68px)] shrink-0 flex-col self-start overflow-y-auto overflow-x-hidden border-r border-stone-200 bg-white py-4 transition-[width,padding] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
        :class="open ? 'w-56 px-3' : 'w-[68px] px-2.5'">
        <nav class="relative space-y-0.5" aria-label="Main">
            <div class="absolute left-0 z-0 h-[42px] w-full rounded-lg bg-accent-500 shadow-sm"
                :class="highlightReady ? 'transition-[transform,opacity] duration-[250ms] ease-[cubic-bezier(.22,1,.36,1)]' : ''"
                :style="{ transform: `translateY(${highlightOffset}px)`, opacity: displayIndex === -1 ? 0 : 1 }" />

            <NuxtLink v-for="(link, index) in navLinks" :key="link.to" :ref="(el) => setLinkRef(el, index)" :to="link.to"
                :title="open ? undefined : link.label" :aria-current="index === activeIndex ? 'page' : undefined"
                class="relative z-10 flex items-center gap-3 rounded-lg py-2.5 text-[15px] font-medium transition-colors duration-[250ms]"
                :class="[open ? 'px-3' : 'justify-center px-0', index === displayIndex ? 'text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800']"
                @click="pendingIndex = index">
                <Icon :name="link.icon" class="h-5 w-5 shrink-0" />
                <span class="whitespace-nowrap" :class="open ? '' : 'sr-only'">{{ link.label }}</span>
            </NuxtLink>
        </nav>

        <div class="mt-3 border-t border-stone-200 pt-3">
            <button type="button" :title="open ? undefined : 'Logout'"
                class="flex w-full items-center gap-3 rounded-lg py-2.5 text-[15px] font-medium text-stone-500 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                :class="open ? 'px-3' : 'justify-center px-0'"
                :disabled="isSigningOut" @click="handleLogout">
                <Icon name="i-tabler-logout" class="h-5 w-5 shrink-0" />
                <span class="whitespace-nowrap" :class="open ? '' : 'sr-only'">{{ isSigningOut ? 'Signing out...' : 'Logout' }}</span>
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
