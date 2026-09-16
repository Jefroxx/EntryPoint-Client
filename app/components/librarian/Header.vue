<template>
    <header class="flex h-[75px] w-full items-center justify-between border-b border-amber-100 bg-white px-6">
        <!-- Left: hamburger + logo -->
        <div class="flex items-center gap-4">
            <button type="button"
                class="flex h-9 w-9 items-center justify-center rounded-md text-amber-900 transition hover:bg-amber-50"
                aria-label="Toggle sidebar" :aria-expanded="isSidebarOpen" @click="$emit('toggle-sidebar')">
                <span class="relative block h-4 w-5">
                    <span
                        class="absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-in-out"
                        :class="isSidebarOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0 rotate-0'" />
                    <span
                        class="absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded-full bg-current transition-all duration-300 ease-in-out"
                        :class="isSidebarOpen ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'" />
                    <span
                        class="absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-in-out"
                        :class="isSidebarOpen ? 'bottom-1/2 translate-y-1/2 -rotate-45' : 'bottom-0 rotate-0'" />
                </span>
            </button>

            <a href="/dashboard" class="flex items-center leading-none">
                <img src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-8 w-auto" />
            </a>
        </div>

        <!-- Right: notifications + profile -->
        <div class="flex items-center gap-5">
            <button type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full text-amber-900 transition hover:bg-amber-50"
                aria-label="Notifications">
                <Icon name="i-lucide-bell" class="h-5 w-5" />
            </button>

            <button type="button" class="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-amber-200"
                aria-label="User menu">
                <img :src="avatarUrl" alt="User avatar" class="h-full w-full object-cover" />
            </button>
        </div>
    </header>
</template>

<script setup lang="ts">
defineProps<{
    avatarUrl: string
    isSidebarOpen: boolean
}>()

defineEmits<{
    (e: 'toggle-sidebar'): void
}>()
</script>