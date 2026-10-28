<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Data privacy</h1>
            <p class="dashboard-heading mt-1 text-crimson">Under the Data Privacy Act, people can ask for a copy of their data, or to be forgotten.</p>
        </div>

        <div class="mb-5 grid gap-3 md:grid-cols-2">
            <div class="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600"><Icon name="i-tabler-file-download" class="h-[18px] w-[18px]" /></span>
                <div>
                    <h2 class="text-[14.5px] font-bold text-stone-900">A copy of their data</h2>
                    <p class="mt-0.5 text-[13px] leading-snug text-stone-500">Their details, loans, fines, visits, reservations, wishlist, rewards and notifications, in one file to hand over.</p>
                </div>
            </div>
            <div class="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><Icon name="i-tabler-user-off" class="h-[18px] w-[18px]" /></span>
                <div>
                    <h2 class="text-[14.5px] font-bold text-stone-900">Anonymize an account</h2>
                    <p class="mt-0.5 text-[13px] leading-snug text-stone-500">Removes their name, email, phone, address, birth date and ID, and closes the account. The library's loan, fine and visit records stay, but are no longer about a named person.</p>
                </div>
            </div>
        </div>

        <LibrarianSearchInput id="privacy-search" v-model="term" class="mb-4 !max-w-none" placeholder="Search by name, email or ID number" />

        <p v-if="term.trim().length < 2" class="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-[14.5px] text-stone-500">
            Type at least two letters to find a member: a student, a faculty member or a staff member.
        </p>
        <p v-else-if="searching && !results.length" class="py-6 text-center text-[14px] text-stone-500">Searching…</p>
        <p v-else-if="!results.length" class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[14.5px] text-stone-500">Nobody matches “{{ term.trim() }}”.</p>

        <ul v-else class="space-y-3">
            <li v-for="m in results" :key="m.uuid" class="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
                <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="flex min-w-0 items-start gap-3">
                        <LibrarianStudentAvatar :name="m.name" />
                        <div class="min-w-0">
                            <p class="truncate text-[15.5px] font-bold text-stone-900">{{ m.name }}</p>
                            <p class="font-data truncate text-[12.5px] text-stone-500">{{ m.idNumber }} · {{ m.email }}</p>
                            <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <LibrarianStatusPill :label="typeLabel[m.memberType]" tone="info" />
                                <span v-if="m.detail" class="text-[12.5px] text-stone-500">{{ m.detail }}</span>
                                <LibrarianStatusPill v-if="m.isAnonymized" label="Anonymized" tone="neutral" />
                                <LibrarianStatusPill v-else-if="m.isDisabled" label="Disabled" tone="danger" />
                            </div>
                        </div>
                    </div>

                    <div v-if="!m.isAnonymized" class="flex w-full flex-wrap gap-2 sm:w-auto">
                        <ButtonsButton variant="ghost" class="flex-1 sm:flex-none" :disabled="busyUuid === m.uuid" @click="download(m)">
                            <Icon :name="busyUuid === m.uuid ? 'i-tabler-loader-2' : 'i-tabler-download'" class="h-3.5 w-3.5" :class="busyUuid === m.uuid ? 'animate-spin' : ''" />Download their data
                        </ButtonsButton>
                        <ButtonsButton variant="danger" class="flex-1 sm:flex-none" :disabled="m.blockers.length > 0 || busyUuid === m.uuid" @click="ask(m)">
                            <Icon name="i-tabler-user-off" class="h-3.5 w-3.5" />Anonymize
                        </ButtonsButton>
                    </div>
                </div>

                <p v-if="!m.isAnonymized && m.blockers.length" class="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] leading-snug text-amber-900">
                    <Icon name="i-tabler-alert-triangle" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Can't be anonymized yet. {{ m.blockers.join(' ') }} Settle those first.</span>
                </p>
            </li>
        </ul>

        <LibrarianConfirmModal :open="isConfirmOpen" title="Anonymize this account?"
            :message="`This removes ${target ? target.name + '’s' : 'their'} name, email, phone, address, birth date and ID, and closes the account for good. Their loans, fines and visits stay in the library's records without a name. This can't be undone. Download their data first if they asked for a copy.`"
            confirm-label="Anonymize account" :loading="anonymizing" @close="isConfirmOpen = false" @confirm="anonymize" />

        <AlertToast />
    </div>
</template>

<script setup lang="ts">
import { adminService, type PrivacyMember } from '~/services/adminService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({ middleware: 'admin', layout: 'librarian' })
useHead({ title: 'Data privacy' })

const alert = useAlert()

const typeLabel = { student: 'Student', faculty: 'Faculty', staff: 'Staff' } as const

const term = ref('')
const results = ref<PrivacyMember[]>([])
const searching = ref(false)

let timer: ReturnType<typeof setTimeout>
let latest = 0

async function runSearch() {
    const q = term.value.trim()
    if (q.length < 2) { results.value = []; return }

    const ticket = ++latest
    searching.value = true
    try {
        const found = await adminService.searchPrivacy(q)
        // An answer to an older search must not replace a newer one.
        if (ticket === latest) results.value = found.members
    } catch (error) {
        if (ticket === latest) alert.error('Could not search', apiErrorMessage(error))
    } finally {
        if (ticket === latest) searching.value = false
    }
}

watch(term, () => {
    clearTimeout(timer)
    timer = setTimeout(runSearch, 300)
})

/* ---------- a copy of their data ---------- */
const busyUuid = ref<string | null>(null)

async function download(member: PrivacyMember) {
    busyUuid.value = member.uuid
    try {
        const data = await adminService.exportMemberData(member.uuid)
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
        const link = document.createElement('a')
        link.href = url
        link.download = `member-data-${member.uuid.slice(0, 8)}.json`
        link.click()
        URL.revokeObjectURL(url)
        alert.success('Their data was downloaded', 'Hand the file over in person, and keep it safe: it holds personal details.')
    } catch (error) {
        alert.error('Could not export their data', apiErrorMessage(error))
    } finally {
        busyUuid.value = null
    }
}

/* ---------- anonymize ---------- */
const target = ref<PrivacyMember | null>(null)
const isConfirmOpen = ref(false)
const anonymizing = ref(false)

function ask(member: PrivacyMember) {
    target.value = member
    isConfirmOpen.value = true
}

async function anonymize() {
    const member = target.value
    if (!member) return
    anonymizing.value = true
    try {
        await adminService.anonymizeMember(member.uuid)
        alert.success('The account was anonymized')
        isConfirmOpen.value = false
        term.value = ''
        results.value = []
    } catch (error) {
        const fields = serverFieldErrors(error)
        alert.error('Could not anonymize the account', fields?.account ?? apiErrorMessage(error))
        isConfirmOpen.value = false
        await runSearch()
    } finally {
        anonymizing.value = false
    }
}
</script>
