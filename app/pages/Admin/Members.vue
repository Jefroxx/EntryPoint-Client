<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Faculty and staff</h1>
            <p class="dashboard-heading mt-1 text-crimson">Members who borrow and visit like students. You create their accounts; they have no points or rewards.</p>
        </div>

        <LibrarianSegmentedTabs v-model="tab" class="mb-5" :tabs="[
            { label: 'All', value: 'all' },
            { label: 'Faculty', value: 'faculty' },
            { label: 'Staff', value: 'staff' },
        ]" />

        <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
            <LibrarianSearchInput id="member-search" v-model="search" placeholder="Search name, employee ID or department" />
            <div class="flex-1"></div>
            <LibrarianResetFiltersButton @click="search = ''" />
            <ButtonsButton variant="ghost" @click="isImportOpen = true">
                <Icon name="i-tabler-file-import" class="h-3.5 w-3.5" />Import CSV
            </ButtonsButton>
            <ButtonsButton variant="primary" @click="openCreate">
                <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add member
            </ButtonsButton>
        </div>

        <LibrarianTableShell :columns="['Name', 'Employee ID', 'Type', 'Department', 'Email', 'Status', '']" :loading="pending && !page"
            :empty="rows.length === 0" :empty-text="emptyText" min-width="980px">
            <!-- Phones: one card per member. -->
            <template #cards>
                <li v-for="member in rows" :key="`card-${member.uuid}`" class="px-4 py-3.5" :class="member.isDisabled ? 'bg-stone-50/70' : ''">
                    <div class="flex items-start gap-3">
                        <LibrarianStudentAvatar :name="member.name" />
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-[15px] font-semibold text-stone-900">{{ member.name }}</p>
                            <p class="font-data text-[12px] text-stone-500">{{ member.employeeIDNumber }}</p>
                            <p class="truncate text-[13px] text-stone-500">{{ member.department || '—' }}</p>
                            <p class="truncate text-[12.5px] text-stone-500">{{ member.email }}</p>
                            <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <LibrarianStatusPill :label="typeLabel[member.memberType]" tone="info" />
                                <LibrarianStatusPill :label="member.isDisabled ? 'Disabled' : 'Active'" :tone="member.isDisabled ? 'danger' : 'success'" />
                            </div>
                        </div>
                        <LibrarianRowMenu :items="menuFor(member)" :label="`More actions for ${member.name}`" @select="(key: string) => onMenu(key, member)" />
                    </div>
                </li>
            </template>

            <tr v-for="(member, index) in rows" :key="member.uuid" class="row-fade-in border-b border-stone-100 last:border-0"
                :class="member.isDisabled ? 'bg-stone-50/70' : ''" :style="{ animationDelay: `${index * 30}ms` }">
                <td class="px-4 py-3"><LibrarianPersonCell :name="member.name" /></td>
                <td class="font-data px-4 py-3 text-[13.5px] text-stone-600">{{ member.employeeIDNumber }}</td>
                <td class="px-4 py-3"><LibrarianStatusPill :label="typeLabel[member.memberType]" tone="info" /></td>
                <td class="px-4 py-3 text-[14px] text-stone-600">{{ member.department || '—' }}</td>
                <td class="font-data px-4 py-3 text-[13px] text-stone-500">{{ member.email }}</td>
                <td class="px-4 py-3"><LibrarianStatusPill :label="member.isDisabled ? 'Disabled' : 'Active'" :tone="member.isDisabled ? 'danger' : 'success'" /></td>
                <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1.5">
                        <ButtonsButton variant="ghost" size="sm" @click="openEdit(member)">Edit</ButtonsButton>
                        <LibrarianRowMenu :items="menuFor(member)" :label="`More actions for ${member.name}`" @select="(key: string) => onMenu(key, member)" />
                    </div>
                </td>
            </tr>
        </LibrarianTableShell>

        <div v-if="page" class="mt-3 flex items-center justify-between text-[13.5px] text-stone-500">
            <span>Showing {{ rows.length }} of {{ page.total }} members</span>
            <span>Page {{ page.current_page }} of {{ page.last_page }}</span>
        </div>

        <div v-if="page && page.last_page > 1" class="mt-3 flex items-center justify-center gap-2">
            <ButtonsButton variant="ghost" size="sm" :disabled="page.current_page <= 1" @click="pageNumber--">
                <Icon name="i-tabler-chevron-left" class="h-3.5 w-3.5" />Previous
            </ButtonsButton>
            <ButtonsButton variant="ghost" size="sm" :disabled="page.current_page >= page.last_page" @click="pageNumber++">
                Next<Icon name="i-tabler-chevron-right" class="h-3.5 w-3.5" />
            </ButtonsButton>
        </div>

        <AdminMemberFormModal :open="isFormOpen" :member="editing" :busy="busy" :server-errors="serverErrors"
            @close="isFormOpen = false" @submit="save" />

        <AdminImportMembersModal :open="isImportOpen" @close="isImportOpen = false" @imported="refetch" />

        <AdminCredentialsModal :open="isCredentialsOpen" :title="credentialsTitle" :credentials="credentials" @close="isCredentialsOpen = false" />

        <LibrarianConfirmModal :open="isDisableOpen" title="Disable this account?"
            :message="`${target?.name ?? 'This member'} will be signed out right away and can't sign in or borrow until you enable the account again. Their records stay as they are.`"
            confirm-label="Disable account" :loading="busy" @close="isDisableOpen = false" @confirm="disable" />

        <LibrarianConfirmModal :open="isResetOpen" title="Reset this password?"
            :message="`${target?.name ?? 'This member'} gets a new temporary password and is signed out everywhere. The old password stops working. You'll see the new one once.`"
            confirm-label="Reset password" :danger="false" :loading="busy" @close="isResetOpen = false" @confirm="reset" />

        <AlertToast />
    </div>
</template>

<script setup lang="ts">
import { adminService, type MemberAccount, type MemberKind, type MemberPayload } from '~/services/adminService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'
import type { Credentials } from '~/components/admin/CredentialsModal.vue'

definePageMeta({ middleware: 'admin', layout: 'librarian' })
useHead({ title: 'Faculty and staff' })

const route = useRoute()
const { perform } = useAction()
const alert = useAlert()

const typeLabel: Record<MemberKind, string> = { faculty: 'Faculty', staff: 'Staff' }

const tab = ref('all')
const search = ref('')
const debouncedSearch = ref('')
const pageNumber = ref(1)

let timer: ReturnType<typeof setTimeout>
watch(search, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => { debouncedSearch.value = value.trim(); pageNumber.value = 1 }, 300)
})
watch(tab, () => { pageNumber.value = 1 })

const { data: page, pending, execute: refetch } = useAsyncData(
    'admin-members',
    () => adminService.members({ search: debouncedSearch.value, type: tab.value, page: pageNumber.value }),
    { lazy: true, watch: [tab, debouncedSearch, pageNumber] },
)

const rows = computed(() => page.value?.data ?? [])
const emptyText = computed(() => (debouncedSearch.value ? 'No members match your search.' : 'No faculty or staff members yet. Add one to give them a library account.'))

const isImportOpen = ref(false)

/* ---------- create and edit ---------- */
const isFormOpen = ref(false)
const editing = ref<MemberAccount | null>(null)
const busy = ref(false)
const serverErrors = ref<Record<string, string>>({})

function openCreate() {
    editing.value = null
    serverErrors.value = {}
    isFormOpen.value = true
}

function openEdit(member: MemberAccount) {
    editing.value = member
    serverErrors.value = {}
    isFormOpen.value = true
}

// Dashboard shortcut: /admin/members?new=1 opens the form straight away.
onMounted(() => {
    if (route.query.new !== '1') return
    openCreate()
    const url = new URL(window.location.href)
    url.searchParams.delete('new')
    window.history.replaceState(window.history.state, '', url)
})

const isCredentialsOpen = ref(false)
const credentials = ref<Credentials | null>(null)
const credentialsTitle = ref('Temporary password')

async function save(payload: MemberPayload) {
    busy.value = true
    serverErrors.value = {}
    try {
        if (editing.value) {
            await adminService.updateMember(editing.value.uuid, payload)
            alert.success('Member updated')
        } else {
            const created = await adminService.createMember(payload)
            credentials.value = { name: created.account.name, email: created.account.email, password: created.temporaryPassword }
            credentialsTitle.value = 'Member created'
            isCredentialsOpen.value = true
            alert.success('Member created')
        }
        isFormOpen.value = false
        await refetch()
    } catch (error) {
        const fields = serverFieldErrors(error)
        if (fields) serverErrors.value = fields
        else alert.error('Could not save the member', apiErrorMessage(error))
    } finally {
        busy.value = false
    }
}

/* ---------- the row menu ---------- */
function menuFor(member: MemberAccount) {
    return [
        { key: 'edit', label: 'Edit details', icon: 'i-tabler-pencil' },
        { key: 'reset', label: 'Reset password', icon: 'i-tabler-key' },
        member.isDisabled
            ? { key: 'enable', label: 'Enable account', icon: 'i-tabler-user-check', separator: true }
            : { key: 'disable', label: 'Disable account', icon: 'i-tabler-user-off', tone: 'danger' as const, separator: true },
    ]
}

const target = ref<MemberAccount | null>(null)
const isDisableOpen = ref(false)
const isResetOpen = ref(false)

function onMenu(key: string, member: MemberAccount) {
    target.value = member
    if (key === 'edit') openEdit(member)
    else if (key === 'reset') isResetOpen.value = true
    else if (key === 'disable') isDisableOpen.value = true
    else if (key === 'enable') void enable(member)
}

async function disable() {
    const member = target.value
    if (!member) return
    busy.value = true
    const ok = await perform(() => adminService.setMemberDisabled(member.uuid, true), 'Account disabled', 'Could not disable the account', [refetch])
    busy.value = false
    if (ok) isDisableOpen.value = false
}

async function enable(member: MemberAccount) {
    await perform(() => adminService.setMemberDisabled(member.uuid, false), 'Account enabled', 'Could not enable the account', [refetch])
}

async function reset() {
    const member = target.value
    if (!member) return
    busy.value = true
    try {
        const result = await adminService.resetMemberPassword(member.uuid)
        isResetOpen.value = false
        credentials.value = { name: member.name, email: member.email, password: result.temporaryPassword }
        credentialsTitle.value = 'Password reset'
        isCredentialsOpen.value = true
    } catch (error) {
        alert.error('Could not reset the password', apiErrorMessage(error))
    } finally {
        busy.value = false
    }
}
</script>
