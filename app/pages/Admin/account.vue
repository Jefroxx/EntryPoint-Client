<template>
    <div>
        <div v-if="error && !account" role="alert" class="rounded-2xl border border-red-100 bg-red-50 p-5 text-[15px] text-red-600">
            <p class="font-semibold">Couldn't load your account.</p>
            <p class="mt-1 leading-snug">{{ apiErrorMessage(error, 'The server did not respond.') }}</p>
            <ButtonsButton variant="ghost" class="mt-3" @click="refetch()">Try again</ButtonsButton>
        </div>

        <!-- The same "Your account" screen librarians and assistants have under Settings → Account. -->
        <LibrarianAccountSettings v-else-if="account" :account="account" standalone @saved="refetch" />

        <div v-else class="relative min-h-[240px]">
            <LibrarianLoadingOverlay :loading="true" />
        </div>

        <AlertToast />
    </div>
</template>

<script setup lang="ts">
import { settingsService } from '~/services/settingsService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({ middleware: 'admin', layout: 'librarian' })
useHead({ title: 'Your account' })

// The signed-in account (name, email, role, username, phone): the same data Settings → Account shows librarians.
const { data, error, execute: refetch } = useAsyncData('admin-account', () => settingsService.fetchAccount(), { lazy: true })
const account = computed(() => data.value?.account ?? null)
</script>
