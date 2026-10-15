<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Admin overview</h1>
            <p class="dashboard-heading mt-1 text-crimson">Accounts, roles and what has been changed lately.</p>
        </div>

        <div class="phone-stats mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <LibrarianCatalogStatTile label="Staff accounts" :value="staffTotal" icon="i-tabler-id-badge-2" tone="accent" />
            <LibrarianCatalogStatTile label="Faculty and staff" :value="memberTotal" icon="i-tabler-users" tone="success" />
            <LibrarianCatalogStatTile label="Students" :value="overview?.members.student ?? '—'" icon="i-tabler-school" tone="warning" />
            <LibrarianCatalogStatTile label="Disabled accounts" :value="disabledTotal" icon="i-tabler-user-off" tone="danger" />
        </div>

        <section aria-label="Shortcuts" class="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <NuxtLink v-for="s in shortcuts" :key="s.label" :to="s.to"
                class="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-[transform,border-color,box-shadow] duration-150 ease-out hover:border-accent-200 hover:shadow-card active:scale-[.98]">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 transition-colors duration-150 group-hover:bg-accent-100">
                    <Icon :name="s.icon" class="h-5 w-5" />
                </span>
                <span class="min-w-0 flex-1">
                    <span class="block text-[14.5px] font-semibold text-stone-900">{{ s.label }}</span>
                    <span class="block truncate text-[12.5px] text-stone-500">{{ s.hint }}</span>
                </span>
            </NuxtLink>
        </section>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div class="mb-3 flex items-center justify-between gap-2">
                    <h2 class="font-bold text-crimson">Recent activity</h2>
                    <NuxtLink to="/admin/audit-log" class="text-[13px] font-semibold text-accent-600 hover:underline">View all</NuxtLink>
                </div>

                <p v-if="pending && !overview" class="py-6 text-center text-[14px] text-stone-400">Loading…</p>
                <p v-else-if="!overview?.recentActivity.length" class="py-6 text-center text-[14px] text-stone-400">Nothing has been recorded yet.</p>
                <ul v-else class="divide-y divide-stone-100">
                    <li v-for="entry in overview.recentActivity" :key="entry.logID" class="py-3">
                        <p class="text-[14.5px] leading-snug text-stone-900">{{ entry.summary }}</p>
                        <p class="mt-0.5 text-[12.5px] text-stone-500">
                            <span class="font-semibold text-stone-700">{{ entry.actorName }}</span>
                            <span class="text-stone-300"> · </span><span class="font-data">{{ formatDateTime(entry.created_at) }}</span>
                        </p>
                    </li>
                </ul>
            </section>

            <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 class="mb-3 font-bold text-crimson">Who has access</h2>
                <dl class="divide-y divide-stone-100 text-[14.5px]">
                    <div v-for="row in breakdown" :key="row.label" class="flex items-center justify-between py-2.5">
                        <dt class="text-stone-600">{{ row.label }}</dt>
                        <dd class="font-bold tabular-nums text-stone-900">{{ row.value }}</dd>
                    </div>
                </dl>
                <p v-if="overview?.pendingRegistrations"
                    class="mt-4 rounded-xl bg-amber-50 px-3.5 py-3 text-[13.5px] font-semibold text-amber-900">
                    {{ overview.pendingRegistrations }} student {{ overview.pendingRegistrations === 1 ? 'registration is' : 'registrations are' }} waiting for a librarian
                </p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { adminService } from '~/services/adminService'

definePageMeta({ middleware: 'admin', layout: 'librarian' })
useHead({ title: 'Admin overview' })

const { data: overview, pending } = useLiveAsyncData('admin-overview', () => adminService.overview(), { lazy: true, pollMs: 60_000 })

const staffTotal = computed(() => (overview.value ? overview.value.staff.admin + overview.value.staff.librarian + overview.value.staff.assistant : '—'))
const memberTotal = computed(() => (overview.value ? overview.value.members.faculty + overview.value.members.staff : '—'))
const disabledTotal = computed(() => (overview.value ? overview.value.staff.disabled + overview.value.members.disabled : '—'))

const breakdown = computed(() => [
    { label: 'Administrators', value: overview.value?.staff.admin ?? '—' },
    { label: 'Librarians', value: overview.value?.staff.librarian ?? '—' },
    { label: 'Student assistants', value: overview.value?.staff.assistant ?? '—' },
    { label: 'Faculty members', value: overview.value?.members.faculty ?? '—' },
    { label: 'Staff members', value: overview.value?.members.staff ?? '—' },
])

const shortcuts = [
    { label: 'Add a staff account', hint: 'A librarian or student assistant', icon: 'i-tabler-user-plus', to: '/admin/staff?new=1' },
    { label: 'Add faculty or staff', hint: 'A member who borrows', icon: 'i-tabler-users-plus', to: '/admin/members?new=1' },
    { label: 'Roles and permissions', hint: 'What each role can use', icon: 'i-tabler-shield-lock', to: '/admin/roles' },
    { label: 'Audit log', hint: 'Who changed what', icon: 'i-tabler-history', to: '/admin/audit-log' },
]
</script>
