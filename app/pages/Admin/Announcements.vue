<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Announcements</h1>
            <p class="dashboard-heading mt-1 text-crimson">Notices that show at the top of the student home page, the librarian dashboard, or both.</p>
        </div>

        <div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
            <div class="flex-1"></div>
            <ButtonsButton variant="primary" class="toolbar-full" @click="openCreate">
                <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />New announcement
            </ButtonsButton>
        </div>

        <div v-if="pending && !data" class="space-y-3" aria-busy="true">
            <div v-for="n in 3" :key="n" class="h-[110px] animate-pulse rounded-2xl bg-stone-200/70" />
        </div>

        <p v-else-if="!list.length" class="rounded-2xl border border-stone-200 bg-white px-4 py-12 text-center text-[15px] text-stone-500">
            No announcements yet. Post one when the library closes early, a new service starts, or anything people should see.
        </p>

        <ul v-else class="space-y-3">
            <li v-for="a in list" :key="a.uuid" class="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5" :class="a.isActive ? '' : 'opacity-70'">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <h2 class="text-[16px] font-bold leading-snug text-stone-900">{{ a.title }}</h2>
                        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <LibrarianStatusPill :label="audienceLabel[a.audience]" :tone="audienceTone[a.audience]" />
                            <LibrarianStatusPill :label="a.isActive ? 'Showing' : 'Ended'" :tone="a.isActive ? 'success' : 'neutral'" />
                            <span class="text-[12.5px] text-stone-500">{{ a.expiresAt ? `Until ${formatDate(a.expiresAt)}` : 'No end date' }}</span>
                        </div>
                    </div>
                    <LibrarianRowMenu :items="menuFor()" :label="`More actions for ${a.title}`" @select="(key: string) => onMenu(key, a)" />
                </div>
                <p class="mt-3 whitespace-pre-line text-[14px] leading-snug text-stone-600">{{ a.body }}</p>
            </li>
        </ul>

        <AdminAnnouncementFormModal :open="isFormOpen" :announcement="editing" :busy="busy" :server-errors="serverErrors"
            @close="isFormOpen = false" @submit="save" />

        <LibrarianConfirmModal :open="isDeleteOpen" title="Remove this announcement?"
            :message="`“${target?.title ?? 'This announcement'}” stops showing for everyone right away.`"
            confirm-label="Remove" :loading="busy" @close="isDeleteOpen = false" @confirm="remove" />

        <AlertToast />
    </div>
</template>

<script setup lang="ts">
import { announcementService, type Announcement, type AnnouncementAudience, type AnnouncementPayload } from '~/services/announcementService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({ middleware: 'admin', layout: 'librarian' })
useHead({ title: 'Announcements' })

const alert = useAlert()
const { perform } = useAction()

const audienceLabel: Record<AnnouncementAudience, string> = { everyone: 'Everyone', students: 'Students and members', staff: 'Staff' }
const audienceTone: Record<AnnouncementAudience, 'info' | 'success' | 'warning'> = { everyone: 'info', students: 'success', staff: 'warning' }

const { data, pending, execute: refetch } = useAsyncData('admin-announcements', () => announcementService.all(), { lazy: true })
const list = computed(() => data.value?.announcements ?? [])

const isFormOpen = ref(false)
const editing = ref<Announcement | null>(null)
const busy = ref(false)
const serverErrors = ref<Record<string, string>>({})

function openCreate() {
    editing.value = null
    serverErrors.value = {}
    isFormOpen.value = true
}

function menuFor() {
    return [
        { key: 'edit', label: 'Edit', icon: 'i-tabler-pencil' },
        { key: 'delete', label: 'Remove', icon: 'i-tabler-trash', tone: 'danger' as const, separator: true },
    ]
}

const target = ref<Announcement | null>(null)
const isDeleteOpen = ref(false)

function onMenu(key: string, a: Announcement) {
    target.value = a
    if (key === 'edit') {
        editing.value = a
        serverErrors.value = {}
        isFormOpen.value = true
    } else if (key === 'delete') {
        isDeleteOpen.value = true
    }
}

async function save(payload: AnnouncementPayload) {
    busy.value = true
    serverErrors.value = {}
    try {
        if (editing.value) await announcementService.update(editing.value.uuid, payload)
        else await announcementService.create(payload)
        alert.success(editing.value ? 'Announcement updated' : 'Announcement posted')
        isFormOpen.value = false
        await refetch()
    } catch (error) {
        const fields = serverFieldErrors(error)
        if (fields) serverErrors.value = fields
        else alert.error('Could not save the announcement', apiErrorMessage(error))
    } finally {
        busy.value = false
    }
}

async function remove() {
    const a = target.value
    if (!a) return
    busy.value = true
    const ok = await perform(() => announcementService.remove(a.uuid), 'Announcement removed', 'Could not remove the announcement', [refetch])
    busy.value = false
    if (ok) isDeleteOpen.value = false
}
</script>
