<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Resources</h1>
            <p class="dashboard-heading mt-1 text-amber-900">Manage library computers, rooms and study spaces.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" class="mb-5" :tabs="[
            { label: 'Resources', value: 'resources' },
            { label: 'Usage Log', value: 'log' },
        ]" />

        <template v-if="activeTab === 'resources'">
            <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <LibrarianCatalogStatTile label="Total Resources" :value="resources.length" icon="i-lucide-monitor"
                    tone="accent" />
                <LibrarianCatalogStatTile label="Available" :value="countByStatus('Available')"
                    icon="i-lucide-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="In Use" :value="countByStatus('In Use')" icon="i-lucide-clock"
                    tone="warning" />
                <LibrarianCatalogStatTile label="Unavailable" :value="countByStatus('Unavailable')"
                    icon="i-lucide-circle-x" tone="danger" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="resource-search" v-model="resourceSearch" placeholder="Search resources" />

                <select v-model="typeFilter"
                    class="h-[42px] rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="">All types</option>
                    <option v-for="type in resourceTypes" :key="type" :value="type">{{ type }}</option>
                </select>

                <div class="flex-1"></div>

                <ButtonsButton variant="primary" @click="openForm(null)">
                    <Icon name="i-lucide-plus" class="h-3.5 w-3.5" />Add Resource
                </ButtonsButton>
            </div>

            <div v-if="filteredResources.length" class="relative grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <LibrarianResourceCard v-for="(resource, index) in filteredResources" :key="resource.resID"
                    :resource="resource" :index="index" :now-ms="nowMs" @start="openStart" @end="handleEnd"
                    @edit="openForm" @toggle="handleToggle" @delete="askDelete" />
            </div>
            <div v-else
                class="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white">
                <p class="text-[15px] text-stone-400">
                    {{ resourcesPending ? 'Loading resources…' : 'No resources match your filters.' }}
                </p>
            </div>
        </template>

        <template v-else>
            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="usage-search" v-model="logSearch" placeholder="Search student or resource" />

                <select v-model="logFilter"
                    class="h-[42px] rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="all">All sessions</option>
                    <option value="active">Active only</option>
                </select>
            </div>

            <LibrarianUsageLogTable :logs="pagedLogs" :loading="logsPending" :now-ms="nowMs" />

            <LibrarianPagination :shown="pagedLogs.length" :total="filteredLogs.length" noun="sessions"
                :page="logPage" :last-page="logTotalPages" @change="logPage = $event" />
        </template>
    

        <LibrarianResourceFormModal :open="isFormOpen" :resource="editing" :busy="busy" @close="isFormOpen = false"
            @submit="handleSave" />
        <LibrarianStartSessionModal :open="isStartOpen" :resource="startTarget" :busy="busy" @close="isStartOpen = false"
            @submit="handleStart" />
        <LibrarianConfirmModal :open="deleteOpen" title="Delete resource?"
            :message="`“${deleteTarget?.name ?? 'This resource'}” will be removed from the library. Its past sessions stay in the log.`"
            confirm-label="Delete" :loading="busy" @close="deleteOpen = false" @confirm="handleDelete" />

        <AlertToast />
    
    </div>
</template>

<script setup lang="ts">
import { resourceService, type ResourceRecord, type ResourceStatus } from '~/services/resourceService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Resources' })

const { perform } = useAction()

const activeTab = ref('resources')

// Ticks so "since 9:40 AM · 42m" stays current without refetching.
const nowMs = ref(Date.now())
let ticker: ReturnType<typeof setInterval>
onMounted(() => { ticker = setInterval(() => { nowMs.value = Date.now() }, 30_000) })
onUnmounted(() => clearInterval(ticker))

// ---- Resources ----
const { data: resourcesResponse, pending: resourcesPending, execute: refetchResources } =
    useLiveAsyncData('resources-list', () => resourceService.fetchResources(), { lazy: true })

const resources = computed(() => resourcesResponse.value?.resources ?? [])
const resourceSearch = ref('')
const typeFilter = ref('')

const resourceTypes = computed(() => [...new Set(resources.value.map((r) => r.resourceType))].sort())
const countByStatus = (status: ResourceStatus) => resources.value.filter((r) => r.status === status).length

const filteredResources = computed(() => {
    const term = resourceSearch.value.trim().toLowerCase()
    return resources.value.filter((r) => {
        if (typeFilter.value && r.resourceType !== typeFilter.value) return false
        return !term || r.name.toLowerCase().includes(term) || r.resourceType.toLowerCase().includes(term)
    })
})

// ---- Usage log ----
const { data: logsResponse, pending: logsPending, execute: refetchLogs } =
    useLiveAsyncData('resource-usage-logs', () => resourceService.fetchUsageLogs(), { lazy: true })

const logs = computed(() => logsResponse.value?.usageLogs ?? [])
const logSearch = ref('')
const logFilter = ref<'all' | 'active'>('all')
const logPage = ref(1)
const LOGS_PER_PAGE = 10

const filteredLogs = computed(() => {
    const term = logSearch.value.trim().toLowerCase()
    return logs.value.filter((log) => {
        if (logFilter.value === 'active' && log.endTime) return false
        if (!term) return true
        return (
            personName(log.student?.user).toLowerCase().includes(term) ||
            (log.resource?.name ?? '').toLowerCase().includes(term)
        )
    })
})

const logTotalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / LOGS_PER_PAGE)))
const pagedLogs = computed(() => {
    const start = (logPage.value - 1) * LOGS_PER_PAGE
    return filteredLogs.value.slice(start, start + LOGS_PER_PAGE)
})
watch([logSearch, logFilter], () => { logPage.value = 1 })

// ---- Actions ----
const busy = ref(false)
const refreshAll = () => [refetchResources, refetchLogs]

const isFormOpen = ref(false)
const editing = ref<ResourceRecord | null>(null)

function openForm(resource: ResourceRecord | null) {
    editing.value = resource
    isFormOpen.value = true
}

async function handleSave(payload: { name: string; resourceType: string }) {
    busy.value = true
    const target = editing.value
    const ok = await perform(
        () => target ? resourceService.updateResource(target.resID, payload) : resourceService.createResource(payload),
        target ? 'Resource updated' : 'Resource added',
        'Could not save resource',
        [refetchResources],
    )
    busy.value = false
    if (ok) isFormOpen.value = false
}

const isStartOpen = ref(false)
const startTarget = ref<ResourceRecord | null>(null)

function openStart(resource: ResourceRecord) {
    startTarget.value = resource
    isStartOpen.value = true
}

async function handleStart(studentID: number) {
    if (!startTarget.value) return
    const resID = startTarget.value.resID
    busy.value = true
    const ok = await perform(() => resourceService.startSession({ resID, studentID }), 'Session started', 'Could not start session', refreshAll())
    busy.value = false
    if (ok) isStartOpen.value = false
}

function handleEnd(resource: ResourceRecord) {
    if (!resource.active_usage) return
    return perform(() => resourceService.endSession(resource.active_usage!.usageID), 'Session ended', 'Could not end session', refreshAll())
}

function handleToggle(resource: ResourceRecord) {
    const next = resource.status === 'Unavailable' ? 'Available' : 'Unavailable'
    return perform(() => resourceService.updateResource(resource.resID, { status: next }), `Marked ${next.toLowerCase()}`, 'Could not update resource', [refetchResources])
}

const deleteTarget = ref<ResourceRecord | null>(null)
const deleteOpen = ref(false)
const askDelete = (resource: ResourceRecord) => {
    deleteTarget.value = resource
    deleteOpen.value = true
}

async function handleDelete() {
    if (!deleteTarget.value) return
    const resID = deleteTarget.value.resID
    busy.value = true
    const ok = await perform(() => resourceService.deleteResource(resID), 'Resource deleted', 'Could not delete resource', [refetchResources])
    busy.value = false
    if (ok) deleteOpen.value = false
}
</script>
