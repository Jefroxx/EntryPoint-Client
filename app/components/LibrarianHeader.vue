<template>
    <header class="flex h-[75px] w-full items-center justify-between border-b border-amber-100 bg-white px-6">
        <!-- Left: hamburger + logo -->
        <div class="flex items-center gap-4">
            <button type="button"
                class="flex h-9 w-9 items-center justify-center rounded-md text-amber-900 transition hover:bg-amber-50"
                aria-label="Toggle sidebar" @click="$emit('toggle-sidebar')">
                <Icon name="i-lucide-menu" class="h-6 w-6" />
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
}>()

defineEmits<{
    (e: 'toggle-sidebar'): void
}>()
</script>