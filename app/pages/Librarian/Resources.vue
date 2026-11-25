<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Resources</h1>
            <p class="dashboard-heading mt-1 text-crimson">Manage library computers, rooms and study spaces.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" wrap class="mb-5" :tabs="[
            { label: 'Resources', value: 'resources' },
            { label: 'Types', value: 'types' },
            { label: 'Usage Log', value: 'log' },
        ]" />

        <!-- ============ Resources ============ -->
        <template v-if="activeTab === 'resources'">
            <!-- The counts, and each is the filter for the list under it (tap again to see everything). -->
            <div class="phone-stats mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <LibrarianCatalogStatTile label="Total Resources" :value="resourcesResponse ? resources.length : '—'" icon="i-tabler-device-desktop" tone="accent" />
                <LibrarianStatTileButton v-for="tile in statusTiles" :key="tile.status" :label="tile.label" :value="resourcesResponse ? countByStatus(tile.status) : '—'"
                    :icon="tile.icon" :tone="tile.tone" :active="statusFilter === tile.status" @click="statusFilter = statusFilter === tile.status ? '' : tile.status" />
            </div>

            <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="resource-search" v-model="resourceSearch" class="!min-w-[210px] !max-w-[560px] !basis-[480px]" placeholder="Search resources" />
                <LibrarianFilterMenu class="toolbar-full" v-model="resourceFilters" :groups="resourceFilterGroups" />
                <div class="flex-1"></div>
                <ButtonsButton variant="primary" class="toolbar-full" @click="openForm(null)">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add Resource
                </ButtonsButton>
            </div>

            <LibrarianCardSkeleton v-if="resourcesPending && !resourcesResponse" />
            <div v-else-if="filteredResources.length" class="relative grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <LibrarianResourceCard v-for="(resource, index) in filteredResources" :key="resource.resID"
                    :resource="resource" :index="index" :now-ms="nowMs" @start="openStart" @end="askEnd"
                    @edit="openForm" @label="openLabel" @toggle="askToggle" @delete="askDelete" />
            </div>
            <p v-else class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[15px] text-stone-500">
                {{ resources.length ? 'No resources match your filters.' : 'No resources yet. Use Add Resource to add a computer, room or study space.' }}
            </p>
        </template>

        <!-- ============ Types ============ -->
        <LibrarianResourceTypesPanel v-else-if="activeTab === 'types'" :types="typeRows" :loading="typesPending"
            @add="openTypeForm(null)" @edit="openTypeForm" @delete="askDeleteType" />

        <!-- ============ Usage log ============ -->
        <template v-else>
            <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2 lg:flex-nowrap">
                <LibrarianSearchInput id="usage-search" v-model="logSearch" class="!min-w-[210px] !max-w-[560px] !basis-[480px]" placeholder="Search student or resource" />

                <LibrarianFilterMenu class="toolbar-full" v-model="logFilters" :groups="logFilterGroups" />

                <!-- Sort through the log by date: pick a day, or step back and forward through them. -->
                <LibrarianDayPicker class="toolbar-full" v-model="logDate" :max="todayYmd" empty-value="" reset-label="All dates" />
                <div class="flex-1"></div>
            </div>

            <LibrarianUsageLogTable :logs="logs?.data ?? []" :loading="logsPending" :now-ms="nowMs" />

            <LibrarianPagination v-if="logs" :shown="logs.data.length" :total="logs.total" noun="sessions"
                :page="logs.current_page" :last-page="logs.last_page" @change="goToLogPage" />
        </template>

        <LibrarianFacilityLabelModal :open="isLabelOpen" :resource="labelResource" @close="isLabelOpen = false" />

        <LibrarianResourceFormModal :open="isFormOpen" :resource="editing" :types="typeNames" :busy="busy" @close="isFormOpen = false"
            @submit="handleSave" />
        <LibrarianResourceTypeFormModal :open="isTypeFormOpen" :type="editingType" :busy="busy" @close="isTypeFormOpen = false"
            @submit="handleSaveType" />
        <LibrarianStartSessionModal :open="isStartOpen" :resource="startTarget" :busy="busy" @close="isStartOpen = false"
            @submit="handleStart" />
        <LibrarianConfirmModal :open="endOpen" title="End This Session?"
            :message="`${endTarget?.active_usage?.student?.user?.firstName ?? 'The student'}'s session on “${endTarget?.name ?? 'this resource'}” will be ended now.`"
            confirm-label="End session" :danger="false" :loading="busy" @close="endOpen = false" @confirm="handleEnd" />
        <LibrarianConfirmModal :open="toggleOpen" :title="toggleNext === 'Unavailable' ? 'Mark as unavailable?' : 'Mark as available?'"
            :message="toggleNext === 'Unavailable'
                ? `“${toggleTarget?.name ?? 'This resource'}” can't be used until you mark it available again.`
                : `“${toggleTarget?.name ?? 'This resource'}” can be used again.`"
            :confirm-label="toggleNext === 'Unavailable' ? 'Mark unavailable' : 'Mark available'" :danger="toggleNext === 'Unavailable'"
            :loading="busy" @close="toggleOpen = false" @confirm="handleToggle" />
        <LibrarianConfirmModal :open="deleteOpen" title="Delete Resource?"
            :message="`“${deleteTarget?.name ?? 'This resource'}” will be removed from the library. Its past sessions stay in the log.`"
            confirm-label="Delete" :loading="busy" @close="deleteOpen = false" @confirm="handleDelete" />
        <LibrarianConfirmModal :open="deleteTypeOpen" title="Delete Type?"
            :message="`“${deleteTypeTarget?.name ?? 'This type'}” will be removed from the list. No resource has it, so nothing else changes.`"
            confirm-label="Delete" :loading="busy" @close="deleteTypeOpen = false" @confirm="handleDeleteType" />

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

const activeTab = ref<'resources' | 'types' | 'log'>('resources')
const ALL = 'all'

// Ticks so "since 9:40 AM · 42m" stays current without refetching.
const nowMs = ref(Date.now())
let ticker: ReturnType<typeof setInterval>
onMounted(() => { ticker = setInterval(() => { nowMs.value = Date.now() }, 30_000) })
onUnmounted(() => clearInterval(ticker))

// ---- Types (the list a resource's type is picked from) ----
const { data: typesResponse, pending: typesPending, execute: refetchTypes } =
    useLiveAsyncData('resource-types', () => resourceService.fetchTypes(), { lazy: true })

const types = computed(() => typesResponse.value?.types ?? [])
const typeNames = computed(() => types.value.map((t) => t.name))
const typeRows = computed(() => types.value.map((t) => ({ uuid: t.uuid, name: t.name, count: t.resources_count })))

// ---- Resources ----
const { data: resourcesResponse, pending: resourcesPending, execute: refetchResources } =
    useLiveAsyncData('resources-list', () => resourceService.fetchResources(), { lazy: true })

const resources = computed(() => resourcesResponse.value?.resources ?? [])
const resourceSearch = ref('')
const statusFilter = ref<'' | ResourceStatus>('')
const typeFilter = ref('')

const countByStatus = (status: ResourceStatus) => resources.value.filter((r) => r.status === status).length

// The counts above the list, which are also its status filter. Unavailable is a parked resource, not an alarm, so it is not red.
const statusTiles = [
    { status: 'Available' as const, label: 'Available', icon: 'i-tabler-circle-check', tone: 'success' as const },
    { status: 'In Use' as const, label: 'In Use', icon: 'i-tabler-clock', tone: 'warning' as const },
    { status: 'Unavailable' as const, label: 'Unavailable', icon: 'i-tabler-circle-x', tone: 'accent' as const },
]

const resourceFilterGroups = computed(() => [
    { key: 'status', title: 'Status', options: [{ value: ALL, label: 'Any status' }, ...statusTiles.map((t) => ({ value: t.status, label: t.label }))] },
    { key: 'type', title: 'Type', options: [{ value: ALL, label: 'All types' }, ...typeNames.value.map((name) => ({ value: name, label: name }))] },
])
const resourceFilters = computed({
    get: () => ({ status: statusFilter.value || ALL, type: typeFilter.value || ALL }),
    set: (v) => {
        statusFilter.value = (v.status === ALL ? '' : v.status) as typeof statusFilter.value
        typeFilter.value = v.type === ALL ? '' : v.type
    },
})

const filteredResources = computed(() => {
    const term = resourceSearch.value.trim().toLowerCase()
    return resources.value.filter((r) => {
        if (statusFilter.value && r.status !== statusFilter.value) return false
        if (typeFilter.value && r.resourceType !== typeFilter.value) return false
        return !term || r.name.toLowerCase().includes(term) || r.resourceType.toLowerCase().includes(term)
    })
})

// ---- Usage log (paged and filtered on the server, so it stays quick however long it grows) ----
const logSearch = ref('')
const logStatus = ref<'' | 'active' | 'ended'>('')
const logType = ref('')
const logResource = ref(0)
// One day of the log (Y-m-d); empty shows every date.
const logDate = ref('')
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayYmd = ymd(new Date())
const logPage = ref(1)

const { data: logs, pending: logsPending, execute: refetchLogs } = useLiveAsyncData(
    'resource-usage-logs',
    () => resourceService.fetchUsageLogs({
        search: logSearch.value || undefined,
        status: logStatus.value || undefined,
        type: logType.value || undefined,
        resID: logResource.value || undefined,
        date: logDate.value || undefined,
        page: logPage.value,
        perPage: 12,
    }),
    { lazy: true },
)

// The resource filter only lists resources of the chosen type.
const logResourceOptions = computed(() =>
    resources.value.filter((r) => !logType.value || r.resourceType === logType.value).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
)

const logFilterGroups = computed(() => [
    { key: 'status', title: 'Status', options: [{ value: ALL, label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'ended', label: 'Ended' }] },
    { key: 'type', title: 'Resource type', options: [{ value: ALL, label: 'All types' }, ...typeNames.value.map((name) => ({ value: name, label: name }))] },
    { key: 'resource', title: 'Resource', options: [{ value: ALL, label: 'All resources' }, ...logResourceOptions.value.map((r) => ({ value: String(r.resID), label: r.name }))] },
])
const logFilters = computed({
    get: () => ({ status: logStatus.value || ALL, type: logType.value || ALL, resource: logResource.value ? String(logResource.value) : ALL }),
    set: (v) => {
        logStatus.value = (v.status === ALL ? '' : v.status) as typeof logStatus.value
        logType.value = v.type === ALL ? '' : v.type
        logResource.value = v.resource === ALL ? 0 : Number(v.resource)
    },
})

let logSearchTimeout: ReturnType<typeof setTimeout>
watch(logSearch, () => {
    clearTimeout(logSearchTimeout)
    logSearchTimeout = setTimeout(() => { logPage.value = 1; void refetchLogs() }, 300)
})
watch(logType, () => {
    // A chosen resource of another type no longer fits.
    if (logResource.value && !logResourceOptions.value.some((r) => r.resID === logResource.value)) logResource.value = 0
})
watch([logStatus, logType, logResource, logDate], () => { logPage.value = 1; void refetchLogs() })

function goToLogPage(next: number) {
    logPage.value = next
    void refetchLogs()
}

// ---- Actions ----
const busy = ref(false)
const refreshAll = () => [refetchResources, refetchLogs, refetchTypes]

// A facility's printable barcode label: scanning it at the station starts or ends a session.
const isLabelOpen = ref(false)
const labelResource = ref<ResourceRecord | null>(null)

function openLabel(resource: ResourceRecord) {
    labelResource.value = resource
    isLabelOpen.value = true
}

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
        () => target ? resourceService.updateResource(target.uuid, payload) : resourceService.createResource(payload),
        target ? 'Resource updated' : 'Resource added',
        'Could not save resource',
        [refetchResources, refetchTypes],
    )
    busy.value = false
    if (ok) isFormOpen.value = false
}

// Types: add, rename (the resources follow), delete (only when no resource has it).
const isTypeFormOpen = ref(false)
const editingType = ref<{ uuid: string; name: string } | null>(null)

function openTypeForm(type: { uuid: string; name: string } | null) {
    editingType.value = type
    isTypeFormOpen.value = true
}

async function handleSaveType(name: string) {
    busy.value = true
    const target = editingType.value
    const oldName = target?.name
    const ok = await perform(
        () => target ? resourceService.renameType(target.uuid, { name }) : resourceService.createType({ name }),
        target ? 'Type renamed' : 'Type added',
        'Could not save the type',
        [refetchTypes, refetchResources, refetchLogs],
    )
    busy.value = false
    if (!ok) return
    isTypeFormOpen.value = false
    // A filter set to the old name follows the rename.
    if (oldName && typeFilter.value === oldName) typeFilter.value = name
    if (oldName && logType.value === oldName) logType.value = name
}

const deleteTypeTarget = ref<{ uuid: string; name: string } | null>(null)
const deleteTypeOpen = ref(false)
const askDeleteType = (type: { uuid: string; name: string }) => {
    deleteTypeTarget.value = type
    deleteTypeOpen.value = true
}

async function handleDeleteType() {
    if (!deleteTypeTarget.value) return
    const uuid = deleteTypeTarget.value.uuid
    busy.value = true
    const ok = await perform(() => resourceService.deleteType(uuid), 'Type deleted', 'Could not delete the type', [refetchTypes])
    busy.value = false
    if (ok) deleteTypeOpen.value = false
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

const endTarget = ref<ResourceRecord | null>(null)
const endOpen = ref(false)
function askEnd(resource: ResourceRecord) {
    if (!resource.active_usage) return
    endTarget.value = resource
    endOpen.value = true
}

async function handleEnd() {
    const usage = endTarget.value?.active_usage
    if (!usage) return
    busy.value = true
    const ok = await perform(() => resourceService.endSession(usage.uuid), 'Session ended', 'Could not end session', refreshAll())
    busy.value = false
    if (ok) endOpen.value = false
}

const toggleTarget = ref<ResourceRecord | null>(null)
const toggleOpen = ref(false)
const toggleNext = computed(() => toggleTarget.value?.status === 'Unavailable' ? 'Available' : 'Unavailable')
function askToggle(resource: ResourceRecord) {
    toggleTarget.value = resource
    toggleOpen.value = true
}

async function handleToggle() {
    const resource = toggleTarget.value
    if (!resource) return
    const next = toggleNext.value
    busy.value = true
    const ok = await perform(() => resourceService.updateResource(resource.uuid, { status: next }), `Marked ${next.toLowerCase()}`, 'Could not update resource', [refetchResources])
    busy.value = false
    if (ok) toggleOpen.value = false
}

const deleteTarget = ref<ResourceRecord | null>(null)
const deleteOpen = ref(false)
const askDelete = (resource: ResourceRecord) => {
    deleteTarget.value = resource
    deleteOpen.value = true
}

async function handleDelete() {
    if (!deleteTarget.value) return
    const resUuid = deleteTarget.value.uuid
    busy.value = true
    const ok = await perform(() => resourceService.deleteResource(resUuid), 'Resource deleted', 'Could not delete resource', [refetchResources, refetchTypes])
    busy.value = false
    if (ok) deleteOpen.value = false
}
</script>
