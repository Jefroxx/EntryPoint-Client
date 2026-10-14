<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Audit log</h1>
            <p class="dashboard-heading mt-1 text-crimson">Who changed what: approvals, fines, the catalog, settings and every account or role change.</p>
        </div>

        <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
            <LibrarianSearchInput id="audit-search" v-model="search" placeholder="Search a person or what they did" />
            <select v-model="area" aria-label="Filter by area"
                class="h-[42px] rounded-xl border bg-white px-3 text-[14px] outline-none transition-colors hover:bg-stone-50 focus:ring-2 focus:ring-accent-200"
                :class="area ? 'border-accent-300 text-stone-800' : 'border-stone-200 text-stone-500'">
                <option value="">All areas</option>
                <option v-for="(label, key) in areas" :key="key" :value="key">{{ label }}</option>
            </select>
            <div class="flex-1"></div>
            <LibrarianResetFiltersButton @click="search = ''; area = ''" />
            <ButtonsButton variant="ghost" :disabled="exporting || !rows.length" @click="exportCsv">
                <Icon :name="exporting ? 'i-tabler-loader-2' : 'i-tabler-download'" class="h-3.5 w-3.5" :class="exporting ? 'animate-spin' : ''" />Export CSV
            </ButtonsButton>
        </div>

        <LibrarianTableShell :columns="['When', 'Who', 'What happened']" :loading="pending && !data" :empty="rows.length === 0"
            :empty-text="hasFilters ? 'Nothing in the log matches these filters.' : 'Nothing has been recorded yet.'" min-width="720px">
            <!-- Phones: one card per entry. -->
            <template #cards>
                <li v-for="entry in rows" :key="`card-${entry.logID}`" class="px-4 py-3.5">
                    <p class="text-[14.5px] font-medium leading-snug text-stone-900">{{ entry.summary }}</p>
                    <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-stone-500">
                        <span class="font-semibold text-stone-700">{{ entry.actorName }}</span>
                        <span class="text-stone-300">·</span>{{ roleLabel(entry.actorRole) }}
                        <span class="text-stone-300">·</span><span class="font-data">{{ formatDateTime(entry.created_at) }}</span>
                    </p>
                </li>
            </template>

            <tr v-for="(entry, index) in rows" :key="entry.logID" class="row-fade-in border-b border-stone-100 last:border-0"
                :style="{ animationDelay: `${index * 25}ms` }">
                <td class="font-data whitespace-nowrap px-4 py-3 text-[13px] text-stone-500">{{ formatDateTime(entry.created_at) }}</td>
                <td class="px-4 py-3">
                    <p class="text-[14.5px] font-semibold text-stone-900">{{ entry.actorName }}</p>
                    <p class="text-[12.5px] text-stone-400">{{ roleLabel(entry.actorRole) }}</p>
                </td>
                <td class="px-4 py-3 text-[14.5px] text-stone-800">{{ entry.summary }}</td>
            </tr>
        </LibrarianTableShell>

        <div v-if="logs" class="mt-3 flex items-center justify-between text-[13.5px] text-stone-400">
            <span>Showing {{ rows.length }} of {{ logs.total }} entries</span>
            <span>Page {{ logs.current_page }} of {{ logs.last_page }}</span>
        </div>

        <div v-if="logs && logs.last_page > 1" class="mt-3 flex items-center justify-center gap-2">
            <ButtonsButton variant="ghost" size="sm" :disabled="logs.current_page <= 1" @click="pageNumber--">
                <Icon name="i-tabler-chevron-left" class="h-3.5 w-3.5" />Previous
            </ButtonsButton>
            <ButtonsButton variant="ghost" size="sm" :disabled="logs.current_page >= logs.last_page" @click="pageNumber++">
                Next<Icon name="i-tabler-chevron-right" class="h-3.5 w-3.5" />
            </ButtonsButton>
        </div>
        <AlertToast />
    </div>
</template>

<script setup lang="ts">
import { adminService, type AuditEntry } from '~/services/adminService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({ middleware: 'admin', layout: 'librarian' })
useHead({ title: 'Audit log' })

const search = ref('')
const debouncedSearch = ref('')
const area = ref('')
const pageNumber = ref(1)

let timer: ReturnType<typeof setTimeout>
watch(search, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => { debouncedSearch.value = value.trim(); pageNumber.value = 1 }, 300)
})
watch(area, () => { pageNumber.value = 1 })

const { data, pending } = useAsyncData(
    'admin-audit',
    () => adminService.auditLogs({ search: debouncedSearch.value, area: area.value, page: pageNumber.value }),
    { lazy: true, watch: [debouncedSearch, area, pageNumber] },
)

const areas = computed(() => data.value?.areas ?? {})
const logs = computed(() => data.value?.logs ?? null)
const rows = computed(() => logs.value?.data ?? [])
const hasFilters = computed(() => !!(debouncedSearch.value || area.value))

// Everything that matches the search and area, not just this page: fetched 500 at a time.
const exporting = ref(false)
const alert = useAlert()

async function exportCsv() {
    exporting.value = true
    try {
        const all: AuditEntry[] = []
        let next = 1
        let last = 1
        do {
            const result = await adminService.auditLogs({ search: debouncedSearch.value, area: area.value, page: next, perPage: 500 })
            all.push(...result.logs.data)
            last = result.logs.last_page
            next++
        } while (next <= last)

        downloadCsv(`audit-log-${new Date().toISOString().slice(0, 10)}.csv`, [
            ['When', 'Who', 'Role', 'What happened'],
            ...all.map((e) => [formatDateTime(e.created_at), e.actorName, roleLabel(e.actorRole), e.summary]),
        ])
    } catch (error) {
        alert.error('Could not export the log', apiErrorMessage(error))
    } finally {
        exporting.value = false
    }
}

const ROLE_LABELS: Record<string, string> = { admin: 'Administrator', librarian: 'Librarian', assistant: 'Student assistant', system: 'System' }
const roleLabel = (role: string) => ROLE_LABELS[role] ?? role
</script>
