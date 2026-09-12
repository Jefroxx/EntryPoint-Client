<template>
    <aside class="flex h-screen w-56 flex-col justify-between border-r border-amber-100 bg-white px-3 py-4 ">
        <nav class="space-y-1">
            <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
                class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-50"
                active-class="bg-amber-950 text-white hover:bg-amber-950">
                <Icon :name="link.icon" class="h-5 w-5" />
                {{ link.label }}
            </NuxtLink>
        </nav>

        <div class="border-t border-amber-100 pt-3">
            <button type="button"
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isSigningOut" @click="handleLogout">
                <Icon name="i-lucide-log-out" class="h-5 w-5" />
                {{ isSigningOut ? 'Signing out...' : 'Logout' }}
            </button>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { authService } from '~/services/auth/AuthService'

const isSigningOut = ref(false)

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

async function handleLogout() {
    isSigningOut.value = true
    try {
        await authService.logout()
    } finally {
        useCookie('_token').value = null
        useCookie('_uuid').value = null
        useCookie('_role').value = null
        await navigateTo('/')
    }
}
</script>
