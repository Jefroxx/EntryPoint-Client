<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Staff accounts</h1>
            <p class="dashboard-heading mt-1 text-crimson">Librarians and student assistants who sign in to the librarian side.</p>
        </div>

        <div class="phone-stats mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <LibrarianCatalogStatTile label="Administrators" :value="countOf('admin')" icon="i-tabler-shield-lock" tone="accent" />
            <LibrarianCatalogStatTile label="Librarians" :value="countOf('librarian')" icon="i-tabler-book-2" tone="success" />
            <LibrarianCatalogStatTile label="Student assistants" :value="countOf('assistant')" icon="i-tabler-user-check" tone="warning" />
            <LibrarianCatalogStatTile label="Disabled" :value="disabledCount" icon="i-tabler-user-off" tone="danger" />
        </div>

        <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
            <LibrarianSearchInput id="staff-search" v-model="search" placeholder="Search name or email" />
            <div class="flex-1"></div>
            <LibrarianResetFiltersButton @click="search = ''" />
            <ButtonsButton variant="primary" @click="openCreate">
                <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add staff account
            </ButtonsButton>
        </div>

        <LibrarianTableShell :columns="['Name', 'Email', 'Role', 'Status', '']" :loading="pending && !data" :empty="shown.length === 0"
            :empty-text="search ? 'No staff accounts match your search.' : 'No staff accounts yet.'" min-width="760px">
            <!-- Phones: one card per account. -->
            <template #cards>
                <li v-for="account in shown" :key="`card-${account.uuid}`" class="px-4 py-3.5" :class="account.isDisabled ? 'bg-stone-50/70' : ''">
                    <div class="flex items-start gap-3">
                        <LibrarianStudentAvatar :name="account.name" />
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-[15px] font-semibold text-stone-900">{{ account.name }}<span v-if="account.isYou" class="ml-1.5 text-[12px] font-bold text-accent-600">You</span></p>
                            <p class="truncate text-[13px] text-stone-500">{{ account.email }}</p>
                            <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <LibrarianStatusPill :label="account.roleLabel" :tone="roleTone[account.role]" />
                                <LibrarianStatusPill :label="account.isDisabled ? 'Disabled' : 'Active'" :tone="account.isDisabled ? 'danger' : 'success'" />
                            </div>
                        </div>
                        <LibrarianRowMenu :items="menuFor(account)" :label="`More actions for ${account.name}`" @select="(key: string) => onMenu(key, account)" />
                    </div>
                </li>
            </template>

            <tr v-for="(account, index) in shown" :key="account.uuid" class="row-fade-in border-b border-stone-100 last:border-0"
                :class="account.isDisabled ? 'bg-stone-50/70' : ''" :style="{ animationDelay: `${index * 30}ms` }">
                <td class="px-4 py-3">
                    <LibrarianPersonCell :name="account.name" :sub="account.isYou ? 'This is you' : undefined" />
                </td>
                <td class="font-data px-4 py-3 text-[13.5px] text-stone-600">{{ account.email }}</td>
                <td class="px-4 py-3"><LibrarianStatusPill :label="account.roleLabel" :tone="roleTone[account.role]" /></td>
                <td class="px-4 py-3"><LibrarianStatusPill :label="account.isDisabled ? 'Disabled' : 'Active'" :tone="account.isDisabled ? 'danger' : 'success'" /></td>
                <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1.5">
                        <ButtonsButton variant="ghost" size="sm" @click="openEdit(account)">Edit</ButtonsButton>
                        <LibrarianRowMenu :items="menuFor(account)" :label="`More actions for ${account.name}`" @select="(key: string) => onMenu(key, account)" />
                    </div>
                </td>
            </tr>
        </LibrarianTableShell>

        <AdminStaffFormModal :open="isFormOpen" :account="editing" :busy="busy" :server-errors="serverErrors"
            @close="isFormOpen = false" @submit="save" />

        <AdminCredentialsModal :open="isCredentialsOpen" :title="credentialsTitle" :credentials="credentials" @close="isCredentialsOpen = false" />

        <LibrarianConfirmModal :open="isDisableOpen" title="Disable this account?"
            :message="`${target?.name ?? 'This account'} will be signed out right away and can't sign in until you enable the account again. Their records stay as they are.`"
            confirm-label="Disable account" :loading="busy" @close="isDisableOpen = false" @confirm="disable" />

        <LibrarianConfirmModal :open="isResetOpen" title="Reset this password?"
            :message="`${target?.name ?? 'This account'} gets a new temporary password and is signed out everywhere. The old password stops working. You'll see the new one once.`"
            confirm-label="Reset password" :danger="false" :loading="busy" @close="isResetOpen = false" @confirm="reset" />

        <AlertToast />
    </div>
</template>

<script setup lang="ts">
import { adminService, type StaffAccount, type StaffPayload, type StaffRole } from '~/services/adminService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'
import type { Credentials } from '~/components/admin/CredentialsModal.vue'

definePageMeta({ middleware: 'admin', layout: 'librarian' })
useHead({ title: 'Staff accounts' })

const route = useRoute()
const { perform } = useAction()
const alert = useAlert()

const search = ref('')
const { data, pending, execute: refetch } = useAsyncData('admin-staff', () => adminService.staff(), { lazy: true })

const all = computed(() => data.value?.staff ?? [])
const shown = computed(() => {
    const q = search.value.trim().toLowerCase()
    return q ? all.value.filter((a) => `${a.name} ${a.email} ${a.roleLabel}`.toLowerCase().includes(q)) : all.value
})
const countOf = (role: StaffRole) => (data.value ? all.value.filter((a) => a.role === role).length : '—')
const disabledCount = computed(() => (data.value ? all.value.filter((a) => a.isDisabled).length : '—'))

const roleTone: Record<StaffRole, 'info' | 'neutral' | 'warning'> = { admin: 'info', librarian: 'neutral', assistant: 'warning' }

/* ---------- create and edit ---------- */
const isFormOpen = ref(false)
const editing = ref<StaffAccount | null>(null)
const busy = ref(false)
const serverErrors = ref<Record<string, string>>({})

function openCreate() {
    editing.value = null
    serverErrors.value = {}
    isFormOpen.value = true
}

function openEdit(account: StaffAccount) {
    editing.value = account
    serverErrors.value = {}
    isFormOpen.value = true
}

// Dashboard shortcut: /admin/staff?new=1 opens the form straight away.
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

async function save(payload: StaffPayload) {
    busy.value = true
    serverErrors.value = {}
    try {
        if (editing.value) {
            await adminService.updateStaff(editing.value.uuid, payload)
            alert.success('Account updated')
        } else {
            const created = await adminService.createStaff(payload)
            credentials.value = { name: created.account.name, email: created.account.email, password: created.temporaryPassword }
            credentialsTitle.value = 'Account created'
            isCredentialsOpen.value = true
            alert.success('Account created')
        }
        isFormOpen.value = false
        await refetch()
    } catch (error) {
        const fields = serverFieldErrors(error)
        if (fields) serverErrors.value = fields
        else alert.error('Could not save the account', apiErrorMessage(error))
    } finally {
        busy.value = false
    }
}

/* ---------- the row menu ---------- */
function menuFor(account: StaffAccount) {
    return [
        { key: 'edit', label: 'Edit details', icon: 'i-tabler-pencil' },
        { key: 'reset', label: 'Reset password', icon: 'i-tabler-key' },
        account.isDisabled
            ? { key: 'enable', label: 'Enable account', icon: 'i-tabler-user-check', separator: true }
            : { key: 'disable', label: 'Disable account', icon: 'i-tabler-user-off', tone: 'danger' as const, separator: true, disabled: account.isYou },
    ]
}

const target = ref<StaffAccount | null>(null)
const isDisableOpen = ref(false)
const isResetOpen = ref(false)

function onMenu(key: string, account: StaffAccount) {
    target.value = account
    if (key === 'edit') openEdit(account)
    else if (key === 'reset') isResetOpen.value = true
    else if (key === 'disable') isDisableOpen.value = true
    else if (key === 'enable') void enable(account)
}

async function disable() {
    const account = target.value
    if (!account) return
    busy.value = true
    const ok = await perform(() => adminService.setStaffDisabled(account.uuid, true), 'Account disabled', 'Could not disable the account', [refetch])
    busy.value = false
    if (ok) isDisableOpen.value = false
}

async function enable(account: StaffAccount) {
    await perform(() => adminService.setStaffDisabled(account.uuid, false), 'Account enabled', 'Could not enable the account', [refetch])
}

async function reset() {
    const account = target.value
    if (!account) return
    busy.value = true
    try {
        const result = await adminService.resetStaffPassword(account.uuid)
        isResetOpen.value = false
        credentials.value = { name: account.name, email: account.email, password: result.temporaryPassword }
        credentialsTitle.value = 'Password reset'
        isCredentialsOpen.value = true
    } catch (error) {
        alert.error('Could not reset the password', apiErrorMessage(error))
    } finally {
        busy.value = false
    }
}
</script>
