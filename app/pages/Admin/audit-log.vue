<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Audit log</h1>
            <p class="dashboard-heading mt-1 text-crimson">Who changed what: approvals, fines, the catalog, settings and every account or role change.</p>
        </div>

        <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
            <LibrarianSearchInput id="audit-search" v-model="search" class="!max-w-[560px] !basis-[480px]" placeholder="Search a person or what they did" />
            <LibrarianFilterMenu :model-value="{ area }" :groups="areaGroups" @update:model-value="area = $event.area ?? ''" />
            <div class="flex-1"></div>
            <LibrarianResetFiltersButton @click="search = ''; area = ''" />
            <ButtonsButton variant="ghost" class="toolbar-full" :disabled="exporting || !rows.length" @click="exportCsv">
                <Icon :name="exporting ? 'i-tabler-loader-2' : 'i-tabler-download'" class="h-3.5 w-3.5" :class="exporting ? 'animate-spin' : ''" />Export CSV
            </ButtonsButton>
        </div>

        <LibrarianTableShell :columns="['When', 'Who', 'What happened']" :loading="!data && !error" :empty="rows.length === 0"
            :empty-text="hasFilters ? 'Nothing in the log matches these filters.' : 'Nothing has been recorded yet.'" min-width="720px">
            <!-- Phones: one card per entry. -->
            <template #cards>
                <li v-for="entry in rows" :key="`card-${entry.logID}`">
                    <div role="button" tabindex="0" class="h-full cursor-pointer px-4 py-3.5 transition-colors duration-150 hover:bg-stone-100 focus-visible:bg-stone-100 focus-visible:outline-none active:bg-stone-200"
                        @click="selected = entry" @keydown.enter.self="selected = entry">
                        <p class="text-[14.5px] font-medium leading-snug text-stone-900">{{ entry.summary }}</p>
                        <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-stone-500">
                            <span class="font-semibold text-stone-700">{{ entry.actorName }}</span>
                            <span class="text-stone-300">·</span>{{ roleLabel(entry.actorRole) }}
                            <span class="text-stone-300">·</span><span class="font-data">{{ formatDateTime(entry.created_at) }}</span>
                        </p>
                    </div>
                </li>
            </template>

            <tr v-for="(entry, index) in rows" :key="entry.logID" tabindex="0"
                class="row-fade-in cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
                @click="selected = entry" @keydown.enter.self="selected = entry"
                :style="{ animationDelay: `${index * 25}ms` }">
                <td class="font-data whitespace-nowrap px-4 py-3 text-[13px] text-stone-500">{{ formatDateTime(entry.created_at) }}</td>
                <td class="px-4 py-3">
                    <p class="text-[14.5px] font-semibold text-stone-900">{{ entry.actorName }}</p>
                    <p class="text-[12.5px] text-stone-500">{{ roleLabel(entry.actorRole) }}</p>
                </td>
                <td class="px-4 py-3 text-[14.5px] text-stone-800">{{ entry.summary }}</td>
            </tr>

            <!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
            <LibrarianRecordDrawer :open="!!selected" heading="Activity details" :title="selectedParts.what"
                :subtitle="selectedArea" :fields="selectedFields" @close="selected = null" />
        </LibrarianTableShell>

        <LibrarianPagination v-if="logs" :shown="rows.length" :total="logs.total" noun="entries"
            :page="logs.current_page" :last-page="logs.last_page" @change="pageNumber = $event" />
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

// The page size follows the card grid (1 column on phones, 2 from 640px, 3 from 1536px: the same breakpoints as the
// grid in TableShell), as whole rows, so no page ends a row with a gap. A resize that changes the columns starts over at page 1.
const ROWS = 6
const columnsNow = () => (!import.meta.client ? 1 : window.matchMedia('(min-width: 1536px)').matches ? 3 : window.matchMedia('(min-width: 640px)').matches ? 2 : 1)
const columns = ref(columnsNow()) // the list is fetched in the browser only (server: false below), where the width is known
const perPage = computed(() => columns.value * ROWS)
watch(perPage, () => { pageNumber.value = 1 })

onMounted(() => {
    const two = window.matchMedia('(min-width: 640px)')
    const three = window.matchMedia('(min-width: 1536px)')
    const measure = () => { columns.value = columnsNow() }
    // Resizing across a breakpoint (a rotated tablet, a dragged window) changes the page size.
    two.addEventListener('change', measure)
    three.addEventListener('change', measure)
    onBeforeUnmount(() => { two.removeEventListener('change', measure); three.removeEventListener('change', measure) })
})

const { data, error } = useAsyncData(
    'admin-audit',
    () => adminService.auditLogs({ search: debouncedSearch.value, area: area.value, page: pageNumber.value, perPage: perPage.value }),
    { lazy: true, server: false, watch: [debouncedSearch, area, pageNumber, perPage] },
)

const areas = computed(() => data.value?.areas ?? {})
const areaGroups = computed(() => [{
    key: 'area',
    title: 'Area',
    allValue: '', // the log's own "no area" is an empty string
    options: [{ value: '', label: 'All areas' }, ...Object.entries(areas.value).map(([value, label]) => ({ value, label }))],
}])
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

        downloadCsv(`audit-log-${toYmd()}.csv`, [
            ['When', 'Who', 'Role', 'What happened'],
            ...all.map((e) => [formatDateTime(e.created_at), e.actorName, roleLabel(e.actorRole), e.summary]),
        ])
    } catch (error) {
        alert.error('Could not export the log', apiErrorMessage(error))
    } finally {
        exporting.value = false
    }
}

// Click an entry to see all of it in the side drawer. The summary reads "Added a book: Title", so it is split at the
// first colon into what was done and which record it was done to.
const selected = ref<AuditEntry | null>(null)
// Keeps the last entry while the drawer slides out, so its text doesn't blank mid-animation.
const shown = ref<AuditEntry | null>(null)
watch(selected, (entry) => { if (entry) shown.value = entry })

const selectedParts = computed(() => {
    const summary = shown.value?.summary ?? ''
    const cut = summary.indexOf(': ')
    return cut === -1 ? { what: summary, record: '' } : { what: summary.slice(0, cut), record: summary.slice(cut + 2) }
})
const selectedArea = computed(() => areas.value[(shown.value?.action ?? '').split('.')[0] ?? ''] ?? '')

const selectedFields = computed(() => {
    const entry = shown.value
    if (!entry) return []
    const when = new Date(entry.created_at)
    return [
        { label: 'Record', value: selectedParts.value.record, wide: true },
        { label: 'Done by', value: entry.actorName },
        { label: 'Role', value: roleLabel(entry.actorRole) },
        { label: 'When', wide: true, value: `${formatLongDate(when)} · ${when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}` },
        { label: 'Entry no.', value: `#${entry.logID}`, mono: true },
        { label: 'Action code', value: entry.action, mono: true },
    ].filter((field) => field.label !== 'Record' || field.value) // old entries like "Checked out a book" name no record
})

const ROLE_LABELS: Record<string, string> = { admin: 'Administrator', librarian: 'Librarian', assistant: 'Student assistant', system: 'System' }
const roleLabel = (role: string) => ROLE_LABELS[role] ?? role
</script>
