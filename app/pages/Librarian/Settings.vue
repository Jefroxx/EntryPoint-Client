<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Settings</h1>
            <p class="dashboard-heading mt-1 text-amber-900">Configure loan periods, fines and your account.</p>
        </div>

        <div class="grid max-w-[940px] grid-cols-1 items-start gap-6 md:grid-cols-[200px_1fr]">
            <nav class="flex gap-1 md:sticky md:top-4 md:flex-col" aria-label="Settings sections">
                <button v-for="section in sections" :key="section.value" type="button"
                    class="rounded-[10px] px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors duration-150"
                    :class="active === section.value ? 'bg-accent-100 font-semibold text-accent-700' : 'text-stone-500 hover:bg-stone-100'"
                    @click="active = section.value">
                    {{ section.label }}
                </button>
            </nav>

            <div class="relative min-h-[200px]">
                <template v-if="settings">
                    <LibrarianLoanPeriodsSettings v-if="active === 'loans'" :periods="settings.loanPeriods"
                        @saved="refetch" />
                    <LibrarianFineRulesSettings v-else-if="active === 'fines'" :rules="settings.fineRules"
                        @saved="refetch" />
                    <LibrarianAccountSettings v-else :account="settings.account" @saved="refetch" />
                </template>
                <LibrarianLoadingOverlay :loading="pending && !settings" />
            </div>
        </div>
    

        <AlertToast />
    
    </div>
</template>

<script setup lang="ts">
import { settingsService } from '~/services/settingsService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})


const sections = [
    { label: 'Loan periods', value: 'loans' },
    { label: 'Fines', value: 'fines' },
    { label: 'Account', value: 'account' },
]
const active = ref('loans')

const { data: settings, pending, execute: refetch } =
    useAsyncData('librarian-settings', () => settingsService.fetchSettings(), { lazy: true })
</script>
