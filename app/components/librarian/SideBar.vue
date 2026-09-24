<template>
    <!-- Same measurements as the student sidebar (layouts/student.vue): 232px expanded, a 76px icon rail
         folded, 44px rows, 19px icons, 14.5px labels. Labels stay for screen readers when folded, and
         each item names itself on hover. -->
    <!-- Full height with the logo on top, like the student sidebar; the header sits beside it. Sticky and
         exactly one screen tall, so it stays put while long pages scroll. -->
    <aside id="librarian-sidebar"
        class="no-scrollbar sticky top-0 flex h-dvh shrink-0 flex-col self-start overflow-y-auto overflow-x-hidden border-r border-stone-200 bg-white px-3 pb-4 transition-[width] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
        :class="open ? 'w-[232px]' : 'w-[76px]'">
        <!-- Wordmark when open, the round mark when folded to the icon rail (same as the student side). -->
        <NuxtLink to="/librarian/dashboard" aria-label="EntryPoint home"
            class="-mx-3 flex h-[68px] shrink-0 items-center leading-none"
            :class="open ? 'justify-start px-6' : 'justify-center'">
            <img v-if="open" src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-8 w-auto max-w-none" />
            <img v-else src="/favicon.png" alt="" class="h-8 w-8" />
        </NuxtLink>

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
import { authService } from '~/services/auth/AuthService'

const props = withDefaults(defineProps<{ open?: boolean }>(), { open: true })

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
