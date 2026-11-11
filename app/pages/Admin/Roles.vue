<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Roles and permissions</h1>
            <p class="dashboard-heading mt-1 text-crimson">Choose which parts of the librarian side each role can use.</p>
        </div>

        <p class="mb-5 flex items-start gap-2.5 rounded-xl bg-stone-100 px-4 py-3 text-[13.5px] text-stone-700">
            <Icon name="i-tabler-info-circle" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Administrators always have everything. Tick or untick what you need, then save everything at once with the Save changes button below. A change applies to everyone with that role straight away, and it's recorded in the audit log.
        </p>

        <div v-if="pending && !data" class="grid gap-4 lg:grid-cols-3" aria-busy="true">
            <div v-for="n in 3" :key="n" class="h-[420px] animate-pulse rounded-2xl bg-stone-200/70" />
        </div>

        <template v-else-if="data">
            <div class="grid items-start gap-4 lg:grid-cols-3">
                <section v-for="role in data.roles" :key="role.role" class="rounded-2xl border bg-white p-5 shadow-sm transition-colors"
                    :class="isDirty(role) ? 'border-amber-300' : 'border-stone-200'">
                    <header class="mb-1 flex items-start justify-between gap-3">
                        <div>
                            <h2 class="font-bold text-crimson">{{ role.label }}</h2>
                            <p class="text-[13px] text-stone-500">{{ blurb[role.role] }}</p>
                        </div>
                        <LibrarianStatusPill v-if="!role.editable" label="Always everything" tone="info" />
                        <LibrarianStatusPill v-else-if="isDirty(role)" label="Unsaved" tone="warning" />
                    </header>

                    <ul class="mt-4 divide-y divide-stone-100" :aria-label="`What the ${role.label} role can do`">
                        <li v-for="p in data.permissions" :key="p.key">
                            <label class="flex items-start gap-3 py-2.5" :class="role.editable ? 'cursor-pointer' : 'cursor-default'">
                                <input type="checkbox" class="mt-1 h-4 w-4 shrink-0 accent-accent-500" :disabled="!role.editable || saving"
                                    :checked="isOn(role, p.key)" @change="toggle(role, p.key, ($event.target as HTMLInputElement).checked)" />
                                <span class="min-w-0 text-[14px] leading-snug" :class="isOn(role, p.key) ? 'text-stone-900' : 'text-stone-500'">{{ p.label }}</span>
                            </label>
                        </li>
                    </ul>
                </section>
            </div>

            <!-- One Save for the whole page. It stays in view while you scroll through the lists. -->
            <div class="sticky bottom-3 z-20 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 shadow-overlay max-sm:bottom-2"
                :class="hasChanges ? 'border-amber-300' : 'border-stone-200'">
                <p class="text-[13.5px]" :class="hasChanges ? 'font-semibold text-amber-700' : 'text-stone-500'">
                    <template v-if="hasChanges">Unsaved changes in {{ dirtyRoles.map((r) => r.label).join(' and ') }}</template>
                    <template v-else>All changes saved</template>
                </p>
                <div class="flex gap-2 max-sm:w-full max-sm:[&>*]:flex-1">
                    <ButtonsButton variant="ghost" :disabled="!hasChanges || saving" @click="isDiscardOpen = true">Undo all</ButtonsButton>
                    <ButtonsButton variant="primary" :disabled="!hasChanges || saving" @click="isConfirmOpen = true">Save changes</ButtonsButton>
                </div>
            </div>
        </template>

        <div v-else-if="error" role="alert" class="rounded-2xl border border-red-100 bg-red-50 p-5 text-[15px] text-red-600">
            <p class="font-semibold">Couldn't load the roles.</p>
            <ButtonsButton variant="ghost" class="mt-3" @click="refetch()">Try again</ButtonsButton>
        </div>

        <!-- Look over what will change before it is saved (opened from the page's own button, so nothing is stacked). -->
        <LibrarianModalShell :open="isConfirmOpen" size="md" title="Save These Changes?"
            subtitle="They apply to everyone with these roles straight away." :busy="saving" @close="isConfirmOpen = false">
            <div class="space-y-4">
                <section v-for="c in changes" :key="c.role" class="rounded-xl border border-stone-200 bg-white p-4">
                    <h3 class="text-[15px] font-bold text-crimson">{{ c.label }}</h3>
                    <ul class="mt-2 space-y-1.5">
                        <li v-for="label in c.on" :key="`on-${label}`" class="flex items-start gap-2 text-[14px] text-stone-800">
                            <Icon name="i-tabler-circle-plus" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                            <span><b class="font-semibold text-emerald-700">Can now:</b> {{ label }}</span>
                        </li>
                        <li v-for="label in c.off" :key="`off-${label}`" class="flex items-start gap-2 text-[14px] text-stone-800">
                            <Icon name="i-tabler-circle-minus" class="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                            <span><b class="font-semibold text-red-600">Can no longer:</b> {{ label }}</span>
                        </li>
                    </ul>
                </section>
            </div>

            <template #footer>
                <ButtonsButton variant="ghost" :disabled="saving" @click="isConfirmOpen = false">Back</ButtonsButton>
                <ButtonsButton variant="primary" :disabled="saving" @click="save">
                    <Icon v-if="saving" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
                    Yes, save changes
                </ButtonsButton>
            </template>
        </LibrarianModalShell>

        <!-- Undo all throws the unsaved ticks away, so it asks first (a button on the page itself, nothing else open). -->
        <LibrarianConfirmModal :open="isDiscardOpen" title="Discard These Changes?"
            :message="`Your unsaved changes to ${dirtyRoles.map((r) => r.label).join(' and ')} will be thrown away, and the roles go back to what was last saved.`"
            confirm-label="Yes, discard changes" @close="isDiscardOpen = false" @confirm="discard" />

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

// ---- the one Save for every role ----
const dirtyRoles = computed(() => (data.value?.roles ?? []).filter(isDirty))
const hasChanges = computed(() => dirtyRoles.value.length > 0)

/** What each changed role gains and loses, in the words the screen uses, for the confirmation. */
const changes = computed(() => {
    const labelOf = (key: string) => data.value?.permissions.find((p) => p.key === key)?.label ?? key
    return dirtyRoles.value.map((role) => {
        const next = draft[role.role] ?? []
        return {
            role: role.role,
            label: role.label,
            on: next.filter((k) => !role.permissions.includes(k)).map(labelOf),
            off: role.permissions.filter((k) => !next.includes(k)).map(labelOf),
        }
    })
})

function undoAll() {
    for (const key of Object.keys(draft)) delete draft[key]
}

const isConfirmOpen = ref(false)
const isDiscardOpen = ref(false)
const saving = ref(false)

function discard() {
    undoAll()
    isDiscardOpen.value = false
}

async function save() {
    // Only the roles that really changed are sent, each with its full list; the server saves them all or none.
    const payload: Partial<Record<StaffRole, string[]>> = {}
    for (const role of dirtyRoles.value) payload[role.role] = listFor(role)

    saving.value = true
    const ok = await perform(async () => {
        data.value = await adminService.saveRoles(payload)
        undoAll()
        return { message: 'The roles were updated.' }
    }, 'Changes saved', 'Could not save the changes')
    saving.value = false
    if (ok) isConfirmOpen.value = false
}

// Closing the tab with unticked-but-unsaved changes: let the browser ask first.
function warnBeforeLeaving(event: BeforeUnloadEvent) {
    if (!hasChanges.value) return
    event.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', warnBeforeLeaving))
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeLeaving))
</script>
