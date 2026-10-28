<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Roles and permissions</h1>
            <p class="dashboard-heading mt-1 text-crimson">Choose which parts of the librarian side each role can use.</p>
        </div>

        <p class="mb-5 flex items-start gap-2.5 rounded-xl bg-stone-100 px-4 py-3 text-[13.5px] text-stone-700">
            <Icon name="i-tabler-info-circle" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Administrators always have everything. A change here applies to everyone with that role straight away, and it's recorded in the audit log.
        </p>

        <div v-if="pending && !data" class="grid gap-4 lg:grid-cols-3" aria-busy="true">
            <div v-for="n in 3" :key="n" class="h-[420px] animate-pulse rounded-2xl bg-stone-200/70" />
        </div>

        <div v-else-if="data" class="grid items-start gap-4 lg:grid-cols-3">
            <section v-for="role in data.roles" :key="role.role" class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <header class="mb-1 flex items-start justify-between gap-3">
                    <div>
                        <h2 class="font-bold text-crimson">{{ role.label }}</h2>
                        <p class="text-[13px] text-stone-500">{{ blurb[role.role] }}</p>
                    </div>
                    <LibrarianStatusPill v-if="!role.editable" label="Always everything" tone="info" />
                </header>

                <ul class="mt-4 divide-y divide-stone-100" :aria-label="`What the ${role.label} role can do`">
                    <li v-for="p in data.permissions" :key="p.key">
                        <label class="flex items-start gap-3 py-2.5" :class="role.editable ? 'cursor-pointer' : 'cursor-default'">
                            <input type="checkbox" class="mt-1 h-4 w-4 shrink-0 accent-accent-500" :disabled="!role.editable || savingRole === role.role"
                                :checked="isOn(role, p.key)" @change="toggle(role, p.key, ($event.target as HTMLInputElement).checked)" />
                            <span class="min-w-0 text-[14px] leading-snug" :class="isOn(role, p.key) ? 'text-stone-900' : 'text-stone-500'">{{ p.label }}</span>
                        </label>
                    </li>
                </ul>

                <div v-if="role.editable" class="mt-4 flex items-center justify-between gap-3">
                    <p class="text-[12.5px]" :class="isDirty(role) ? 'font-semibold text-amber-700' : 'text-stone-500'">{{ isDirty(role) ? 'Unsaved changes' : 'Saved' }}</p>
                    <div class="flex gap-2">
                        <ButtonsButton variant="ghost" size="sm" :disabled="!isDirty(role) || savingRole === role.role" @click="undo(role)">Undo</ButtonsButton>
                        <ButtonsButton variant="primary" size="sm" :disabled="!isDirty(role) || savingRole === role.role" @click="save(role)">
                            <Icon v-if="savingRole === role.role" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />Save
                        </ButtonsButton>
                    </div>
                </div>
            </section>
        </div>

        <div v-else-if="error" role="alert" class="rounded-2xl border border-red-100 bg-red-50 p-5 text-[15px] text-red-600">
            <p class="font-semibold">Couldn't load the roles.</p>
            <ButtonsButton variant="ghost" class="mt-3" @click="refetch()">Try again</ButtonsButton>
        </div>

        <AlertToast />
    </div>
</template>

<script setup lang="ts">
import { adminService, type RoleRow, type StaffRole } from '~/services/adminService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({ middleware: 'admin', layout: 'librarian' })
useHead({ title: 'Roles and permissions' })

const { perform } = useAction()

const blurb: Record<StaffRole, string> = {
    admin: 'Runs the system, including this side.',
    librarian: 'Runs the library day to day.',
    assistant: 'A student assistant at the desk.',
}

const { data, pending, error, execute: refetch } = useAsyncData('admin-roles', () => adminService.roles(), { lazy: true })

// Unsaved ticks per role. A role with no entry here simply shows what is saved.
const draft = reactive<Record<string, string[]>>({})

const listFor = (role: RoleRow) => draft[role.role] ?? role.permissions
const isOn = (role: RoleRow, key: string) => (role.editable ? listFor(role).includes(key) : true)

function toggle(role: RoleRow, key: string, on: boolean) {
    const list = new Set(listFor(role))
    if (on) list.add(key)
    else list.delete(key)
    draft[role.role] = [...list]
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))
const isDirty = (role: RoleRow) => role.role in draft && !sameSet(draft[role.role]!, role.permissions)

function undo(role: RoleRow) {
    delete draft[role.role]
}

const savingRole = ref<StaffRole | null>(null)

async function save(role: RoleRow) {
    savingRole.value = role.role
    await perform(async () => {
        data.value = await adminService.saveRole(role.role, listFor(role))
        delete draft[role.role]
        return { message: `The ${role.label} role was updated.` }
    }, 'Role saved', 'Could not save the role')
    savingRole.value = null
}
</script>
